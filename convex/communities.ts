import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getOrCreateUser } from "./lib/currentUser";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const communities = await ctx.db.query("communities").collect();
    return communities
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((community) => ({
        ...community,
        id: community._id,
        memberIds: community.memberIds.map(String),
        moderatorIds: community.moderatorIds.map(String),
      }));
  },
});

export const join = mutation({
  args: { id: v.id("communities") },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const community = await ctx.db.get(args.id);
    if (!community) throw new Error("Community not found");

    const memberIds = community.memberIds.some((id) => id === user._id)
      ? community.memberIds
      : [...community.memberIds, user._id];

    await ctx.db.patch(args.id, { memberIds });
    const updated = await ctx.db.get(args.id);
    return {
      ...updated!,
      id: updated!._id,
      memberIds: updated!.memberIds.map(String),
      moderatorIds: updated!.moderatorIds.map(String),
    };
  },
});

export const leave = mutation({
  args: { id: v.id("communities") },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const community = await ctx.db.get(args.id);
    if (!community) throw new Error("Community not found");

    const memberIds = community.memberIds.filter((id) => id !== user._id);
    await ctx.db.patch(args.id, { memberIds });
    const updated = await ctx.db.get(args.id);
    return {
      ...updated!,
      id: updated!._id,
      memberIds: updated!.memberIds.map(String),
      moderatorIds: updated!.moderatorIds.map(String),
    };
  },
});
