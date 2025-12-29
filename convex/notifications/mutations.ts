import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";

// Create a notification (internal use mostly, or for testing)
export const create = mutation({
    args: {
        userId: v.id("users"),
        type: v.string(),
        title: v.string(),
        message: v.string(),
        targetScreen: v.string(),
        metadata: v.optional(v.any()), // JSON object
    },
    handler: async (ctx, args) => {
        // Can optionally check if sender is admin or system
        // For now, allow open creation for flexibility in Phase 2

        await ctx.db.insert("notifications", {
            userId: args.userId,
            type: args.type,
            title: args.title,
            message: args.message,
            time: Date.now(),
            isRead: false,
            targetScreen: args.targetScreen,
            metadata: args.metadata,
        });
    },
});

// Mark a single notification as read
export const markAsRead = mutation({
    args: {
        notificationId: v.id("notifications"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const notification = await ctx.db.get(args.notificationId);
        if (!notification) throw new Error("Notification not found");

        if (notification.userId !== user._id) {
            throw new Error("Unauthorized access to notification");
        }

        await ctx.db.patch(args.notificationId, {
            isRead: true,
        });
    },
});

// Mark all as read
export const markAllAsRead = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .filter((q) => q.eq(q.field("isRead"), false))
            .collect();

        for (const notif of unread) {
            await ctx.db.patch(notif._id, {
                isRead: true,
            });
        }
    },
});

// Delete notification
export const deleteNotification = mutation({
    args: {
        notificationId: v.id("notifications"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const notification = await ctx.db.get(args.notificationId);
        if (!notification) throw new Error("Notification not found");

        if (notification.userId !== user._id) {
            throw new Error("Unauthorized access to notification");
        }

        await ctx.db.delete(args.notificationId);
    },
});
