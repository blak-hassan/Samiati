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
            .order("desc") // Newest first? Or usually threaded needs parent logical sort, but simpler flat list first for MVP
            .collect();

        // Enrich with author info and user vote
        const user = await getCurrentUser(ctx);

        const enriched = await Promise.all(comments.map(async (c) => {
            const author = await ctx.db.get(c.authorId);
            let userVote = 0; // 0, 1 (up), -1 (down)

            if (user) {
                const vote = await ctx.db
                    .query("commentVotes")
                    .withIndex("by_comment", (q) => q.eq("commentId", c._id).eq("userId", user._id))
                    .first();
                if (vote) {
                    userVote = vote.vote === 'up' ? 1 : -1;
                }
            }

            return {
                ...c,
                author: author ? {
                    name: author.name,
                    handle: author.handle,
                    avatar: author.avatar,
                } : null,
                userVote,
            };
        }));

        return enriched;
    },
});
