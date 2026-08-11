import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, isAdmin, isModerator } from "./users/utils";

// Apply to become a moderator
export const applyForModerator = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        if (user.role === 'moderator' || user.role === 'admin') {
            throw new Error("You are already a moderator");
        }

        if (user.moderatorStatus?.isActive) {
            throw new Error("You have already applied to be a moderator");
        }

        await ctx.db.patch(user._id, {
            moderatorStatus: {
                appliedAt: Date.now(),
                isActive: true,
            },
        });

        return { success: true, message: "Application submitted successfully" };
    },
});

// Approve a moderator application (admin only)
export const approveModerator = mutation({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const admin = await getCurrentUser(ctx);
        if (!admin || !isAdmin(admin)) {
            throw new Error("Unauthorized: Only admins can approve moderators");
        }

        const user = await ctx.db.get(args.userId);
        if (!user) {
            throw new Error("User not found");
        }

        if (!user.moderatorStatus?.isActive) {
            throw new Error("User has not applied to be a moderator");
        }

        await ctx.db.patch(args.userId, {
            role: 'moderator',
            moderatorStatus: {
                ...user.moderatorStatus,
                approvedAt: Date.now(),
                approvedBy: admin._id,
                isActive: true,
            },
        });

        return { success: true, message: "Moderator approved successfully" };
    },
});

// Revoke moderator status (admin only)
export const revokeModerator = mutation({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const admin = await getCurrentUser(ctx);
        if (!admin || !isAdmin(admin)) {
            throw new Error("Unauthorized: Only admins can revoke moderators");
        }

        const user = await ctx.db.get(args.userId);
        if (!user) {
            throw new Error("User not found");
        }

        if (user.role !== 'moderator') {
            throw new Error("User is not a moderator");
        }

        await ctx.db.patch(args.userId, {
            role: 'member',
            moderatorStatus: user.moderatorStatus ? {
                ...user.moderatorStatus,
                isActive: false,
            } : undefined,
        });

        return { success: true, message: "Moderator status revoked" };
    },
});

// Get list of active moderators
export const getModerators = query({
    args: {},
    handler: async (ctx) => {
        const moderators = await ctx.db
            .query("users")
            .withIndex("by_role", (q) => q.eq("role", "moderator"))
            .collect();

        const admins = await ctx.db
            .query("users")
            .withIndex("by_role", (q) => q.eq("role", "admin"))
            .collect();

        return {
            moderators: moderators.map(m => ({
                id: m._id,
                name: m.name,
                handle: m.handle,
                avatar: m.avatar,
                role: m.role,
                approvedAt: m.moderatorStatus?.approvedAt,
            })),
            admins: admins.map(a => ({
                id: a._id,
                name: a.name,
                handle: a.handle,
                avatar: a.avatar,
                role: a.role,
            })),
        };
    },
});

// Get pending moderator applications (admin only)
export const getPendingApplications = query({
    args: {},
    handler: async (ctx) => {
        const admin = await getCurrentUser(ctx);
        if (!admin || !isAdmin(admin)) {
            throw new Error("Unauthorized: Only admins can view applications");
        }

        // Use indexed query to find users with active moderator applications
        // Filter by role != moderator/admin in memory (small subset)
        const allUsers = await ctx.db.query("users")
            .collect();

        const pendingApplications = allUsers.filter(user =>
            user.moderatorStatus?.isActive &&
            !user.moderatorStatus?.approvedAt
        );

        return pendingApplications.map(user => ({
            id: user._id,
            name: user.name,
            handle: user.handle,
            avatar: user.avatar,
            appliedAt: user.moderatorStatus!.appliedAt,
        }));
    },
});

// Update user role (admin only)
export const updateUserRole = mutation({
    args: {
        userId: v.id("users"),
        newRole: v.union(v.literal('admin'), v.literal('moderator'), v.literal('member')),
    },
    handler: async (ctx, args) => {
        const admin = await getCurrentUser(ctx);
        if (!admin || !isAdmin(admin)) {
            throw new Error("Unauthorized: Only admins can update user roles");
        }

        const user = await ctx.db.get(args.userId);
        if (!user) {
            throw new Error("User not found");
        }

        await ctx.db.patch(args.userId, {
            role: args.newRole,
        });

        return { success: true, message: `User role updated to ${args.newRole}` };
    },
});

// Check if user is moderator or admin
export const checkModeratorStatus = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);

        if (!user) {
            return { isModerator: false, isAdmin: false, role: 'member' };
        }

        return {
            isModerator: user.role === 'moderator' || user.role === 'admin',
            isAdmin: user.role === 'admin',
            role: user.role || 'member',
            hasPendingApplication: user.moderatorStatus?.isActive && !user.moderatorStatus?.approvedAt,
        };
    },
});
