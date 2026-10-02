// convex/waitlist/queries.ts
// Waitlist queries.
//
// `getCount` is intentionally public (no auth) so the landing page counter
// can be rendered for both signed-in and anonymous visitors. Convex keeps
// the returned value reactive, so the counter updates in real time whenever
// a new subscriber is inserted. `list` is admin-only and used by the
// internal dashboard.

import { query } from "../_generated/server";
import { v } from "convex/values";
import { readWaitlistCount } from "./counter";

export const getCount = query({
    args: {},
    handler: async (ctx) => readWaitlistCount(ctx),
});

/**
 * Whether the *current* visitor has already joined.
 *
 * Public (no auth required) so the landing page can render the correct
 * starting state for both anonymous and signed-in visitors without branching
 * on two different data sources. Returns `isSubscribed: false` for anonymous
 * callers — they have no account to match a row against.
 */
export const getMyStatus = query({
    args: {},
    handler: async (ctx) => {
        const { getCurrentUser } = await import("../users/utils");
        const user = await getCurrentUser(ctx);
        if (!user) return { isSubscribed: false };

        const entry = await ctx.db
            .query("waitlist")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .first();

        return { isSubscribed: !!entry };
    },
});

export const list = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { getCurrentUser } = await import("../users/utils");
        const user = await getCurrentUser(ctx);
        if (!user || user.role !== "admin") return [];

        const limit = args.limit ?? 100;
        return await ctx.db
            .query("waitlist")
            .withIndex("by_subscribedAt")
            .order("desc")
            .take(limit);
    },
});