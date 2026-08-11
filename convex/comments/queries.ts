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
        const comments = await ctx.db
            .query("comments")
            .withIndex("by_target", (q) => q.eq("targetType", args.targetType).eq("targetId", args.targetId))
            .order("desc")
            .collect();

        const user = await getCurrentUser(ctx);

        // Batch fetch all authors
        const authorIds = [...new Set(comments.map(c => c.authorId))];
        const authors = await Promise.all(authorIds.map(id => ctx.db.get(id)));
        const authorMap = new Map(authors.filter(Boolean).map(a => [a!._id, a]));

        // Batch fetch all user votes
        let commentVoteMap = new Map<string, number>();
        if (user) {
            const votes = await Promise.all(comments.map(c =>
                ctx.db.query("commentVotes")
                    .withIndex("by_comment", (q) => q.eq("commentId", c._id).eq("userId", user._id))
                    .first()
            ));
            votes.forEach((vote, i) => {
                if (vote) {
                    commentVoteMap.set(comments[i]._id, vote.vote === 'up' ? 1 : -1);
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
