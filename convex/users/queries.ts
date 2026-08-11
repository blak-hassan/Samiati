import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./utils";

// Fields to strip from public profiles
const SENSITIVE_FIELDS = ['email', 'clerkId', 'moderatorStatus'] as const;

function sanitizeUser(user: Record<string, unknown>) {
    const sanitized = { ...user };
    for (const field of SENSITIVE_FIELDS) {
        sanitized[field] = undefined;
    }
    return sanitized;
}

export const getProfile = query({
    args: {
        userId: v.optional(v.id("users")),
        handle: v.optional(v.string()),
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

        const isMe = currentUser?._id === user._id;
        // Return sensitive fields only for self; strip for others
        const profile = (isMe ? user : sanitizeUser(user as Record<string, unknown>)) as typeof user;
        return {
            ...profile,
            isFollowing,
            isMe,
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

        const users = await Promise.all(followers.map(async (f) => {
            const user = await ctx.db.get(f.followerId);
            return user ? sanitizeUser(user as Record<string, unknown>) : null;
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

        const users = await Promise.all(following.map(async (f) => {
            const user = await ctx.db.get(f.followingId);
            return user ? sanitizeUser(user as Record<string, unknown>) : null;
        }));

        return users.filter(u => u !== null);
    },
});
