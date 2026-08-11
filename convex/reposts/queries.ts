import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";

// Check if user has reposted a post
export const hasReposted = query({
    args: {
        postId: v.id("posts"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return false;

        const existing = await ctx.db
            .query("reposts")
            .withIndex("by_user_post", (q) =>
                q.eq("userId", user._id).eq("postId", args.postId)
            )
            .first();

        return !!existing;
    },
});

// Get all reposts by current user
export const getUserReposts = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        const reposts = await ctx.db
            .query("reposts")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .order("desc")
            .take(args.limit || 50);

        // Batch fetch all posts
        const posts = await Promise.all(reposts.map(r => ctx.db.get(r.postId)));
        const postMap = new Map(posts.filter(Boolean).map(p => [p!._id, p]));

        // Enrich reposts
        const enriched = reposts.map((r) => {
            const post = postMap.get(r.postId);
            return {
                ...r,
                post,
            };
        });

        return enriched;
    },
});
