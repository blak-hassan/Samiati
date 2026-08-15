import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";

// Get all conversations for current user
export const listConversations = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        // Query where user is p1 (bounded — a DM list beyond 100 threads is
        // unrealistic and full collects grow with thread count)
        const c1 = await ctx.db
            .query("dmConversations")
            .withIndex("by_participant1", (q) => q.eq("participant1", user._id))
            .order("desc")
            .take(100);

        // Query where user is p2
        const c2 = await ctx.db
            .query("dmConversations")
            .withIndex("by_participant2", (q) => q.eq("participant2", user._id))
            .order("desc")
            .take(100);

        const all = [...c1, ...c2];

        // Sort by last message time
        all.sort((a, b) => b.lastMessageTime - a.lastMessageTime);

        // Enrich with other participant details
        const enriched = await Promise.all(all.map(async (c) => {
            const otherId = c.participant1 === user._id ? c.participant2 : c.participant1;
            const otherUser = await ctx.db.get(otherId);

            const unreadCount = c.participant1 === user._id ? c.unreadCountP1 : c.unreadCountP2;

            // Check if other user is typing (typing expiry > now)
            const typingUntil = c.participant1 === user._id ? c.typingUntilP2 : c.typingUntilP1;
            const isOtherTyping = typingUntil ? typingUntil > Date.now() : false;

            return {
                ...c,
                otherUserId: otherId,
                otherUser: otherUser ? {
                    name: otherUser.name,
                    handle: otherUser.handle,
                    avatar: otherUser.avatar,
                    isOnline: otherUser.isOnline ?? (otherUser.lastSeen ? Date.now() - otherUser.lastSeen < 5 * 60 * 1000 : false),
                } : null,
                unreadCount,
                isOtherTyping,
            };
        }));

        return enriched;
    },
});

// Get messages for a specific conversation
export const listMessages = query({
    args: {
        conversationId: v.id("dmConversations"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) throw new Error("Conversation not found");

        if (conversation.participant1 !== user._id && conversation.participant2 !== user._id) {
            throw new Error("Unauthorized");
        }

        const messages = await ctx.db
            .query("dmMessages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .order("desc") // newest first
            .take(args.limit || 50);

        return messages.reverse(); // Return oldest first for UI usually, or newest first if UI handles it
    },
});

// Check if other user is typing in a conversation
export const getTypingStatus = query({
    args: {
        conversationId: v.id("dmConversations"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return { isTyping: false };

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) return { isTyping: false };

        if (conversation.participant1 !== user._id && conversation.participant2 !== user._id) {
            return { isTyping: false };
        }

        // Get the other user's typing expiry
        const typingUntil = conversation.participant1 === user._id
            ? conversation.typingUntilP2
            : conversation.typingUntilP1;

        const isTyping = typingUntil ? typingUntil > Date.now() : false;

        return { isTyping };
    },
});
