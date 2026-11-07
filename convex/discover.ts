import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getOrCreateUser } from "./lib/currentUser";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateUser(ctx);
    const items = await ctx.db.query("discoverItems").collect();
    return items
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .map((item) => ({
        id: item._id,
        title: item.title,
        summary: item.summary,
        topic: item.topic,
        languages: item.languages,
        source: item.source,
        publishedAt: item.publishedAt,
        readingMinutes: item.readingMinutes,
        saved: item.savedBy.some((id) => id === user._id),
      }));
  },
});

export const toggleSaved = mutation({
  args: { id: v.id("discoverItems") },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Discover item not found");

    const saved = item.savedBy.some((id) => id === user._id);
    const savedBy = saved
      ? item.savedBy.filter((id) => id !== user._id)
      : [...item.savedBy, user._id];

    await ctx.db.patch(args.id, { savedBy });

    return {
      id: item._id,
      title: item.title,
      summary: item.summary,
      topic: item.topic,
      languages: item.languages,
      source: item.source,
      publishedAt: item.publishedAt,
      readingMinutes: item.readingMinutes,
      saved: !saved,
    };
  },
});

import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getOrCreateUser } from "./lib/currentUser";

/**
 * Merges items from an ingested feed into the catalogue.
 *
 * Items are matched by id, so re-running the ingestion refreshes an existing
 * record rather than creating a duplicate. A reader's saved state is never
 * overwritten by an ingestion run.
 */
export const ingest = mutation({
  args: {
    items: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        summary: v.string(),
        topic: v.union(
          v.literal("trending"),
          v.literal("news"),
          v.literal("technology"),
          v.literal("culture"),
          v.literal("history"),
          v.literal("education"),
          v.literal("community"),
        ),
        languages: v.array(v.string()),
        source: v.string(),
        publishedAt: v.number(),
        readingMinutes: v.number(),
        saved: v.optional(v.boolean()),
        sourceUrl: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const now = Date.now();

    for (const item of args.items) {
      const existing = await ctx.db
        .query("discoverItems")
        .filter((q) => q.eq(q.field("title"), item.title))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          title: item.title,
          summary: item.summary,
          topic: item.topic,
          languages: item.languages,
          source: item.source,
          publishedAt: item.publishedAt,
          readingMinutes: item.readingMinutes,
          sourceUrl: item.sourceUrl,
        });
      } else {
        await ctx.db.insert("discoverItems", {
          title: item.title,
          summary: item.summary,
          topic: item.topic,
          languages: item.languages,
          source: item.source,
          publishedAt: item.publishedAt,
          readingMinutes: item.readingMinutes,
          savedBy: [],
          sourceUrl: item.sourceUrl,
        });
      }
    }

    const items = await ctx.db.query("discoverItems").collect();
    return items
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .map((item) => ({
        id: item._id,
        title: item.title,
        summary: item.summary,
        topic: item.topic,
        languages: item.languages,
        source: item.source,
        publishedAt: item.publishedAt,
        readingMinutes: item.readingMinutes,
        saved: item.savedBy.some((id) => id === user._id),
        sourceUrl: item.sourceUrl,
      }));
  },
});
