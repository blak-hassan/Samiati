import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";

// Bookmark a post
export const bookmark = mutation({
    args: {
        postId: v.id("posts"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Check if already bookmarked
        const existing = await ctx.db
            .query("bookmarks")
            .withIndex("by_user_post", (q) =>
                q.eq("userId", user._id).eq("postId", args.postId)
            )
            .first();

        if (existing) {
            throw new Error("Already bookmarked");
        }

        await ctx.db.insert("bookmarks", {
            userId: user._id,
            postId: args.postId,
            timestamp: Date.now(),
        });

        return { success: true };
    },
});

// Remove bookmark
export const unbookmark = mutation({
    args: {
        postId: v.id("posts"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const existing = await ctx.db
            .query("bookmarks")
            .withIndex("by_user_post", (q) =>
                q.eq("userId", user._id).eq("postId", args.postId)
            )
            .first();

        if (!existing) {
            throw new Error("Not bookmarked");
        }

        await ctx.db.delete(existing._id);

        return { success: true };
    },
});

// Toggle bookmark
export const toggleBookmark = mutation({
    args: {
        postId: v.id("posts"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const existing = await ctx.db
            .query("bookmarks")
            .withIndex("by_user_post", (q) =>
                q.eq("userId", user._id).eq("postId", args.postId)
            )
            .first();

        if (existing) {
            await ctx.db.delete(existing._id);
            return { bookmarked: false };
        } else {
            await ctx.db.insert("bookmarks", {
                userId: user._id,
                postId: args.postId,
                timestamp: Date.now(),
            });
            return { bookmarked: true };
        }
    },
});
