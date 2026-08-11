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
                .filter(q => q.eq(q.field("communityId"), args.communityId))
                .order("desc")
                .paginate(args.paginationOpts);
        } else if (args.filter === 'fireplace') {
            posts = await ctx.db.query("posts")
                .filter((q) => q.eq(q.field("isFireplace"), true))
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

        if (user) {
            const postIds = posts.page.map(p => p._id);

            const [likes, reposts, validations] = await Promise.all([
                Promise.all(postIds.map(postId =>
                    ctx.db.query("likes")
                        .withIndex("by_post", (q) => q.eq("postId", postId).eq("userId", user._id))
                        .first()
                )),
                Promise.all(postIds.map(postId =>
                    ctx.db.query("reposts")
                        .withIndex("by_user_post", (q) => q.eq("userId", user._id).eq("postId", postId))
                        .first()
                )),
                Promise.all(postIds.map(postId =>
                    ctx.db.query("validations")
                        .withIndex("by_user_post", (q) => q.eq("userId", user._id).eq("postId", postId))
                        .first()
                )),
            ]);

            likes.forEach((like, i) => { if (like) likedPostIds.add(postIds[i]); });
            reposts.forEach((repost, i) => { if (repost) repostedPostIds.add(postIds[i]); });
            validations.forEach((val, i) => { if (val) validatedPostIds.add(postIds[i]); });
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
