import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, isGuestUser } from "./utils";

// Input validation constants
const MAX_NAME_LENGTH = 100;
const MAX_BIO_LENGTH = 500;
const MAX_LOCATION_LENGTH = 200;

// Input sanitization helper
function sanitizeInput(input: string, maxLength: number): string {
    return input.trim().slice(0, maxLength);
}

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
        
        // Guests cannot update their profile
        if (isGuestUser(user)) {
            throw new Error("Guest users cannot update their profile");
        }

        // Build update object with validation
        const updates: Record<string, unknown> = {};
        
        if (args.name !== undefined) {
            if (args.name.length > MAX_NAME_LENGTH) {
                throw new Error(`Name exceeds maximum length of ${MAX_NAME_LENGTH} characters`);
            }
            updates.name = sanitizeInput(args.name, MAX_NAME_LENGTH);
        }
        
        if (args.bio !== undefined) {
            if (args.bio.length > MAX_BIO_LENGTH) {
                throw new Error(`Bio exceeds maximum length of ${MAX_BIO_LENGTH} characters`);
            }
            updates.bio = sanitizeInput(args.bio, MAX_BIO_LENGTH);
        }
        
        if (args.avatar !== undefined) {
            updates.avatar = args.avatar;
        }
        
        if (args.location !== undefined) {
            if (args.location.length > MAX_LOCATION_LENGTH) {
                throw new Error(`Location exceeds maximum length of ${MAX_LOCATION_LENGTH} characters`);
            }
            updates.location = sanitizeInput(args.location, MAX_LOCATION_LENGTH);
        }
        
        if (args.languages !== undefined) {
            // Validate languages array
            if (args.languages.length > 20) {
                throw new Error("Too many languages specified");
            }
            updates.languages = args.languages;
        }

        await ctx.db.patch(user._id, updates);
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
        
        // Guests cannot follow users
        if (isGuestUser(user)) {
            throw new Error("Guest users cannot follow other users");
        }

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

// Create a guest user (public - no auth required for initial creation)
// This allows guests to use the app with limited permissions
export const storeGuestUser = mutation({
    args: { 
        name: v.string(), 
        handle: v.string(), 
        avatar: v.optional(v.string()) 
    },
    handler: async (ctx, args) => {
        // For guest users, we generate a unique ID based on timestamp
        // In production, you'd want more robust guest identification
        const guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 15)}`;
        
        // Check if a guest user with this ID already exists
        const existingGuest = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", guestId))
            .unique();
            
        if (existingGuest) {
            return existingGuest._id;
        }
        
        // Validate handle uniqueness
        const existingHandle = await ctx.db
            .query("users")
            .withIndex("by_handle", (q) => q.eq("handle", args.handle))
            .unique();
            
        if (existingHandle) {
            // Generate a unique handle
            args.handle = `${args.handle}_${Math.random().toString(36).slice(2, 6)}`;
        }
        
        // Create new guest user
        return await ctx.db.insert("users", {
            name: args.name,
            handle: args.handle,
            avatar: args.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=guest",
            email: undefined,
            clerkId: guestId,
            role: 'member',
            isGuest: true,
            followerCount: 0,
            followingCount: 0,
            xp: 0,
            level: 1,
        });
    },
});
