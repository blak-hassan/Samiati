import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./utils";

// Update profile
export const updateProfile = mutation({
    args: {
        name: v.optional(v.string()),
        bio: v.optional(v.string()),
        avatar: v.optional(v.string()),
        location: v.optional(v.string()),
        // languages argument must match schema which is array of objects
        // or we simplify schema. For now, matching schema structure.
        languages: v.optional(v.array(v.object({
            id: v.string(),
            name: v.string(),
            level: v.string(),
            percent: v.number(),
        }))),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        await ctx.db.patch(user._id, {
            ...args,
        });
    },
});

// Follow a user
export const follow = mutation({
    args: {
        targetUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        if (user._id === args.targetUserId) throw new Error("Cannot follow self");

        const existing = await ctx.db
            .query("followers")
            .withIndex("by_follower", (q) => q.eq("followerId", user._id))
            .filter(q => q.eq(q.field("followingId"), args.targetUserId))
            .first();

        if (existing) return; // Already following

        await ctx.db.insert("followers", {
            followerId: user._id,
            followingId: args.targetUserId,
            createdAt: Date.now(),
        });

        // Update counts
        const targetUser = await ctx.db.get(args.targetUserId);
        if (targetUser) {
            await ctx.db.patch(args.targetUserId, {
                followerCount: (targetUser.followerCount || 0) + 1
            });
        }
        await ctx.db.patch(user._id, {
            followingCount: (user.followingCount || 0) + 1
        });

        // Notify target user
        await ctx.db.insert("notifications", {
            userId: args.targetUserId,
            type: "follow",
            title: "New Follower",
            message: `${user.name} started following you`,
            time: Date.now(),
            isRead: false,
            targetScreen: "PROFILE",
            metadata: { userId: user._id }
        });
    },
});

// Unfollow
export const unfollow = mutation({
    args: {
        targetUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const existing = await ctx.db
            .query("followers")
            .withIndex("by_follower", (q) => q.eq("followerId", user._id))
            .filter(q => q.eq(q.field("followingId"), args.targetUserId))
            .first();

        if (!existing) return;

        await ctx.db.delete(existing._id);

        // Update counts
        const targetUser = await ctx.db.get(args.targetUserId);
        if (targetUser) {
            await ctx.db.patch(args.targetUserId, {
                followerCount: Math.max(0, (targetUser.followerCount || 0) - 1)
            });
        }
        await ctx.db.patch(user._id, {
            followingCount: Math.max(0, (user.followingCount || 0) - 1)
        });
    },
});

// Sync Clerk user (store/update) from original users.ts
export const store = mutation({
    args: { name: v.string(), handle: v.string(), email: v.optional(v.string()), avatar: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called storeUser without authentication present");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (user !== null) {
            if (user.name !== args.name || user.handle !== args.handle || user.avatar !== args.avatar || user.email !== args.email) {
                await ctx.db.patch(user._id, { name: args.name, handle: args.handle, avatar: args.avatar, email: args.email });
            }
            return user._id;
        }

        // New user
        return await ctx.db.insert("users", {
            name: args.name,
            handle: args.handle,
            avatar: args.avatar,
            email: args.email,
            clerkId: identity.subject,
            role: 'member', // Default role
            isGuest: false,
            // joinedAt and isActive removed to match schema
            followerCount: 0,
            followingCount: 0,
            xp: 0,
            level: 1,
        });
    },
});
