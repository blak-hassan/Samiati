import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";

// List communities
export const list = query({
    args: {
        category: v.optional(v.string()), // 'Language', 'Culture', etc
    },
    handler: async (ctx, args) => {
        let communitiesQuery = ctx.db.query("communities");

        if (args.category && args.category !== 'All') {
            const categoryQuery = communitiesQuery.withIndex("by_category", (q) => q.eq("category", args.category!));
            return await categoryQuery.collect();
        }

        return await communitiesQuery.collect();
    },
});

// Get community details
export const get = query({
    args: {
        communityId: v.id("communities"),
    },
    handler: async (ctx, args) => {
        const community = await ctx.db.get(args.communityId);
        if (!community) return null;

        const user = await getCurrentUser(ctx);
        let isMember = false;
        let role = null;

        if (user) {
            const membership = await ctx.db
                .query("communityMembers")
                .withIndex("by_community", (q) => q.eq("communityId", args.communityId))
                .filter(q => q.eq(q.field("userId"), user._id))
                .first();
            if (membership) {
                isMember = true;
                role = membership.role;
            }
        }

        return {
            ...community,
            isMember,
            role,
        };
    },
});
