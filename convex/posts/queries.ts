import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";
import { paginationOptsValidator } from "convex/server";

// Get main feed posts
export const feed = query({
    args: {
        paginationOpts: paginationOptsValidator,
        filter: v.optional(v.string()), // 'all', 'following', 'fireplace'
        communityId: v.optional(v.id("communities")),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        let posts;

        if (args.communityId) {
            posts = await ctx.db.query("posts")
                .withIndex("by_community_timestamp", (q) => q.eq("communityId", args.communityId))
                .order("desc")
                .paginate(args.paginationOpts);
        } else if (args.filter === 'fireplace') {
            posts = await ctx.db.query("posts")
                .withIndex("by_fireplace_timestamp", (q) => q.eq("isFireplace", true))
                .order("desc")
                .paginate(args.paginationOpts);
        } else {
            posts = await ctx.db.query("posts")
                .order("desc")
                .paginate(args.paginationOpts);
        }

        // Batch fetch all authors in parallel
        const authorIds = [...new Set(posts.page.map(p => p.authorId))];
        const authors = await Promise.all(authorIds.map(id => ctx.db.get(id)));
        const authorMap = new Map(authors.filter(Boolean).map(a => [a!._id, a]));

        // Batch fetch user interactions for all posts at once
        let likedPostIds = new Set<string>();
        let repostedPostIds = new Set<string>();
        let validatedPostIds = new Set<string>();

        if (user && posts.page.length > 0) {
            const postIds = new Set(posts.page.map(p => p._id));

            // 3 batched queries (one per interaction type) instead of 3 x N
            // point lookups — bounded by the user's own interaction history.
            const [likes, reposts, validations] = await Promise.all([
                ctx.db.query("likes")
                    .withIndex("by_user", (q) => q.eq("userId", user._id))
                    .collect(),
                ctx.db.query("reposts")
                    .withIndex("by_user", (q) => q.eq("userId", user._id))
                    .collect(),
                ctx.db.query("validations")
                    .withIndex("by_user", (q) => q.eq("userId", user._id))
                    .collect(),
            ]);

            likes.forEach((like) => { if (postIds.has(like.postId)) likedPostIds.add(like.postId); });
            reposts.forEach((repost) => { if (postIds.has(repost.postId)) repostedPostIds.add(repost.postId); });
            validations.forEach((val) => { if (postIds.has(val.postId)) validatedPostIds.add(val.postId); });
        }

        // Enrich posts
        const postsWithDetails = posts.page.map((post) => {
            const author = authorMap.get(post.authorId);
            return {
                ...post,
                author: {
                    name: author?.name ?? "Unknown",
                    handle: author?.handle ?? "unknown",
                    avatar: author?.avatar ?? "",
                    isVerified: author?.role === 'admin' || author?.role === 'moderator',
                },
                isLiked: likedPostIds.has(post._id),
                isReposted: repostedPostIds.has(post._id),
                isValidated: validatedPostIds.has(post._id),
            };
        });

        return {
            ...posts,
            page: postsWithDetails,
        };
    },
});

// Get single post details
export const get = query({
    args: {
        postId: v.id("posts"),
    },
    handler: async (ctx, args) => {
        const post = await ctx.db.get(args.postId);
        if (!post) return null;

        const author = await ctx.db.get(post.authorId);

        return {
            ...post,
            author: {
                name: author?.name ?? "Unknown",
                handle: author?.handle,
                avatar: author?.avatar,
            },
        };
    },
});
