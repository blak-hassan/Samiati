import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";

// Create a new post
export const create = mutation({
    args: {
        content: v.string(),
        type: v.string(), // 'standard', 'proverb', etc
        image: v.optional(v.string()),
        altText: v.optional(v.string()),
        languageTag: v.optional(v.string()),
        isFireplace: v.optional(v.boolean()),
        // Add other specific fields as optional
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const postId = await ctx.db.insert("posts", {
            content: args.content,
            type: args.type,
            authorId: user._id,
            timestamp: Date.now(),
            image: args.image,
            altText: args.altText,
            languageTag: args.languageTag,
            isFireplace: args.isFireplace,
            stats: {
                replies: 0,
                reposts: 0,
                likes: 0,
                validations: 0,
            },
        });

        // If fireplace, maybe trigger notification?

        return postId;
    },
});

// Like a post
export const like = mutation({
    args: {
        postId: v.id("posts"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const existingLike = await ctx.db
            .query("likes")
            .withIndex("by_post", (q) => q.eq("postId", args.postId).eq("userId", user._id))
            .first();

        if (existingLike) {
            // Unlike
            await ctx.db.delete(existingLike._id);
            // Decrement stats
            const post = await ctx.db.get(args.postId);
            if (post) {
                await ctx.db.patch(args.postId, {
                    stats: { ...post.stats, likes: Math.max(0, post.stats.likes - 1) }
                });
            }
            return false; // Liked = false
        } else {
            // Like
            await ctx.db.insert("likes", {
                postId: args.postId,
                userId: user._id,
            });
            // Increment stats
            const post = await ctx.db.get(args.postId);
            if (post) {
                await ctx.db.patch(args.postId, {
                    stats: { ...post.stats, likes: post.stats.likes + 1 }
                });
            }
            return true; // Liked = true
        }
    },
});

// Delete a post
export const deletePost = mutation({
    args: {
        postId: v.id("posts"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const post = await ctx.db.get(args.postId);
        if (!post) throw new Error("Post not found");

        if (post.authorId !== user._id && user.role !== 'admin' && user.role !== 'moderator') {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.postId);
    },
});
