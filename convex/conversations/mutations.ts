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

        const existing = await ctx.db
            .query("conversations")
            .withIndex("by_clientId", (q) => q.eq("clientId", args.id))
            .first();

        const conversationData = {
            title: args.title,
            date: args.date,
            messageCount: args.messageCount,
            isPinned: args.isPinned,
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

            for (const m of existingMessages) {
                if (!incomingIds.has(m.clientId)) {
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

// Delete a conversation and its messages
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
