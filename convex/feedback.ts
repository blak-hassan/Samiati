import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users/utils";

// Submit feedback on an AI response (thumbs up/down + optional reason/correction)
export const submit = mutation({
    args: {
        messageId: v.optional(v.string()),
        conversationId: v.optional(v.string()),
        type: v.union(v.literal("up"), v.literal("down")),
        reason: v.optional(v.string()),
        correction: v.optional(v.string()),
        contextType: v.union(
            v.literal("chat"),
            v.literal("translate"),
            v.literal("voice"),
            v.literal("tts"),
            v.literal("search"),
        ),
        language: v.optional(v.string()),
        originalText: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Check for duplicate feedback on the same message (toggle behavior)
        if (args.messageId) {
            const existing = await ctx.db
                .query("feedback")
                .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
                .filter((q) => q.eq(q.field("userId"), user._id))
                .first();

            if (existing) {
                if (existing.type === args.type) {
                    // Same vote — remove it (toggle off)
                    await ctx.db.delete(existing._id);
                    return { action: "removed", id: existing._id };
                } else {
                    // Different vote — update it
                    await ctx.db.patch(existing._id, {
                        type: args.type,
                        reason: args.reason,
                        correction: args.correction,
                        timestamp: Date.now(),
                    });
                    return { action: "updated", id: existing._id };
                }
            }
        }

        // New feedback
        const feedbackId = await ctx.db.insert("feedback", {
            userId: user._id,
            messageId: args.messageId,
            conversationId: args.conversationId,
            type: args.type,
            reason: args.reason,
            correction: args.correction,
            contextType: args.contextType,
            language: args.language,
            originalText: args.originalText?.slice(0, 2000),
            timestamp: Date.now(),
        });

        return { action: "created", id: feedbackId };
    },
});

// Get feedback stats for a user (profile impact)
export const getUserStats = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return null;

        const allFeedback = await ctx.db
            .query("feedback")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        const totalFeedback = allFeedback.length;
        const thumbsUp = allFeedback.filter((f) => f.type === "up").length;
        const thumbsDown = allFeedback.filter((f) => f.type === "down").length;
        const correctionsSubmitted = allFeedback.filter((f) => f.correction).length;
        const withReasons = allFeedback.filter((f) => f.reason).length;

        return {
            totalFeedback,
            thumbsUp,
            thumbsDown,
            correctionsSubmitted,
            withReasons,
        };
    },
});

// Get recent feedback (for moderation / admin review)
export const getRecent = query({
    args: {
        limit: v.optional(v.number()),
        type: v.optional(v.union(v.literal("up"), v.literal("down"))),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "admin" && user.role !== "moderator")) {
            throw new Error("Unauthorized");
        }

        let query = ctx.db.query("feedback").order("desc");

        if (args.type) {
            const t = args.type;
            query = ctx.db
                .query("feedback")
                .withIndex("by_type", (q) => q.eq("type", t))
                .order("desc");
        }

        const items = await query.take(args.limit || 50);

        return Promise.all(
            items.map(async (item) => {
                const feedbackUser = await ctx.db.get(item.userId);
                return {
                    ...item,
                    userName: feedbackUser?.name,
                    userHandle: feedbackUser?.handle,
                    userAvatar: feedbackUser?.avatar,
                };
            })
        );
    },
});
