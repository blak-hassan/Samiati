import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";

// List blocked users for the current user
export const listBlockedUsers = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        const blocks = await ctx.db
            .query("blockedUsers")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        const blockedUsers = await Promise.all(
            blocks.map(async (block) => {
                const blockedUser = await ctx.db.get(block.blockedUserId);
                if (!blockedUser) return null;
                return {
                    _id: blockedUser._id,
                    name: blockedUser.name,
                    avatar: blockedUser.avatar,
                    blockedAt: block.createdAt,
                };
            })
        );

        return blockedUsers.filter((u): u is NonNullable<typeof u> => u !== null);
    },
});

// List muted words for the current user
export const listMutedWords = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        const muted = await ctx.db
            .query("mutedWords")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        return muted.map(m => ({ _id: m._id, word: m.word, createdAt: m.createdAt }));
    },
});

// Block a user
export const blockUser = mutation({
    args: { blockedUserId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        if (user._id === args.blockedUserId) {
            throw new Error("Cannot block yourself");
        }

        const existing = await ctx.db
            .query("blockedUsers")
            .withIndex("by_user_blocked", (q) => q.eq("userId", user._id).eq("blockedUserId", args.blockedUserId))
            .first();

        if (existing) return { alreadyBlocked: true };

        await ctx.db.insert("blockedUsers", {
            userId: user._id,
            blockedUserId: args.blockedUserId,
            createdAt: Date.now(),
        });

        return { success: true };
    },
});

// Unblock a user
export const unblockUser = mutation({
    args: { blockedUserId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const existing = await ctx.db
            .query("blockedUsers")
            .withIndex("by_user_blocked", (q) => q.eq("userId", user._id).eq("blockedUserId", args.blockedUserId))
            .first();

        if (!existing) return { notFound: true };

        await ctx.db.delete(existing._id);
        return { success: true };
    },
});

// Add a muted word
export const addMutedWord = mutation({
    args: { word: v.string() },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const normalized = args.word.trim().toLowerCase();
        if (!normalized) throw new Error("Word cannot be empty");

        const existing = await ctx.db
            .query("mutedWords")
            .withIndex("by_user_word", (q) => q.eq("userId", user._id).eq("word", normalized))
            .first();

        if (existing) return { alreadyMuted: true };

        await ctx.db.insert("mutedWords", {
            userId: user._id,
            word: normalized,
            createdAt: Date.now(),
        });

        return { success: true };
    },
});

// Remove a muted word
export const removeMutedWord = mutation({
    args: { word: v.string() },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const normalized = args.word.trim().toLowerCase();
        const existing = await ctx.db
            .query("mutedWords")
            .withIndex("by_user_word", (q) => q.eq("userId", user._id).eq("word", normalized))
            .first();

        if (!existing) return { notFound: true };

        await ctx.db.delete(existing._id);
        return { success: true };
    },
});
