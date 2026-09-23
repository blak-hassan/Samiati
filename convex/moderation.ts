import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, isAdmin, isModerator } from "./users/utils";
import { chokepoint } from "./lib/chokepoint";

// Apply to become a moderator. The applicant declares which languages
// they can moderate; on approval those are auto-elevated to a
// language-scoped Changa role grant.
export const applyForModerator = mutation({
    args: {
        requestedLanguages: v.optional(v.array(v.string())),
        motivation: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
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
                requestedLanguages: (args.requestedLanguages ?? []).slice(0, 12),
                motivation: args.motivation?.slice(0, 1000),
            },
        });

        return { success: true, message: "Application submitted successfully" };
    },
});

// Approve a moderator application AND auto-grant language-scoped Changa
// roles for each requested language. Admin only.
export const approveModeratorApplication = mutation({
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

        const requestedLanguages = (user.moderatorStatus.requestedLanguages ?? []).slice(0, 12);

        await ctx.db.patch(args.userId, {
            role: 'moderator',
            moderatorStatus: {
                ...user.moderatorStatus,
                approvedAt: Date.now(),
                approvedBy: admin._id,
                isActive: true,
            },
        });

        // Auto-grant language_moderator for every requested language.
        for (const languageCode of requestedLanguages) {
            // Revoke any existing active grant for this scope first.
            const existing = await ctx.db
                .query("changaRoleGrants")
                .withIndex("by_user_language", (q) =>
                    q.eq("userId", args.userId).eq("languageCode", languageCode)
                )
                .collect();
            const activeIds = existing
                .filter((grant) => grant.status === "active")
                .map((grant) => grant._id);
            if (activeIds.length > 0) {
                await chokepoint.revokeRoleGrants(ctx, activeIds);
            }
            await chokepoint.insertRoleGrant(ctx, {
                userId: args.userId,
                languageCode,
                role: "language_moderator",
                grantedBy: admin._id,
                status: "active",
                grantedAt: Date.now(),
            });
        }

        return { success: true, message: "Moderator approved" };
    },
});

// List pending moderator applications with requested languages and
// validation history, admin only.
export const listPendingModeratorApplications = query({
    args: {},
    handler: async (ctx) => {
        const admin = await getCurrentUser(ctx);
        if (!admin || !isAdmin(admin)) {
            throw new Error("Unauthorized: Only admins can view applications");
        }

        const allUsers = await ctx.db.query("users").take(1000);
        const pending = allUsers.filter(
            (u) => u.moderatorStatus?.isActive && !u.moderatorStatus?.approvedAt
        );

        const enriched = await Promise.all(
            pending.map(async (u) => {
                const stats = await ctx.db
                    .query("changaUserStats")
                    .withIndex("by_user", (q) => q.eq("userId", u._id))
                    .first();
                return {
                    id: u._id,
                    name: u.name,
                    avatar: u.avatar,
                    handle: u.handle,
                    appliedAt: u.moderatorStatus!.appliedAt,
                    requestedLanguages:
                        u.moderatorStatus!.requestedLanguages ?? [],
                    motivation: u.moderatorStatus!.motivation ?? "",
                    trustScore: stats?.trustScore ?? 0,
                    contributionCount: stats?.contributionCount ?? 0,
                    validationCount: stats?.validationCount ?? 0,
                };
            })
        );

        return enriched.sort((a, b) => b.appliedAt - a.appliedAt);
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
                avatar: m.avatar,
                role: m.role,
                approvedAt: m.moderatorStatus?.approvedAt,
            })),
            admins: admins.map(a => ({
                id: a._id,
                name: a.name,
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

        // Bound the scan — admin-only and low frequency, but unbounded
        // collects grow with the whole users table.
        const allUsers = await ctx.db.query("users")
            .take(1000);

        const pendingApplications = allUsers.filter(user =>
            user.moderatorStatus?.isActive &&
            !user.moderatorStatus?.approvedAt
        );

        return pendingApplications.map(user => ({
            id: user._id,
            name: user.name,
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
