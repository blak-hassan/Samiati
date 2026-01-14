import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";

// Update user's presence (call this periodically from frontend)
export const heartbeat = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return null;

        await ctx.db.patch(user._id, {
            lastSeen: Date.now(),
            isOnline: true,
        });

        return { success: true };
    },
});

// Mark user as offline (call on page unload/disconnect)
export const goOffline = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return null;

        await ctx.db.patch(user._id, {
            lastSeen: Date.now(),
            isOnline: false,
        });

        return { success: true };
    },
});

// Update typing status in a DM conversation
export const setTyping = mutation({
    args: {
        conversationId: v.id("dmConversations"),
        isTyping: v.boolean(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // We could store typing status in a separate table or on the conversation
        // For now, we'll return success - typing indicators can be handled via 
        // a separate "typingStatus" table or real-time presence system

        // Note: Convex doesn't have built-in ephemeral state, so for typing indicators
        // we'd typically use a short-lived entry or the conversation document itself

        return { success: true, userId: user._id, isTyping: args.isTyping };
    },
});
