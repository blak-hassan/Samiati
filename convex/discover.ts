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
