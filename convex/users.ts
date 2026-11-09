import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getOrCreateUser } from "./lib/currentUser";

/**
 * User records.
 *
 * Every other table references `users` by id, so the current user is resolved
 * (and created on first use) by a shared helper.
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return getOrCreateUser(ctx);
  },
});

/**
 * The account for the current member, created when it does not exist yet.
 *
 * This is a mutation and not a query because creating the account is a write,
 * and a Convex query cannot write. The client calls it once, before it reads
 * anything, so every later query finds the account.
 */
export const ensureCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    return getOrCreateUser(ctx);
  },
});

export const updateCurrentUser = mutation({
  args: {
    patch: v.object({
      username: v.optional(v.string()),
      displayName: v.optional(v.string()),
      avatarUrl: v.optional(v.string()),
      defaultLanguageId: v.optional(v.string()),
      preferredLanguageIds: v.optional(v.array(v.string())),
      favoriteLanguageIds: v.optional(v.array(v.string())),
      recentLanguageIds: v.optional(v.array(v.string())),
      contributionConsent: v.optional(v.boolean()),
      plan: v.optional(v.union(v.literal("free"), v.literal("supporter"))),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    await ctx.db.patch(user._id, args.patch);
    return { ...user, ...args.patch };
  },
});
