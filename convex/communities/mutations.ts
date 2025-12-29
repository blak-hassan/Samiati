import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";

// Create community
export const create = mutation({
    args: {
        name: v.string(),
        description: v.string(),
        category: v.string(),
        avatar: v.optional(v.string()),
        coverImage: v.optional(v.string()),
        isPrivate: v.boolean(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const communityId = await ctx.db.insert("communities", {
            name: args.name,
            description: args.description,
            category: args.category,
            avatar: args.avatar,
            coverImage: args.coverImage,
            isPrivate: args.isPrivate,
            memberCount: 1,
            createdBy: user._id,
            createdAt: Date.now(),
        });

        // Add creator as admin
        await ctx.db.insert("communityMembers", {
            communityId,
            userId: user._id,
            role: 'admin',
            joinedAt: Date.now(),
        });

        return communityId;
    },
});

// Join community
export const join = mutation({
    args: {
        communityId: v.id("communities"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const existing = await ctx.db
            .query("communityMembers")
            .withIndex("by_community", (q) => q.eq("communityId", args.communityId))
            .filter(q => q.eq(q.field("userId"), user._id))
            .first();

        if (existing) return; // Already linked

        await ctx.db.insert("communityMembers", {
            communityId: args.communityId,
            userId: user._id,
            role: 'member',
            joinedAt: Date.now(),
        });

        const community = await ctx.db.get(args.communityId);
        if (community) {
            await ctx.db.patch(args.communityId, {
                memberCount: community.memberCount + 1
            });
        }
    },
});

// Leave community
export const leave = mutation({
    args: {
        communityId: v.id("communities"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const membership = await ctx.db
            .query("communityMembers")
            .withIndex("by_community", (q) => q.eq("communityId", args.communityId))
            .filter(q => q.eq(q.field("userId"), user._id))
            .first();

        if (!membership) return;

        await ctx.db.delete(membership._id);

        const community = await ctx.db.get(args.communityId);
        if (community) {
            await ctx.db.patch(args.communityId, {
                memberCount: Math.max(0, community.memberCount - 1)
            });
        }
    },
});
