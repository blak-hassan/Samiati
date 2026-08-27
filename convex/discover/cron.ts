import { v } from "convex/values";
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
export const clusterAndEnrich = internalAction({
  args: {},
  handler: async (ctx): Promise<{ clustered: number; enriched: number }> => {
    console.log("[Discover Cron] Starting cluster and enrich...");

    // Step 1: Cluster items
    const clusterResult: { clustered: number } = await ctx.runAction(
      internal.discover.process.clusterItems,
      {}
    );
    console.log(`[Discover Cron] Clustered: ${clusterResult.clustered}`);

    // Step 2: Enrich with AI summaries
    const enrichResult: { enriched: number; total: number } = await ctx.runAction(
      internal.discover.enrich.enrichClusters,
      {}
    );
    console.log(`[Discover Cron] Enriched: ${enrichResult.enriched}/${enrichResult.total}`);

    return {
      clustered: clusterResult.clustered,
      enriched: enrichResult.enriched,
    };
  },
});

// Compute trend scores (runs every hour)
export const computeTrendScores = internalAction({
  args: {},
  handler: async (ctx): Promise<{ scored: number }> => {
    console.log("[Discover Cron] Computing trend scores...");

    const result: { scored: number } = await ctx.runAction(
      internal.discover.enrich.computeTrendScores,
      {}
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
