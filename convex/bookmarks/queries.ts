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

        // Batch fetch all posts
        const posts = await Promise.all(bookmarks.map(b => ctx.db.get(b.postId)));
        const postMap = new Map(posts.filter(Boolean).map(p => [p!._id, p]));

        // Batch fetch all authors from posts
        const authorIds = [...new Set(posts.filter(Boolean).map(p => p!.authorId))];
        const authors = await Promise.all(authorIds.map(id => ctx.db.get(id)));
        const authorMap = new Map(authors.filter(Boolean).map(a => [a!._id, a]));

        // Enrich bookmarks
        const enriched = bookmarks.map((b) => {
            const post = postMap.get(b.postId);
            if (!post) return null;
            const author = authorMap.get(post.authorId);
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
        });

        return enriched.filter(Boolean);
    },
});
