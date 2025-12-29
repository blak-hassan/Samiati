import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";

// Send a DM (create conversation if needed)
export const send = mutation({
    args: {
        recipientId: v.id("users"),
        content: v.string(),
        image: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        if (args.recipientId === user._id) throw new Error("Cannot message self");

        // Check if conversation exists
        // Need to check both directions (p1=me, p2=them OR p1=them, p2=me)
        // Since we don't have a composite unique index on (p1, p2) + sorted logic efficiently queried yet
        // We typically try both queries or ensure strict ordering (p1 < p2) on creation.
        // Let's assume we query both.

        let conversation = await ctx.db
            .query("dmConversations")
            .withIndex("by_participant1", (q) => q.eq("participant1", user._id))
            .filter((q) => q.eq(q.field("participant2"), args.recipientId))
            .first();

        if (!conversation) {
            conversation = await ctx.db
                .query("dmConversations")
                .withIndex("by_participant1", (q) => q.eq("participant1", args.recipientId))
                .filter((q) => q.eq(q.field("participant2"), user._id))
                .first();
        }

        let conversationId;

        if (!conversation) {
            // Create new
            conversationId = await ctx.db.insert("dmConversations", {
                participant1: user._id,
                participant2: args.recipientId,
                lastMessage: args.content,
                lastMessageTime: Date.now(),
                unreadCountP1: 0,
                unreadCountP2: 1, // Recipient has 1 unread (the new message)
            });
        } else {
            conversationId = conversation._id;
            // Update existing
            const isP1 = conversation.participant1 === user._id;
            await ctx.db.patch(conversationId, {
                lastMessage: args.content,
                lastMessageTime: Date.now(),
                unreadCountP1: isP1 ? conversation.unreadCountP1 : conversation.unreadCountP1 + 1,
                unreadCountP2: isP1 ? conversation.unreadCountP2 + 1 : conversation.unreadCountP2,
            });
        }

        await ctx.db.insert("dmMessages", {
            conversationId,
            senderId: user._id,
            content: args.content,
            image: args.image,
            isRead: false,
            timestamp: Date.now(),
        });

        // Notify recipient?
    },
});

// Mark conversation as read
export const markRead = mutation({
    args: {
        conversationId: v.id("dmConversations"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) throw new Error("Conversation not found");

        if (conversation.participant1 === user._id) {
            await ctx.db.patch(args.conversationId, { unreadCountP1: 0 });
        } else if (conversation.participant2 === user._id) {
            await ctx.db.patch(args.conversationId, { unreadCountP2: 0 });
        } else {
            throw new Error("Unauthorized");
        }

        // Also mark all messages as read?
        // Usually unreadCount is enough for UI badges.
    },
});
