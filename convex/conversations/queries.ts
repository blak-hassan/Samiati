import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";

// List all conversations for the current user
export const listConversations = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        const conversations = await ctx.db
            .query("conversations")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .order("desc")
            .take(100);

        return conversations;
    },
});

// Get a single conversation with its messages by clientId
export const getConversationWithMessages = query({
    args: { clientId: v.string() },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return null;

        const conversation = await ctx.db
            .query("conversations")
            .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
            .first();

        if (!conversation || conversation.userId !== user._id) return null;

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
            .order("asc")
            .collect();

        return { ...conversation, messages };
    },
});
