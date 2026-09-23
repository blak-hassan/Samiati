import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";

// Create or update a conversation for the current user
export const saveConversation = mutation({
    args: {
        id: v.string(),
        title: v.string(),
        date: v.string(),
        messageCount: v.number(),
        isPinned: v.boolean(),
        isArchived: v.optional(v.boolean()),
        lastActive: v.number(),
        category: v.optional(v.string()),
        messages: v.array(v.object({
            id: v.string(),
            sender: v.string(),
            text: v.string(),
            translatedText: v.optional(v.string()),
            targetLanguage: v.optional(v.string()),
            timestamp: v.number(),
            feedback: v.optional(v.union(v.literal("up"), v.literal("down"))),
            comments: v.optional(v.array(v.string())),
            type: v.optional(v.string()),
            status: v.optional(v.string()),
            duration: v.optional(v.string()),
        })),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Owner-aware lookup: scope by both the clientId and the authenticated
        // user's userId so one user cannot read or mutate another user's
        // conversation. The ownership check happens before any patching or
        // message deletion below.
        const existing = await ctx.db
            .query("conversations")
            .withIndex("by_user_clientId", (q) => q.eq("userId", user._id).eq("clientId", args.id))
            .first();

        const conversationData = {
            title: args.title,
            date: args.date,
            messageCount: args.messageCount,
            isPinned: args.isPinned,
            isArchived: args.isArchived,
            lastActive: args.lastActive,
            userId: user._id,
            category: args.category,
            clientId: args.id,
        };

        if (existing) {
            await ctx.db.patch(existing._id, conversationData);
            const existingMessages = await ctx.db
                .query("messages")
                .withIndex("by_conversation", (q) => q.eq("conversationId", existing._id))
                .collect();

            const incomingIds = new Set(args.messages.map(m => m.id));

            // Only delete stale server messages when this save is at least as
            // fresh as what the server already has. An offline client flushing
            // an older snapshot must NOT wipe messages that arrived afterwards;
            // instead we union the two sets (upsert below).
            const isStale = (existing.lastActive ?? 0) > (args.lastActive ?? 0);

            for (const m of existingMessages) {
                if (!incomingIds.has(m.clientId) && !isStale) {
                    await ctx.db.delete(m._id);
                }
            }

            for (const msg of args.messages) {
                const existingMsg = existingMessages.find(m => m.clientId === msg.id);
                if (existingMsg) {
                    await ctx.db.patch(existingMsg._id, {
                        sender: msg.sender,
                        text: msg.text,
                        translatedText: msg.translatedText,
                        targetLanguage: msg.targetLanguage,
                        timestamp: msg.timestamp,
                        feedback: msg.feedback,
                        comments: msg.comments,
                    });
                } else {
                    await ctx.db.insert("messages", {
                        conversationId: existing._id,
                        clientId: msg.id,
                        sender: msg.sender,
                        text: msg.text,
                        translatedText: msg.translatedText,
                        targetLanguage: msg.targetLanguage,
                        timestamp: msg.timestamp,
                        feedback: msg.feedback,
                        comments: msg.comments,
                    });
                }
            }

            return existing._id;
        } else {
            const conversationId = await ctx.db.insert("conversations", conversationData);

            for (const msg of args.messages) {
                await ctx.db.insert("messages", {
                    conversationId,
                    clientId: msg.id,
                    sender: msg.sender,
                    text: msg.text,
                    translatedText: msg.translatedText,
                    targetLanguage: msg.targetLanguage,
                    timestamp: msg.timestamp,
                    feedback: msg.feedback,
                    comments: msg.comments,
                });
            }

            return conversationId;
        }
    },
});

// Update lightweight conversation metadata (title, pin state, archive state)
// without re-sending the full message array. Lets the Saved Sessions page
// sync rename / pin / archive actions immediately to the server.
export const updateConversationMetadata = mutation({
    args: {
        clientId: v.string(),
        title: v.optional(v.string()),
        isPinned: v.optional(v.boolean()),
        isArchived: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const existing = await ctx.db
            .query("conversations")
            .withIndex("by_user_clientId", (q) => q.eq("userId", user._id).eq("clientId", args.clientId))
            .first();

        if (!existing) {
            // No remote copy yet (guest or first sync). Nothing to update.
            return null;
        }

        const patch: Record<string, unknown> = {};
        if (typeof args.title === "string" && args.title.trim().length > 0) {
            patch.title = args.title.trim().slice(0, 200);
        }
        if (typeof args.isPinned === "boolean") {
            patch.isPinned = args.isPinned;
        }
        // isArchived is a first-class column on the conversations table; the
        // Saved Sessions page syncs archive/restore actions straight through.
        if (typeof args.isArchived === "boolean") {
            patch.isArchived = args.isArchived;
        }

        if (Object.keys(patch).length === 0) return existing._id;
        await ctx.db.patch(existing._id, patch);
        return existing._id;
    },
});

// Delete a conversation and its messages by client-generated ID.
// Used by the Saved Sessions screen so deletes propagate to the server
// alongside the localStorage removal. Owner-scoped.
export const deleteConversationByClientId = mutation({
    args: { clientId: v.string() },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const conversation = await ctx.db
            .query("conversations")
            .withIndex("by_user_clientId", (q) => q.eq("userId", user._id).eq("clientId", args.clientId))
            .first();

        if (!conversation) return { success: true, deleted: 0 };

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
            .collect();

        for (const msg of messages) {
            await ctx.db.delete(msg._id);
        }

        await ctx.db.delete(conversation._id);
        return { success: true, deleted: messages.length + 1 };
    },
});

// Delete a conversation and its messages by Convex document ID.
// Reserved for callers that hold the server-side _id; the Saved Sessions
// screen uses deleteConversationByClientId above.
export const deleteConversation = mutation({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation || conversation.userId !== user._id) {
            throw new Error("Conversation not found or unauthorized");
        }

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .collect();

        for (const msg of messages) {
            await ctx.db.delete(msg._id);
        }

        await ctx.db.delete(args.conversationId);
        return { success: true };
    },
});
