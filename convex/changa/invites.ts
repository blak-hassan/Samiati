import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";

// Generate a unique invite code for a user.
export const generateInviteCode = mutation({
    args: {
        channel: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Generate a short code from user ID + timestamp
        const code = `changa_${user._id.slice(-6)}_${Date.now().toString(36)}`;

        await ctx.db.insert("changaInvites", {
            inviterUserId: user._id,
            inviteCode: code,
            channel: args.channel,
            createdAt: Date.now(),
        });

        return code;
    },
});

// Record when someone clicks an invite link.
export const recordInviteClick = mutation({
    args: {
        inviteCode: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        const invite = await ctx.db
            .query("changaInvites")
            .withIndex("by_code", (q) => q.eq("inviteCode", args.inviteCode))
            .first();

        if (!invite) return null;

        await ctx.db.patch(invite._id, {
            clickedAt: Date.now(),
            clickedByUserId: user?._id,
        });

        return invite.inviterUserId;
    },
});

// Record when an invited user makes their first contribution.
export const recordInviteConversion = mutation({
    args: {
        inviteCode: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return;

        const invite = await ctx.db
            .query("changaInvites")
            .withIndex("by_code", (q) => q.eq("inviteCode", args.inviteCode))
            .first();

        if (!invite || invite.firstContributionAt) return;

        await ctx.db.patch(invite._id, {
            firstContributionAt: Date.now(),
        });
    },
});

// Get invite stats for a user.
export const getInviteStats = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return null;

        const invites = await ctx.db
            .query("changaInvites")
            .withIndex("by_inviter", (q) => q.eq("inviterUserId", user._id))
            .collect();

        const totalInvites = invites.length;
        const clickedInvites = invites.filter((i) => i.clickedAt).length;
        const convertedInvites = invites.filter((i) => i.firstContributionAt).length;

        return {
            totalInvites,
            clickedInvites,
            convertedInvites,
            conversionRate: totalInvites > 0
                ? Math.round((convertedInvites / totalInvites) * 100)
                : 0,
        };
    },
});

// Get a user's active invite code (most recent).
export const getMyInviteCode = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return null;

        const invite = await ctx.db
            .query("changaInvites")
            .withIndex("by_inviter", (q) => q.eq("inviterUserId", user._id))
            .order("desc")
            .first();

        return invite?.inviteCode ?? null;
    },
});
