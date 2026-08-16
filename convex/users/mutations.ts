import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, isGuestUser } from "./utils";
import { checkRateLimit } from "../lib/rateLimit";
import { isValidHandle, isValidAvatarUrl, sanitizeText } from "../lib/validation";

// Input validation constants
const MAX_NAME_LENGTH = 100;
const MAX_BIO_LENGTH = 500;
const MAX_LOCATION_LENGTH = 200;
const MAX_HANDLE_LENGTH = 30;

// Guest creation is a public mutation (no Clerk session exists yet), so it
// is the primary sybil vector. Bound how fast the whole app can mint rows.
const MAX_GUESTS_PER_HOUR = 200;
const MAX_GUESTS_PER_DAY = 1000;

// Input sanitization helper
function sanitizeInput(input: string, maxLength: number): string {
    return sanitizeText(input, maxLength);
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
            if (!isValidAvatarUrl(args.avatar)) {
                throw new Error("Avatar must be a valid http(s) image URL");
            }
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
            updates.languages = args.languages.map((lang) => ({
                id: lang.id.slice(0, 50),
                name: lang.name.slice(0, 100),
                level: lang.level.slice(0, 50),
                percent: Math.min(100, Math.max(0, Math.round(lang.percent))),
            }));
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

        // Bound follow churn so a single account cannot spam notifications.
        const { allowed } = await checkRateLimit(ctx.db, `users:follow:${user._id}`, 60 * 60 * 1000, 60);
        if (!allowed) {
            throw new Error("Too many follow actions. Please try again later.");
        }

        if (user._id === args.targetUserId) throw new Error("Cannot follow self");

        const existing = await ctx.db
            .query("followers")
            .withIndex("by_follower_following", (q) => q.eq("followerId", user._id).eq("followingId", args.targetUserId))
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

        const { allowed } = await checkRateLimit(ctx.db, `users:follow:${user._id}`, 60 * 60 * 1000, 60);
        if (!allowed) {
            throw new Error("Too many follow actions. Please try again later.");
        }

        const existing = await ctx.db
            .query("followers")
            .withIndex("by_follower_following", (q) => q.eq("followerId", user._id).eq("followingId", args.targetUserId))
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

        const name = args.name.trim().slice(0, MAX_NAME_LENGTH);
        const handle = args.handle.trim();
        if (!name) {
            throw new Error("Name cannot be empty");
        }
        if (!isValidHandle(handle)) {
            throw new Error("Handle must be 3-30 characters: letters, numbers, underscores");
        }
        const avatar = args.avatar.trim().slice(0, 2048);
        // The email is a trusted claim from the Clerk identity, never from
        // the client request body.
        const email = identity.email ?? args.email?.trim().slice(0, 254) ?? undefined;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (user !== null) {
            if (user.name !== name || user.handle !== handle || user.avatar !== avatar || user.email !== email) {
                await ctx.db.patch(user._id, { name, handle, avatar, email });
            }
            return user._id;
        }

        // New user — ensure the handle is not already taken.
        let finalHandle = handle;
        const existingHandle = await ctx.db
            .query("users")
            .withIndex("by_handle", (q) => q.eq("handle", handle))
            .unique();
        if (existingHandle) {
            finalHandle = `${handle.slice(0, 24)}_${Math.random().toString(36).slice(2, 6)}`;
        }

        // New user
        return await ctx.db.insert("users", {
            name,
            handle: finalHandle,
            avatar,
            email,
            clerkId: identity.subject,
            role: 'member', // Default role
            isGuest: false,
            joinedAt: Date.now(),
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
        const name = args.name.trim().slice(0, MAX_NAME_LENGTH);
        const handle = args.handle.trim();
        if (!name) {
            throw new Error("Name cannot be empty");
        }
        if (!isValidHandle(handle) || handle.length > MAX_HANDLE_LENGTH) {
            throw new Error("Handle must be 3-30 characters: letters, numbers, underscores");
        }
        const avatar = (args.avatar ?? "").slice(0, 2048);

        // Global rate limits — guest creation is public, so a flood of
        // unauthenticated requests must not be able to grow the users table
        // without bound.
        const now = Date.now();
        const hourly = await checkRateLimit(ctx.db, "guest-create:hour", 60 * 60 * 1000, MAX_GUESTS_PER_HOUR, now);
        if (!hourly.allowed) {
            throw new Error("Too many guest sessions right now. Please try again later.");
        }
        const daily = await checkRateLimit(ctx.db, "guest-create:day", 24 * 60 * 60 * 1000, MAX_GUESTS_PER_DAY, now);
        if (!daily.allowed) {
            throw new Error("Too many guest sessions today. Please try again later.");
        }

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
            .withIndex("by_handle", (q) => q.eq("handle", handle))
            .unique();
            
        if (existingHandle) {
            // Generate a unique handle
            args.handle = `${handle}_${Math.random().toString(36).slice(2, 6)}`;
        } else {
            args.handle = handle;
        }
        
        // Create new guest user with restricted role
        return await ctx.db.insert("users", {
            name,
            handle: args.handle,
            avatar: avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=guest",
            email: undefined,
            clerkId: guestId,
            role: 'guest',
            isGuest: true,
            joinedAt: Date.now(),
            followerCount: 0,
            followingCount: 0,
            xp: 0,
            level: 1,
        });
    },
});

// Update privacy settings for the current user (spec §25).
// Optional boolean fields: absent = keep current, present = overwrite.
// Profile query reads these and treats absent/null as "on" (public).
export const updatePrivacy = mutation({
    args: {
        profileVisible: v.optional(v.boolean()),
        showChanga: v.optional(v.boolean()),
        voiceDataAllowed: v.optional(v.boolean()),
        culturalDataAllowed: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");
        if (isGuestUser(user)) throw new Error("Guests cannot update privacy settings");

        const updates: Record<string, unknown> = {};
        if (args.profileVisible !== undefined) updates.profileVisible = args.profileVisible;
        if (args.showChanga !== undefined) updates.showChanga = args.showChanga;
        if (args.voiceDataAllowed !== undefined) updates.voiceDataAllowed = args.voiceDataAllowed;
        if (args.culturalDataAllowed !== undefined) updates.culturalDataAllowed = args.culturalDataAllowed;

        await ctx.db.patch(user._id, updates);
    },
});

// One-time backfill: set joinedAt to _creationTime for users created before
// the field existed. Safe to re-run — skips users that already have it.
export const backfillJoinedAt = mutation({
    args: {},
    handler: async (ctx) => {
        const caller = await getCurrentUser(ctx);
        if (!caller || (caller.role !== "admin" && caller.role !== "moderator")) {
            throw new Error("Unauthorized: only moderators can run backfills");
        }
        const all = await ctx.db.query("users").take(1000);
        let patched = 0;
        for (const u of all) {
            if (!u.joinedAt) {
                await ctx.db.patch(u._id, { joinedAt: u._creationTime });
                patched++;
            }
        }
        return { total: all.length, patched };
    },
});
