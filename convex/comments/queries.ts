import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";

// Get comments for a target (post/contribution)
export const list = query({
    args: {
        targetId: v.string(),
        targetType: v.union(v.literal('post'), v.literal('contribution')),
    },
    handler: async (ctx, args) => {
        // Bound the result so a thread with thousands of comments can't
        // blow up the payload; nested replies stay intact for typical use.
        const comments = await ctx.db
            .query("comments")
            .withIndex("by_target", (q) => q.eq("targetType", args.targetType).eq("targetId", args.targetId))
            .order("desc")
            .take(150);

        const user = await getCurrentUser(ctx);

        // Batch fetch all authors
        const authorIds = [...new Set(comments.map(c => c.authorId))];
        const authors = await Promise.all(authorIds.map(id => ctx.db.get(id)));
        const authorMap = new Map(authors.filter(Boolean).map(a => [a!._id, a]));

        // Batch fetch all user votes in a single query (bounded by the
        // user's own vote history) instead of one query per comment.
        let commentVoteMap = new Map<string, number>();
        if (user && comments.length > 0) {
            const commentIds = new Set(comments.map(c => c._id));
            const votes = await ctx.db
                .query("commentVotes")
                .withIndex("by_user", (q) => q.eq("userId", user._id))
                .collect();

            votes.forEach((vote) => {
                if (commentIds.has(vote.commentId)) {
                    commentVoteMap.set(vote.commentId, vote.vote === 'up' ? 1 : -1);
                }
            });
        }

        // Enrich comments
        const enriched = comments.map((c) => {
            const author = authorMap.get(c.authorId);
            return {
                ...c,
                author: author ? {
                    name: author.name,
                    handle: author.handle,
                    avatar: author.avatar,
                } : null,
                userVote: commentVoteMap.get(c._id) ?? 0,
            };
        });

        return enriched;
    },
});
