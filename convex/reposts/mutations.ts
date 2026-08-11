import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";

// Repost a post
export const repost = mutation({
    args: {
        postId: v.id("posts"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Check if already reposted
        const existing = await ctx.db
            .query("reposts")
            .withIndex("by_user_post", (q) =>
                q.eq("userId", user._id).eq("postId", args.postId)
            )
            .first();

        if (existing) {
            throw new Error("Already reposted");
        }

        // Create repost
        await ctx.db.insert("reposts", {
            userId: user._id,
            postId: args.postId,
            timestamp: Date.now(),
        });

        // Update post stats
        const post = await ctx.db.get(args.postId);
        if (post) {
            await ctx.db.patch(args.postId, {
                stats: {
                    ...post.stats,
                    reposts: post.stats.reposts + 1,
                },
            });

            // Notify post author (if not self-reposting)
            if (post.authorId !== user._id) {
                await ctx.db.insert("notifications", {
                    userId: post.authorId,
                    type: "repost",
                    title: "New Repost",
                    message: `${user.name} reposted your post`,
                    time: Date.now(),
                    isRead: false,
                    targetScreen: "POST_THREAD",
                    metadata: { postId: post._id, reposterId: user._id },
                });
            }
        }

        return { success: true };
    },
});

// Remove a repost
export const unrepost = mutation({
    args: {
        postId: v.id("posts"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const existing = await ctx.db
            .query("reposts")
            .withIndex("by_user_post", (q) =>
                q.eq("userId", user._id).eq("postId", args.postId)
            )
            .first();

        if (!existing) {
            throw new Error("Not reposted");
        }

        await ctx.db.delete(existing._id);

        // Update post stats
        const post = await ctx.db.get(args.postId);
        if (post && post.stats.reposts > 0) {
            await ctx.db.patch(args.postId, {
                stats: {
                    ...post.stats,
                    reposts: post.stats.reposts - 1,
                },
            });
        }

        return { success: true };
    },
});

// Toggle repost (convenience function)
export const toggleRepost = mutation({
    args: {
        postId: v.id("posts"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const existing = await ctx.db
            .query("reposts")
            .withIndex("by_user_post", (q) =>
                q.eq("userId", user._id).eq("postId", args.postId)
            )
            .first();

        if (existing) {
            // Unrepost
            await ctx.db.delete(existing._id);
            const post = await ctx.db.get(args.postId);
            if (post && post.stats.reposts > 0) {
                await ctx.db.patch(args.postId, {
                    stats: {
                        ...post.stats,
                        reposts: post.stats.reposts - 1,
                    },
                });
            }
            return { reposted: false };
        } else {
            // Repost
            await ctx.db.insert("reposts", {
                userId: user._id,
                postId: args.postId,
                timestamp: Date.now(),
            });
            const post = await ctx.db.get(args.postId);
            if (post) {
                await ctx.db.patch(args.postId, {
                    stats: {
                        ...post.stats,
                        reposts: post.stats.reposts + 1,
                    },
                });

                // Notify post author (if not self-reposting)
                if (post.authorId !== user._id) {
                    await ctx.db.insert("notifications", {
                        userId: post.authorId,
                        type: "repost",
                        title: "New Repost",
                        message: `${user.name} reposted your post`,
                        time: Date.now(),
                        isRead: false,
                        targetScreen: "POST_THREAD",
                        metadata: { postId: post._id, reposterId: user._id },
                    });
                }
            }
            return { reposted: true };
        }
    },
});
