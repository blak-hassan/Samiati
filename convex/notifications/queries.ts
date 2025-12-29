import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";

// Get user's notifications
export const list = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        const limit = args.limit ?? 20;

        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .order("desc")
            .take(limit);

        return notifications;
    },
});

// Get unread count
export const unreadCount = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return 0;

        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .filter((q) => q.eq(q.field("isRead"), false))
            .collect();

        return unread.length;
    },
});
