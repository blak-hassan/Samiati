import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";
import { Id } from "../_generated/dataModel";

// Add a comment
export const add = mutation({
    args: {
        targetId: v.string(),
        targetType: v.union(v.literal('post'), v.literal('contribution')),
        content: v.string(),
        parentId: v.optional(v.id("comments")),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const commentId = await ctx.db.insert("comments", {
            targetType: args.targetType,
            targetId: args.targetId,
            authorId: user._id,
            content: args.content,
            parentId: args.parentId,
            likes: 0,
            dislikes: 0,
            timestamp: Date.now(),
        });

        if (args.targetType === 'post') {
            const post = await ctx.db.get(args.targetId as Id<"posts">);
            if (post) {
                await ctx.db.patch(post._id, {
                    stats: { ...post.stats, replies: post.stats.replies + 1 }
                });

                // Notify post author (if not self)
                if (post.authorId !== user._id) {
                    await ctx.db.insert("notifications", {
                        userId: post.authorId,
                        type: "comment",
                        title: "New Reply",
                        message: `${user.name} replied to your post`,
                        time: Date.now(),
                        isRead: false,
                        targetScreen: "POST_DETAILS", // Placeholder
                        metadata: { postId: post._id, commentId }
                    });
                }
            }
        } else if (args.targetType === 'contribution') {
            const contribution = await ctx.db.get(args.targetId as Id<"contributions">);
            if (contribution) {
                await ctx.db.patch(contribution._id, {
                    commentsCount: (contribution.commentsCount || 0) + 1
                });
            }
        }

        return commentId;
    },
});

// Vote on a comment
export const vote = mutation({
    args: {
        commentId: v.id("comments"),
        voteType: v.union(v.literal('up'), v.literal('down')),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const existingVote = await ctx.db
            .query("commentVotes")
            .withIndex("by_comment", (q) => q.eq("commentId", args.commentId).eq("userId", user._id))
            .first();

        const comment = await ctx.db.get(args.commentId);
        if (!comment) throw new Error("Comment not found");

        if (existingVote) {
            // If same vote, toggle off (remove vote)
            if (existingVote.vote === args.voteType) {
                await ctx.db.delete(existingVote._id);
                if (args.voteType === 'up') {
                    await ctx.db.patch(comment._id, { likes: Math.max(0, comment.likes - 1) });
                } else {
                    await ctx.db.patch(comment._id, { dislikes: Math.max(0, comment.dislikes - 1) });
                }
            } else {
                // Change vote
                await ctx.db.patch(existingVote._id, { vote: args.voteType });
                if (args.voteType === 'up') {
                    await ctx.db.patch(comment._id, {
                        likes: comment.likes + 1,
                        dislikes: Math.max(0, comment.dislikes - 1)
                    });
                } else {
                    await ctx.db.patch(comment._id, {
                        likes: Math.max(0, comment.likes - 1),
                        dislikes: comment.dislikes + 1
                    });
                }
            }
        } else {
            // New vote
            await ctx.db.insert("commentVotes", {
                commentId: args.commentId,
                userId: user._id,
                vote: args.voteType,
            });
            if (args.voteType === 'up') {
                await ctx.db.patch(comment._id, { likes: comment.likes + 1 });
            } else {
                await ctx.db.patch(comment._id, { dislikes: comment.dislikes + 1 });
            }
        }
    },
});

// Delete comment
export const deleteComment = mutation({
    args: {
        commentId: v.id("comments"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const comment = await ctx.db.get(args.commentId);
        if (!comment) throw new Error("Comment not found");

        if (comment.authorId !== user._id && user.role !== 'admin' && user.role !== 'moderator') {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.commentId);

        // Decrement stats? (Ideally yes, but skipped for brevity in MVPs often. Let's do it right if easy)
        // Hard to know original target type purely from comment unless we query it or trust schema.
        if (comment.targetType === 'post') {
            const post = await ctx.db.get(comment.targetId as Id<"posts">);
            if (post) {
                await ctx.db.patch(post._id, {
                    stats: { ...post.stats, replies: Math.max(0, post.stats.replies - 1) }
                });
            }
        } else if (comment.targetType === 'contribution') {
            const contribution = await ctx.db.get(comment.targetId as Id<"contributions">);
            if (contribution) {
                await ctx.db.patch(contribution._id, {
                    commentsCount: Math.max(0, (contribution.commentsCount || 0) - 1)
                });
            }
        }
    },
});
