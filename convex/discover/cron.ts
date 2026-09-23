import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

// =============================================================================
// DISCOVER CRON — Scheduled jobs for content pipeline
// =============================================================================

// Main fetch + process job (runs every 15 min)
export const fetchAndProcess = internalAction({
  args: {},
  handler: async (ctx): Promise<{ fetched: number; stored: number; processed: number }> => {
    console.log("[Discover Cron] Starting fetch and process...");

    // Step 1: Fetch from all sources
    const fetchResult: { fetched: number; stored: number } = await ctx.runAction(
      internal.discover.process.fetchAndStore,
      {}
    );
    console.log(`[Discover Cron] Fetched: ${fetchResult.fetched}, Stored: ${fetchResult.stored}`);

    // Step 2: Process raw items into normalized items
    const processResult: { processed: number } = await ctx.runAction(
      internal.discover.process.processRawItems,
      {}
    );
    console.log(`[Discover Cron] Processed: ${processResult.processed}`);

    return {
      fetched: fetchResult.fetched,
      stored: fetchResult.stored,
      processed: processResult.processed,
    };
  },
});

// Cluster + enrich job (runs every 30 min)
//
// Phase 2 pipeline: items are now embedded via the AI router
// (paraphrase-multilingual-MiniLM-L12-v2, 384 dims) and clustered
// using Convex's vector search. The old string-similarity clusterer
// in `process.ts` is kept as a fallback for items that failed to
// embed (e.g. quota exceeded); `clusterByEmbedding` will skip items
// without an embedding, and the next `clusterItems` call (still
// scheduled at the same cadence) will catch them via the heuristic.
export const clusterAndEnrich = internalAction({
  args: {},
  handler: async (ctx): Promise<{ embedded: number; clustered: number; enriched: number }> => {
    console.log("[Discover Cron] Starting cluster and enrich...");

    // Step 1: Compute embeddings for any unembedded items
    const embedResult: { embedded: number; failed: number } = await ctx.runAction(
      internal.discover.cluster.embedRawItems,
      {}
    );
    console.log(`[Discover Cron] Embedded: ${embedResult.embedded} (failed: ${embedResult.failed})`);

    // Step 2: Cluster embedded items by vector similarity
    const clusterResult: { clustered: number; clustersTouched: number } = await ctx.runAction(
      internal.discover.cluster.clusterByEmbedding,
      {}
    );
    console.log(`[Discover Cron] Clustered: ${clusterResult.clustered} items into ${clusterResult.clustersTouched} clusters`);

    // Step 3: Enrich with AI summaries
    const enrichResult: { enriched: number; total: number } = await ctx.runAction(
      internal.discover.enrich.enrichClusters,
      {}
    );
    console.log(`[Discover Cron] Enriched: ${enrichResult.enriched}/${enrichResult.total}`);

    return {
      embedded: embedResult.embedded,
      clustered: clusterResult.clustered,
      enriched: enrichResult.enriched,
    };
  },
});

// Compute trend scores (runs every hour)
export const computeTrendScores = internalAction({
  args: { limit: v.number() },
  handler: async (ctx, args): Promise<{ scored: number }> => {
    console.log("[Discover Cron] Computing trend scores...");

    const result: { scored: number } = await ctx.runAction(
      internal.discover.enrich.computeTrendScores,
      { limit: args.limit },
    );
    console.log(`[Discover Cron] Scored: ${result.scored}`);

    return { scored: result.scored };
  },
});

// Daily cleanup of old content
export const cleanup = internalAction({
  args: {},
  handler: async (ctx): Promise<{ archivedItems: number; archivedClusters: number }> => {
    console.log("[Discover Cron] Running daily cleanup...");

    const result: { archivedItems: number; archivedClusters: number } = await ctx.runAction(
      internal.discover.process.archiveOldItems,
      {}
    );
    console.log(`[Discover Cron] Archived: ${result.archivedItems} items, ${result.archivedClusters} clusters`);

    return result;
  },
});
