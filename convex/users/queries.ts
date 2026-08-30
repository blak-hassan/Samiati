import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./utils";

// Fields to strip from public profiles
const SENSITIVE_FIELDS = ['email', 'clerkId', 'moderatorStatus', 'lastSeen', 'isOnline'] as const;

function sanitizeUser(user: Record<string, unknown>) {
    const sanitized = { ...user };
    for (const field of SENSITIVE_FIELDS) {
        sanitized[field] = undefined;
    }
    return sanitized;
}

function isProfileVisible(user: Record<string, unknown>, viewerId?: string): boolean {
    // Only the owner can view their own private profile
    if (viewerId !== undefined && String(user._id as unknown as string) === String(viewerId)) return true;
    // If the profile is set to hidden, only the owner (handled above) can see it
    return user.profileVisible !== false;
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
        const viewerId = currentUser?._id;
        
        if (!isProfileVisible(user as Record<string, unknown>, viewerId)) {
            return null;
        }

        if (currentUser && currentUser._id !== user._id) {
            const follow = await ctx.db
                .query("followers")
                .withIndex("by_follower_following", (q) => q.eq("followerId", currentUser._id).eq("followingId", user._id))
                .first();
            isFollowing = !!follow;
        }

        const isMe = currentUser?._id === user._id;
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
        const currentUser = await getCurrentUser(ctx);
        const isSelf = currentUser?._id === args.userId;

        const followers = await ctx.db
            .query("followers")
            .withIndex("by_following", (q) => q.eq("followingId", args.userId))
            .take(1000);

        const users = await Promise.all(followers.map(async (f) => {
            const user = await ctx.db.get(f.followerId);
            if (!user) return null;
            if (!isSelf && !isProfileVisible(user as Record<string, unknown>, currentUser?._id)) return null;
            return sanitizeUser(user as Record<string, unknown>);
        }));

        return users.filter((u): u is NonNullable<typeof u> => u !== null);
    },
});

export const getFollowing = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUser(ctx);
        const isSelf = currentUser?._id === args.userId;

        const following = await ctx.db
            .query("followers")
            .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
            .take(1000);

        const users = await Promise.all(following.map(async (f) => {
            const user = await ctx.db.get(f.followingId);
            if (!user) return null;
            if (!isSelf && !isProfileVisible(user as Record<string, unknown>, currentUser?._id)) return null;
            return sanitizeUser(user as Record<string, unknown>);
        }));

        return users.filter((u): u is NonNullable<typeof u> => u !== null);
    },
});
