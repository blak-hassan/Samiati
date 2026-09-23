import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  classifyCategory,
  extractCountry,
  extractCounty,
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

// Archive old items (older than 7 days)
//
// Both sides of the cleanup read the *oldest* rows first (`by_ingested` /
// `by_newest`, ascending) and loop in batches, so retention holds even when
// ingestion outpaces a single batch. The previous version did exactly one
// `take(100)` per day, which could not keep up with ingestion rates of
// 4,800–19,200 items/day and let both tables grow without bound.
const CLEANUP_CUTOFF_MS = 7 * 24 * 60 * 60 * 1000;
const CLEANUP_BATCH = 100;
const CLEANUP_MAX_BATCHES = 20; // hard ceiling per run: 2,000 rows of each kind
export const archiveOldItems = internalAction({
  args: {},
  handler: async (ctx): Promise<{ archivedItems: number; archivedClusters: number }> => {
    const cutoff = Date.now() - CLEANUP_CUTOFF_MS;

    // Archive old raw items
    let archivedItems = 0;
    for (let batch = 0; batch < CLEANUP_MAX_BATCHES; batch++) {
      const oldRaw = await ctx.runQuery(
        internal.discover.process.getOldRawItems,
        { cutoff }
      );
      for (const item of oldRaw) {
        await ctx.runMutation(internal.discover.process.deleteItem, { itemId: item._id });
      }
      archivedItems += oldRaw.length;
      if (oldRaw.length < CLEANUP_BATCH) break;
    }

    // Archive old clusters
    let archivedClusters = 0;
    for (let batch = 0; batch < CLEANUP_MAX_BATCHES; batch++) {
      const oldClusters = await ctx.runQuery(
        internal.discover.process.getOldClusters,
        { cutoff }
      );
      for (const cluster of oldClusters) {
        await ctx.runMutation(internal.discover.process.archiveCluster, {
          clusterId: cluster._id,
        });
      }
      archivedClusters += oldClusters.length;
      if (oldClusters.length < CLEANUP_BATCH) break;
    }

    console.log(`[Discover] Archived ${archivedItems} old items and ${archivedClusters} old clusters`);
    return { archivedItems, archivedClusters };
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
