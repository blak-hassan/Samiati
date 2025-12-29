import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./utils";

export const getProfile = query({
    args: {
        userId: v.optional(v.id("users")), // If empty, get current user
        handle: v.optional(v.string()), // Or get by handle
    },
    handler: async (ctx, args) => {
        let user;
        if (args.userId) {
            user = await ctx.db.get(args.userId);
        } else if (args.handle) {
            user = await ctx.db
                .query("users")
                .withIndex("by_handle", (q) => q.eq("handle", args.handle!))
                .unique();
        } else {
            user = await getCurrentUser(ctx);
        }

        if (!user) return null;

        // Get follow status if current user is viewing another
        let isFollowing = false;
        const currentUser = await getCurrentUser(ctx);
        if (currentUser && currentUser._id !== user._id) {
            const follow = await ctx.db
                .query("followers")
                .withIndex("by_follower", (q) => q.eq("followerId", currentUser._id))
                .filter(q => q.eq(q.field("followingId"), user._id))
                .first();
            isFollowing = !!follow;
        }

        return {
            ...user,
            isFollowing,
            isMe: currentUser?._id === user._id,
        };
    },
});

export const getFollowers = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const followers = await ctx.db
            .query("followers")
            .withIndex("by_following", (q) => q.eq("followingId", args.userId))
            .collect();

        // Enrich with user info
        const users = await Promise.all(followers.map(async (f) => {
            return await ctx.db.get(f.followerId);
        }));

        return users.filter(u => u !== null);
    },
});

export const getFollowing = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const following = await ctx.db
            .query("followers")
            .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
            .collect();

        // Enrich with user info
        const users = await Promise.all(following.map(async (f) => {
            return await ctx.db.get(f.followingId);
        }));

        return users.filter(u => u !== null);
    },
});
