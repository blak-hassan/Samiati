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

        // Title is user-controlled (renames, AI-suggested titles, first-message
        // truncation) and the metadata mutation already caps at 200. Apply the
        // same cap here so a full save cannot write an unbounded title — the
        // Sessions list renders it as a heading and exports it into filenames.
        const safeTitle = args.title.trim().slice(0, 200) || "Untitled session";

        const conversationData = {
            title: safeTitle,
            date: args.date,
            isPinned: args.isPinned,
            // Always persist an explicit boolean so `isArchived` is queryable in
            // secondary indexes; legacy rows left it undefined.
            isArchived: args.isArchived ?? existing?.isArchived ?? false,
            lastActive: args.lastActive,
            userId: user._id,
            category: args.category,
            clientId: args.id,
        };

        if (existing) {
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

            await ctx.db.patch(existing._id, {
                ...conversationData,
                // A stale offline snapshot must never *lower* the stored count.
                // The message union below can only add, so take the higher of the
                // two; this also repairs counts that drifted historically.
                messageCount: isStale
                    ? Math.max(existing.messageCount ?? 0, args.messages.length)
                    : args.messages.length,
            });

            // Batch the deletes. A sequential await per message both serialized
            // the writes and multiplied the mutation's time budget, which is the
            // real ceiling on long transcripts.
            await Promise.all(
                existingMessages
                    .filter((m) => !incomingIds.has(m.clientId) && !isStale)
                    .map((m) => ctx.db.delete(m._id))
            );

            // Index existing rows by clientId: the previous `.find()` inside the
            // loop made the upsert O(n²) over the transcript.
            const existingByClientId = new Map(existingMessages.map((m) => [m.clientId, m]));

            await Promise.all(
                args.messages.map((msg) => {
                    const existingMsg = existingByClientId.get(msg.id);
                    if (existingMsg) {
                        return ctx.db.patch(existingMsg._id, {
                            sender: msg.sender,
                            text: msg.text,
                            translatedText: msg.translatedText,
                            targetLanguage: msg.targetLanguage,
                            timestamp: msg.timestamp,
                            feedback: msg.feedback,
                            comments: msg.comments,
                        });
                    }
                    return ctx.db.insert("messages", {
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
                })
            );

            return existing._id;
        } else {
            const conversationId = await ctx.db.insert("conversations", {
                ...conversationData,
                messageCount: args.messages.length,
            });

            await Promise.all(
                args.messages.map((msg) =>
                    ctx.db.insert("messages", {
                        conversationId,
                        clientId: msg.id,
                        sender: msg.sender,
                        text: msg.text,
                        translatedText: msg.translatedText,
                        targetLanguage: msg.targetLanguage,
                        timestamp: msg.timestamp,
                        feedback: msg.feedback,
                        comments: msg.comments,
                    })
                )
            );

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

        // Batched: a sequential await per message serialized the writes and
        // multiplied the mutation's time budget, which is the actual ceiling on
        // long transcripts (a 500-message chat would time out).
        await Promise.all(messages.map((msg) => ctx.db.delete(msg._id)));
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

        await Promise.all(messages.map((msg) => ctx.db.delete(msg._id)));

        await ctx.db.delete(args.conversationId);
        return { success: true };
    },
});
