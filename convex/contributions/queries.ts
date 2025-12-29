import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";

// Get user's contributions
export const getUserContributions = query({
    args: {
        userId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        let targetId = args.userId;
        if (!targetId) {
            const user = await getCurrentUser(ctx);
            if (!user) return []; // Or throw unauthorized
            targetId = user._id;
        }

        const contributions = await ctx.db
            .query("contributions")
            .withIndex("by_user", (q) => q.eq("userId", targetId!))
            .order("desc")
            .collect();

        return contributions;
    },
});

// Get a single contribution
export const getContribution = query({
    args: {
        contributionId: v.id("contributions"),
    },
    handler: async (ctx, args) => {
        const contribution = await ctx.db.get(args.contributionId);
        if (!contribution) return null;

        const author = await ctx.db.get(contribution.userId);

        return {
            ...contribution,
            author: author ? {
                name: author.name,
                avatar: author.avatar,
            } : null
        };
    },
});

// Get pending contributions (for moderators)
export const getPending = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
            throw new Error("Unauthorized");
        }

        // We don't have an index for status yet, scanning is okay for low volume
        // But better to add index "by_status" in schema if strictly needed.
        // For now, let's filter in memory or assume validation is enough.
        // Actually schema has "status" but no index. For MVP scan is fine.

        const allContributions = await ctx.db.query("contributions").collect();
        return allContributions.filter(c => c.status === 'Under Review');
    },
});
