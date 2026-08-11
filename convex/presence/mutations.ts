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

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) throw new Error("Conversation not found");

        // Verify user is a participant
        if (conversation.participant1 !== user._id && conversation.participant2 !== user._id) {
            throw new Error("Unauthorized");
        }

        // Set typing expiry (3 seconds from now) or clear it
        const typingUntil = args.isTyping ? Date.now() + 3000 : undefined;

        if (conversation.participant1 === user._id) {
            await ctx.db.patch(args.conversationId, { typingUntilP1: typingUntil });
        } else {
            await ctx.db.patch(args.conversationId, { typingUntilP2: typingUntil });
        }

        return { success: true };
    },
});
