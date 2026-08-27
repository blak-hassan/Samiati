import { v } from "convex/values";
import { query, mutation } from "../_generated/server";

// =============================================================================
// DISCOVER FEED — Query functions for the frontend
// =============================================================================

// Get Discover feed for a category
export const getFeed = query({
  args: {
    category: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days

    // Fetch all active clusters and filter in memory
    // (Convex indexes don't support arbitrary field filters)
    const allClusters = await ctx.db
      .query("discoverClusters")
      .withIndex("by_status_trendScore", (q) => q.eq("status", "active"))
      .collect();

    // Filter by recency and category
    const filtered = allClusters
      .filter((c) => c.newestPublishedAt >= cutoff)
      .filter((c) => args.category === "for_you" || c.category === args.category)
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, limit);

    return filtered;
  },
});

// Get a single cluster by ID
export const getCluster = query({
  args: { clusterId: v.id("discoverClusters") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.clusterId);
  },
});

// Get trending topics (highest trend score in last 24h)
export const getTrending = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;

    const clusters = await ctx.db
      .query("discoverClusters")
      .withIndex("by_status_trendScore", (q) => q.eq("status", "active"))
      .collect();

    return clusters
      .filter((c) => c.newestPublishedAt >= cutoff)
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, limit);
  },
});

// Get category counts for tab badges
export const getCategoryCounts = query({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;

    const clusters = await ctx.db
      .query("discoverClusters")
      .withIndex("by_status_trendScore", (q) => q.eq("status", "active"))
      .collect();

    const counts: Record<string, number> = {
      for_you: 0,
      kenya: 0,
      africa: 0,
      tech: 0,
      trending: 0,
      culture: 0,
      world: 0,
    };

    for (const c of clusters) {
      if (c.newestPublishedAt >= cutoff) {
        counts.for_you++;
        if (counts[c.category] !== undefined) {
          counts[c.category]++;
        }
      }
    }

    return counts;
  },
});

// Track user engagement
export const trackEngagement = mutation({
  args: {
    clusterId: v.id("discoverClusters"),
    action: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return;

    await ctx.db.insert("discoverEngagement", {
      userId: user._id,
      clusterId: args.clusterId,
      action: args.action,
      timestamp: Date.now(),
    });
  },
});

// Save a Discover topic (bookmark)
export const saveTopic = mutation({
  args: { clusterId: v.id("discoverClusters") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return;

    // Check if already saved
    const existing = await ctx.db
      .query("discoverEngagement")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const alreadySaved = existing.find(
      (e) => e.clusterId === args.clusterId && e.action === "save"
    );

    if (!alreadySaved) {
      await ctx.db.insert("discoverEngagement", {
        userId: user._id,
        clusterId: args.clusterId,
        action: "save",
        timestamp: Date.now(),
      });
    }
  },
});

// Dismiss a topic
export const dismissTopic = mutation({
  args: { clusterId: v.id("discoverClusters") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return;

    await ctx.db.insert("discoverEngagement", {
      userId: user._id,
      clusterId: args.clusterId,
      action: "dismiss",
      timestamp: Date.now(),
    });
  },
});

// Get user's saved topics
export const getSavedTopics = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    const engagements = await ctx.db
      .query("discoverEngagement")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const savedIds = engagements
      .filter((e) => e.action === "save")
      .map((e) => e.clusterId);

    const clusters = [];
    for (const id of savedIds) {
      const cluster = await ctx.db.get(id);
      if (cluster) clusters.push(cluster);
    }

    return clusters;
  },
});
