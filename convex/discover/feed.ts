import { v } from "convex/values";
import { query, mutation } from "../_generated/server";

// =============================================================================
// DISCOVER FEED — Query functions for the frontend
// =============================================================================

// Feed window: clusters older than this are not surfaced even if the cleanup
// cron has not archived them yet.
const FEED_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

// Tab badge counts stop reading here — the value is rendered as "99+" beyond
// this, so walking further is wasted work.
const COUNT_CAP = 100;

// Categories that carry a badge on the client (see CATEGORIES in
// DiscoverScreen.tsx).
const COUNTED_CATEGORIES = ["kenya", "africa", "tech", "trending", "culture", "world"] as const;

// The client's "everything" tab id.
const LATEST_CATEGORY = "for_you";

// Get Discover feed for a category (bounded, newest-first index page).
//
// The indexed query takes NO time-based bound: Convex cursors are only valid
// for exactly the query that produced them, so the arguments must stay
// identical across pages. Recency ranking comes from the index order, the
// feed window is applied to the returned page (cheap, ≤limit rows), and
// long-term retention is the cleanup cron's job.
export const getFeed = query({
  args: {
    category: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 20, 1), 50);
    const cutoff = Date.now() - FEED_WINDOW_MS;

    const indexed =
      args.category === LATEST_CATEGORY
        ? ctx.db
            .query("discoverClusters")
            .withIndex("by_status_newest", (q) => q.eq("status", "active"))
        : ctx.db
            .query("discoverClusters")
            .withIndex("by_status_category_newest", (q) =>
              q.eq("status", "active").eq("category", args.category),
            );

    const page = await indexed
      .order("desc")
      .paginate({ numItems: limit, cursor: args.cursor ?? null });

    const inWindow = page.page.filter((c) => c.newestPublishedAt >= cutoff);

    // Recency picks the candidates; trendScore orders what the reader sees
    // first. Sorting is limited to this page, so it stays O(limit).
    const clusters = [...inWindow].sort((a, b) => b.trendScore - a.trendScore);

    return {
      clusters,
      nextCursor: page.isDone ? undefined : page.continueCursor,
      hasMore: !page.isDone,
    };
  },
});

// Get category counts for tab badges (bounded: COUNT_CAP reads per category).
export const getCategoryCounts = query({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - FEED_WINDOW_MS;
    const counts: Record<string, number> = {};

    for (const category of COUNTED_CATEGORIES) {
      const rows = await ctx.db
        .query("discoverClusters")
        .withIndex("by_status_category_newest", (q) =>
          q
            .eq("status", "active")
            .eq("category", category)
            .gte("newestPublishedAt", cutoff),
        )
        .take(COUNT_CAP);
      counts[category] = rows.length;
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

    // Check if already saved (point read via composite index — Discover F-02)
    const existing = await ctx.db
      .query("discoverEngagement")
      .withIndex("by_user_cluster_action", (q) =>
        q.eq("userId", user._id).eq("clusterId", args.clusterId).eq("action", "save"),
      )
      .first();

    if (!existing) {
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

    // Deduplicate: at most one "dismiss" row per user/topic. The old version
    // inserted a new row on every tap (Discover F-15).
    const alreadyDismissed = await ctx.db
      .query("discoverEngagement")
      .withIndex("by_user_cluster_action", (q) =>
        q.eq("userId", user._id).eq("clusterId", args.clusterId).eq("action", "dismiss"),
      )
      .first();

    if (!alreadyDismissed) {
      await ctx.db.insert("discoverEngagement", {
        userId: user._id,
        clusterId: args.clusterId,
        action: "dismiss",
        timestamp: Date.now(),
      });
    }
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

    // Bounded: only "save" rows for this user. The old version collected
    // EVERY engagement and filtered in memory (Discover F-02); this is a
    // single index range whose cardinality is bounded by saves, not total
    // engagements.
    const engagements = await ctx.db
      .query("discoverEngagement")
      .withIndex("by_user_action", (q) =>
        q.eq("userId", user._id).eq("action", "save"),
      )
      .collect();

    const clusters = [];
    for (const e of engagements) {
      const cluster = await ctx.db.get(e.clusterId);
      if (cluster) clusters.push(cluster);
    }

    return clusters;
  },
});
