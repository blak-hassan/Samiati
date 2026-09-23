/**
 * Discover clustering via embeddings.
 *
 * Replaces the original string-similarity clusterer (removed from
 * `process.ts`) with a real semantic dedup pass:
 *
 *   1. `embedRawItems` reads each unembedded `discoverItems` row, calls
 *      the AI router for a vector embedding of (title + description), and
 *      writes the vector back to the row.
 *   2. `clusterByEmbedding` reads embedded-but-not-clustered items and
 *      groups them by approximate-nearest-neighbor. For each unclustered
 *      item, we query the vector index for its top-K neighbors. A
 *      neighbor whose score exceeds the cluster threshold is merged into
 *      the seed's cluster; otherwise the seed forms a new cluster.
 *
 * Why a similarity *threshold* instead of fixed-K: Kenyan news about
 * two different events can score 0.5-0.7 on a multilingual MiniLM, while
 * rephrasings of the same event score 0.8+. A threshold matches that
 * distribution better than a hard K.
 *
 * Cost: each embedding is one HF Inference call (~$0.0001 on free tier
 * for MiniLM-L12). At the current Discover volume (~50-200 items / 15
 * min) this is well under $1/day.
 */
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

const EMBED_BATCH_LIMIT = 50;
const CLUSTER_BATCH_LIMIT = 100;
const CLUSTER_NEIGHBOR_LIMIT = 8;
const CLUSTER_SCORE_THRESHOLD = 0.78; // cosine similarity for "same event"

// =============================================================================
// Embedding pass
// =============================================================================

export const getUnembeddedItems = internalQuery({
    args: { limit: v.number() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("discoverItems")
            .withIndex("by_status", (q) => q.eq("status", "raw"))
            .filter((q) => q.eq(q.field("embedding"), undefined))
            .take(args.limit);
    },
});

export const setItemEmbedding = internalMutation({
    args: {
        itemId: v.id("discoverItems"),
        embedding: v.array(v.number()),
        model: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.itemId, {
            embedding: args.embedding,
            embeddingModel: args.model,
            embeddedAt: Date.now(),
        });
        return args.itemId;
    },
});

/**
 * Compute embeddings for unembedded items and store them. Called from
 * `crons.ts` after `processRawItems`.
 */
export const embedRawItems = internalAction({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args): Promise<{ embedded: number; failed: number }> => {
        const items = await ctx.runQuery(internal.discover.cluster.getUnembeddedItems, {
            limit: args.limit ?? EMBED_BATCH_LIMIT,
        });
        if (items.length === 0) return { embedded: 0, failed: 0 };

        const { routeEmbedding, isFallbackEligible } = await import("../lib/aiRouter");
        const { HF_CONSTANTS } = await import("../lib/providers/huggingface");
        const EMBED_MODEL = HF_CONSTANTS.EMBED_MODEL;

        let embedded = 0;
        let failed = 0;

        for (const item of items) {
            const text = `${item.title}\n\n${item.description}`.slice(0, 4000);
            const result = await routeEmbedding({ text, model: EMBED_MODEL });
            if (result.usage) {
                const { usageToRecordArgs } = await import("../lib/aiUsage");
                const { internal: convexInternal } = await import("../_generated/api");
                try {
                    await ctx.runMutation(
                        convexInternal.lib.aiUsage.recordUsage,
                        usageToRecordArgs(result.usage, result.provider, {
                            ok: result.ok,
                            errorCode: result.ok ? undefined : result.error.code,
                            subject: "discover-cron",
                        }),
                    );
                } catch (e) {
                    console.error("[discover/embed] failed to record usage:", e);
                }
            }
            if (result.ok) {
                await ctx.runMutation(internal.discover.cluster.setItemEmbedding, {
                    itemId: item._id,
                    embedding: result.value.vector,
                    model: result.value.model,
                });
                embedded++;
            } else {
                failed++;
                // Embedding failures are non-fatal — the item will be retried
                // on the next cron run. Transient errors get fallback
                // already; permanent ones (auth_missing) are logged so the
                // operator sees them but don't block the queue.
                if (result.error.code === "auth_missing" || result.error.code === "auth_invalid") {
                    break; // no point hammering with bad credentials
                }
                if (!isFallbackEligible(result.error)) {
                    // bad_response, etc. — don't loop forever
                    break;
                }
            }
        }
        return { embedded, failed };
    },
});

// =============================================================================
// Clustering pass
// =============================================================================

export const getUnclusteredEmbeddedItems = internalQuery({
    args: { limit: v.number() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("discoverItems")
            .withIndex("by_status", (q) => q.eq("status", "raw"))
            .filter((q) => q.neq(q.field("embedding"), undefined))
            .take(args.limit);
    },
});

export const createCluster = internalMutation({
    args: {
        topicTitle: v.string(),
        itemId: v.id("discoverItems"),
        sourceDomain: v.string(),
        category: v.string(),
        country: v.string(),
        publishedAt: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("discoverClusters", {
            topicTitle: args.topicTitle,
            itemIds: [args.itemId],
            sourceDomains: [args.sourceDomain],
            category: args.category,
            country: args.country,
            newestPublishedAt: args.publishedAt,
            sourceCount: 1,
            status: "active",
            trendScore: 0,
            summary: "",
            whyTrending: "",
            suggestedQuery: args.topicTitle,
            imageUrl: undefined,
        });
    },
});

export const appendToCluster = internalMutation({
    args: {
        clusterId: v.id("discoverClusters"),
        itemId: v.id("discoverItems"),
        sourceDomain: v.string(),
        publishedAt: v.number(),
    },
    handler: async (ctx, args) => {
        const cluster = await ctx.db.get(args.clusterId);
        if (!cluster) throw new Error("Cluster not found");
        // Idempotent: skip if the item is already in this cluster.
        if (cluster.itemIds.some((id) => id === args.itemId)) return;

        const newDomains = cluster.sourceDomains.includes(args.sourceDomain)
            ? cluster.sourceDomains
            : [...cluster.sourceDomains, args.sourceDomain];

        await ctx.db.patch(args.clusterId, {
            itemIds: [...cluster.itemIds, args.itemId],
            sourceDomains: newDomains,
            sourceCount: newDomains.length,
            newestPublishedAt: Math.max(cluster.newestPublishedAt, args.publishedAt),
        });
    },
});

export const markItemClustered = internalMutation({
    args: {
        itemId: v.id("discoverItems"),
        // Written in the same transaction as the status flip so the
        // item → cluster back-reference can never drift from membership.
        clusterId: v.optional(v.id("discoverClusters")),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.itemId, {
            status: "clustered",
            ...(args.clusterId ? { clusterId: args.clusterId } : {}),
        });
    },
});

/**
 * Group embedded items by approximate semantic similarity. For each
 * unclustered item, run a vector search; merge into the best existing
 * cluster if any neighbor is "close enough"; otherwise create a new
 * cluster. The first (newest) item in a cluster seeds the topic title.
 */
export const clusterByEmbedding = internalAction({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args): Promise<{ clustered: number; clustersTouched: number }> => {
        const items = await ctx.runQuery(internal.discover.cluster.getUnclusteredEmbeddedItems, {
            limit: args.limit ?? CLUSTER_BATCH_LIMIT,
        });
        if (items.length === 0) return { clustered: 0, clustersTouched: 0 };

        // Process newest-first so the most recent article seeds each
        // cluster's title.
        const sorted = [...items].sort((a, b) => b.publishedAt - a.publishedAt);

        let clustered = 0;
        const touched = new Set<string>();

        for (const item of sorted) {
            if (!item.embedding) continue; // shouldn't happen given the query

            // Vector search: top-K neighbors in the same category. The
            // vector index is filtered to the item's category to avoid
            // false matches across topical categories.
            const neighbors = await ctx.vectorSearch("discoverItems", "by_embedding", {
                vector: item.embedding,
                limit: CLUSTER_NEIGHBOR_LIMIT,
                filter: (q) => q.eq("category", item.category),
            });

            // Pick the highest-scoring neighbor that already has a cluster.
            // Because we process newest-first and mark items as clustered
            // as we go, a neighbor with a higher publishedAt is one we've
            // already processed. We prefer that over a future-tense match.
            let best: { id: Id<"discoverClusters">; score: number } | null = null;
            for (const n of neighbors) {
                if (n._id === item._id) continue;
                if (n._score < CLUSTER_SCORE_THRESHOLD) continue;
                const neighbor = items.find((i: typeof items[number]) => i._id === n._id);
                if (!neighbor) continue;
                if (neighbor.publishedAt <= item.publishedAt) {
                    // We need the cluster id for the neighbor. Look it up
                    // by reverse-mapping: discoverClusters.itemIds contains it.
                    const cluster = await ctx.runQuery(
                        internal.discover.cluster.findClusterContainingItem,
                        { itemId: n._id },
                    );
                    if (cluster) {
                        if (!best || n._score > best.score) {
                            best = { id: cluster._id, score: n._score };
                        }
                    }
                }
            }

            // Resolve the cluster this item belongs to (join an existing one
            // or seed a new one), then record the membership back-reference.
            let targetClusterId: Id<"discoverClusters">;
            if (best) {
                await ctx.runMutation(internal.discover.cluster.appendToCluster, {
                    clusterId: best.id,
                    itemId: item._id,
                    sourceDomain: item.sourceDomain,
                    publishedAt: item.publishedAt,
                });
                touched.add(best.id);
                targetClusterId = best.id;
            } else {
                targetClusterId = await ctx.runMutation(
                    internal.discover.cluster.createCluster,
                    {
                        topicTitle: item.title,
                        itemId: item._id,
                        sourceDomain: item.sourceDomain,
                        category: item.category,
                        country: item.country,
                        publishedAt: item.publishedAt,
                    },
                );
                touched.add(targetClusterId);
            }
            await ctx.runMutation(internal.discover.cluster.markItemClustered, {
                itemId: item._id,
                // Back-reference so the next item's neighbor lookup is a point
                // read instead of a full scan of the active cluster set.
                clusterId: targetClusterId,
            });
            clustered++;
        }

        return { clustered, clustersTouched: touched.size };
    },
});

/**
 * Internal helper: resolve the active cluster that already contains a given
 * item. Point read via `discoverItems.clusterId` — this used to scan every
 * active cluster, and it runs once per vector neighbor inside the clustering
 * loop, so that scan was the pipeline's worst hot spot (Discover F-02).
 */
export const findClusterContainingItem = internalQuery({
    args: { itemId: v.id("discoverItems") },
    handler: async (ctx, args) => {
        const item = await ctx.db.get(args.itemId);
        if (!item?.clusterId) return null;
        return await ctx.db.get(item.clusterId);
    },
});

// Re-export the constants for testability / observability.
export const CLUSTER_CONSTANTS = {
    EMBED_BATCH_LIMIT,
    CLUSTER_BATCH_LIMIT,
    CLUSTER_NEIGHBOR_LIMIT,
    CLUSTER_SCORE_THRESHOLD,
} as const;
