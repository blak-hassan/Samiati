import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  classifyCategory,
  extractCountry,
  extractCounty,
  getSourceReputation,
  fetchAllSources,
} from "./sources";

// =============================================================================
// CONTENT PROCESSING — Normalize, Deduplicate, Cluster
// =============================================================================

// Fetch RSS/GDELT and store raw items
export const fetchAndStore = internalAction({
  args: {},
  handler: async (ctx) => {
    const items = await fetchAllSources();
    let stored = 0;

    for (const item of items) {
      // Dedup by sourceId
      const existing = await ctx.runQuery(
        internal.discover.process.findRawBySourceId,
        { sourceId: item.sourceId }
      );
      if (existing) continue;

      await ctx.runMutation(internal.discover.process.storeRawItem, {
        sourceId: item.sourceId,
        sourceUrl: item.sourceUrl,
        title: item.title,
        description: item.description,
        publishedAt: item.publishedAt,
        raw: item.raw,
        imageUrl: item.imageUrl,
        feedName: item.feedName,
        feedDomain: item.feedDomain,
      });
      stored++;
    }

    console.log(`[Discover] Fetched ${items.length} items, stored ${stored} new`);
    return { fetched: items.length, stored };
  },
});

// Store a single raw item
export const storeRawItem = internalMutation({
  args: {
    sourceId: v.string(),
    sourceUrl: v.string(),
    title: v.string(),
    description: v.string(),
    publishedAt: v.number(),
    raw: v.string(),
    imageUrl: v.optional(v.string()),
    feedName: v.string(),
    feedDomain: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("discoverRawItems", {
      sourceId: args.sourceId,
      sourceUrl: args.sourceUrl,
      title: args.title,
      description: args.description,
      publishedAt: args.publishedAt,
      ingestedAt: Date.now(),
      raw: args.raw,
    });
  },
});

// Find raw item by sourceId
export const findRawBySourceId = internalQuery({
  args: { sourceId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("discoverRawItems")
      .withIndex("by_source_published", (q) => q.eq("sourceId", args.sourceId))
      .first();
  },
});

// Process raw items into normalized discoverItems
export const processRawItems = internalAction({
  args: {},
  handler: async (ctx) => {
    const rawItems = await ctx.runQuery(
      internal.discover.process.getUnprocessedRawItems,
      { limit: 50 }
    );

    let processed = 0;
    for (const raw of rawItems) {
      // Check if already processed
      const existing = await ctx.runQuery(
        internal.discover.process.findItemByRawId,
        { rawItemId: raw._id }
      );
      if (existing) continue;

      const domain = extractDomain(raw.sourceUrl);
      const category = classifyCategory(raw.title, raw.description);
      const country = extractCountry(raw.title, raw.description);
      const county = extractCounty(raw.title, raw.description);

      await ctx.runMutation(internal.discover.process.storeNormalizedItem, {
        rawItemId: raw._id,
        sourceDomain: domain,
        title: raw.title,
        description: raw.description,
        url: raw.sourceUrl,
        publishedAt: raw.publishedAt,
        language: "en", // Default; AI enrichment can refine
        country,
        county,
        category,
        entities: [],
        imageUrl: undefined,
      });
      processed++;
    }

    console.log(`[Discover] Processed ${processed} raw items into normalized items`);
    return { processed };
  },
});

// Get unprocessed raw items
export const getUnprocessedRawItems = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("discoverRawItems")
      .withIndex("by_ingested", (q) => q)
      .order("desc")
      .take(args.limit);
  },
});

// Find existing normalized item by raw ID
export const findItemByRawId = internalQuery({
  args: { rawItemId: v.id("discoverRawItems") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("discoverItems")
      .filter((q) => q.eq(q.field("rawItemId"), args.rawItemId))
      .first();
  },
});

// Store normalized item
export const storeNormalizedItem = internalMutation({
  args: {
    rawItemId: v.id("discoverRawItems"),
    sourceDomain: v.string(),
    title: v.string(),
    description: v.string(),
    url: v.string(),
    publishedAt: v.number(),
    language: v.string(),
    country: v.string(),
    county: v.optional(v.string()),
    category: v.string(),
    entities: v.array(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("discoverItems", {
      ...args,
      status: "raw",
    });
  },
});

// Cluster similar items into topics
export const clusterItems = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get recent unclustered items
    const items = await ctx.runQuery(
      internal.discover.process.getUnclusteredItems,
      { limit: 100 }
    );

    if (items.length === 0) return { clustered: 0 };

    // Simple dedup: group by title similarity
    const clusters: Map<string, typeof items> = new Map();

    for (const item of items) {
      const key = normalizeTitle(item.title);
      if (clusters.has(key)) {
        clusters.get(key)!.push(item);
      } else {
        clusters.set(key, [item]);
      }
    }

    let clustered = 0;
    for (const [, clusterItems] of clusters) {
      if (clusterItems.length < 1) continue;

      // Use the newest item's title as the topic title
      const sorted = clusterItems.sort((a: typeof clusterItems[0], b: typeof clusterItems[0]) => b.publishedAt - a.publishedAt);
      const topicTitle = sorted[0].title;
      const sourceDomains = [...new Set(clusterItems.map((item: typeof clusterItems[0]) => item.sourceDomain))];
      const country = sorted[0].country;
      const category = sorted[0].category;

      // Check if cluster already exists
      const existing = await ctx.runQuery(
        internal.discover.process.findClusterByTitle,
        { topicTitle }
      );

      if (existing) {
        // Update existing cluster
        const newItemIds = [
          ...existing.itemIds,
          ...clusterItems.map((item: typeof clusterItems[0]) => item._id),
        ].filter((id, idx, arr) => arr.indexOf(id) === idx);

        await ctx.runMutation(internal.discover.process.updateCluster, {
          clusterId: existing._id,
          itemIds: newItemIds,
          sourceDomains: [...new Set([...existing.sourceDomains, ...sourceDomains])],
          sourceCount: [...new Set([...existing.sourceDomains, ...sourceDomains])].length,
          newestPublishedAt: sorted[0].publishedAt,
        });
      } else {
        // Create new cluster
        await ctx.runMutation(internal.discover.process.createCluster, {
          topicTitle,
          itemIds: clusterItems.map((i) => i._id),
          sourceDomains,
          category,
          country,
          newestPublishedAt: sorted[0].publishedAt,
          sourceCount: sourceDomains.length,
        });
      }

      // Mark items as clustered
      for (const item of clusterItems) {
        await ctx.runMutation(internal.discover.process.markItemClustered, {
          itemId: item._id,
        });
      }

      clustered++;
    }

    console.log(`[Discover] Clustered ${clustered} groups from ${items.length} items`);
    return { clustered };
  },
});

// Get unclustered items
export const getUnclusteredItems = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("discoverItems")
      .withIndex("by_status", (q) => q.eq("status", "raw"))
      .order("desc")
      .take(args.limit);
  },
});

// Normalize title for dedup (lowercase, remove punctuation, collapse whitespace)
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

// Find cluster by topic title
export const findClusterByTitle = internalQuery({
  args: { topicTitle: v.string() },
  handler: async (ctx, args) => {
    const normalized = normalizeTitle(args.topicTitle);
    // Search active clusters
    const clusters = await ctx.db
      .query("discoverClusters")
      .withIndex("by_status_trendScore", (q) => q.eq("status", "active"))
      .collect();

    return clusters.find((c) => normalizeTitle(c.topicTitle) === normalized);
  },
});

// Create new cluster
export const createCluster = internalMutation({
  args: {
    topicTitle: v.string(),
    itemIds: v.array(v.id("discoverItems")),
    sourceDomains: v.array(v.string()),
    category: v.string(),
    country: v.string(),
    newestPublishedAt: v.number(),
    sourceCount: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("discoverClusters", {
      topicTitle: args.topicTitle,
      itemIds: args.itemIds,
      sourceDomains: args.sourceDomains,
      category: args.category,
      country: args.country,
      newestPublishedAt: args.newestPublishedAt,
      sourceCount: args.sourceCount,
      status: "active",
      trendScore: 0,
      summary: "",
      whyTrending: "",
      suggestedQuery: args.topicTitle,
      imageUrl: undefined,
    });
  },
});

// Update existing cluster
export const updateCluster = internalMutation({
  args: {
    clusterId: v.id("discoverClusters"),
    itemIds: v.array(v.id("discoverItems")),
    sourceDomains: v.array(v.string()),
    sourceCount: v.number(),
    newestPublishedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const cluster = await ctx.db.get(args.clusterId);
    if (!cluster) return;

    await ctx.db.patch(args.clusterId, {
      itemIds: args.itemIds,
      sourceDomains: args.sourceDomains,
      sourceCount: args.sourceCount,
      newestPublishedAt: args.newestPublishedAt,
    });
  },
});

// Mark item as clustered
export const markItemClustered = internalMutation({
  args: { itemId: v.id("discoverItems") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.itemId, { status: "clustered" });
  },
});

// Archive old items (older than 7 days)
export const archiveOldItems = internalAction({
  args: {},
  handler: async (ctx): Promise<{ archivedItems: number; archivedClusters: number }> => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Archive old raw items
    const oldRaw = await ctx.runQuery(
      internal.discover.process.getOldRawItems,
      { cutoff }
    );
    for (const item of oldRaw) {
      await ctx.runMutation(internal.discover.process.deleteItem, { itemId: item._id });
    }

    // Archive old clusters
    const oldClusters = await ctx.runQuery(
      internal.discover.process.getOldClusters,
      { cutoff }
    );
    for (const cluster of oldClusters) {
      await ctx.runMutation(internal.discover.process.archiveCluster, {
        clusterId: cluster._id,
      });
    }

    console.log(`[Discover] Archived ${oldRaw.length} old items and ${oldClusters.length} old clusters`);
    return { archivedItems: oldRaw.length, archivedClusters: oldClusters.length };
  },
});

export const getOldRawItems = internalQuery({
  args: { cutoff: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("discoverRawItems")
      .withIndex("by_ingested", (q) => q.lt("ingestedAt", args.cutoff))
      .take(100);
  },
});

export const getOldClusters = internalQuery({
  args: { cutoff: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("discoverClusters")
      .withIndex("by_newest", (q) => q.lt("newestPublishedAt", args.cutoff))
      .take(100);
  },
});

export const deleteItem = internalMutation({
  args: { itemId: v.id("discoverRawItems") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.itemId);
  },
});

export const archiveCluster = internalMutation({
  args: { clusterId: v.id("discoverClusters") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.clusterId, { status: "archived" });
  },
});

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "unknown.com";
  }
}
