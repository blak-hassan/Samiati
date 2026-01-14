import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";

// Check if user has bookmarked a post
export const isBookmarked = query({
    args: {
        postId: v.id("posts"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return false;

        const existing = await ctx.db
            .query("bookmarks")
            .withIndex("by_user_post", (q) =>
                q.eq("userId", user._id).eq("postId", args.postId)
            )
            .first();

        return !!existing;
    },
});

// Get all bookmarks for current user
export const getUserBookmarks = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        const bookmarks = await ctx.db
            .query("bookmarks")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .order("desc")
            .take(args.limit || 50);

        // Enrich with post and author data
        const enriched = await Promise.all(
            bookmarks.map(async (b) => {
                const post = await ctx.db.get(b.postId);
                if (!post) return null;

                const author = await ctx.db.get(post.authorId);

                return {
                    ...b,
                    post: {
                        ...post,
                        author: author ? {
                            name: author.name,
                            handle: author.handle,
                            avatar: author.avatar,
                        } : null,
                    },
                };
            })
        );

        return enriched.filter(Boolean);
    },
});
