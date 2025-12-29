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

        // Populate author...

        const result = posts;

        // Enrich with user details and like status
        const postsWithDetails = await Promise.all(
            result.page.map(async (post) => {
                const author = await ctx.db.get(post.authorId);
                let isLiked = false;
                if (user) {
                    const like = await ctx.db
                        .query("likes")
                        .withIndex("by_post", (q) => q.eq("postId", post._id).eq("userId", user._id))
                        .first();
                    isLiked = !!like;
                }

                return {
                    ...post,
                    author: {
                        name: author?.name ?? "Unknown",
                        handle: author?.handle ?? "unknown",
                        avatar: author?.avatar ?? "",
                        isVerified: author?.role === 'admin' || author?.role === 'moderator', // Example logic
                    },
                    isLiked,
                    isReposted: false, // TODO: Implement reposts check
                    isValidated: false, // TODO: Implement validations check
                };
            })
        );

        return {
            ...result,
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

        // Get replies
        // Assuming replies are posts with matching 'parentId' or we use a separate structure?
        // Schema didn't have parentId in posts, but maybe 'messages' are used for comments?
        // Using 'comments' table for replies for now based on Plan Phase 6
        // But Typescript 'Post' interface has 'replies: Post[]'.
        // Let's stick to returning basic post info for now.

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
