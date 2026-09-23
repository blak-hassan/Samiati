import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, isAdmin, isModerator } from "../users/utils";
import { chokepoint } from "../lib/chokepoint";

export type BadgeId =
    | "first_contribution"
    | "ten_contributions"
    | "audio_contributor"
    | "rare_language_champion"
    | "streak_7"
    | "streak_30"
    | "validator"
    | "language_master";

export interface BadgeDef {
    id: BadgeId;
    title: string;
    description: string;
    icon: string; // material symbol name
    criterion: string;
}

export const BADGE_CATALOG: BadgeDef[] = [
    {
        id: "first_contribution",
        title: "First Step",
        description: "Submitted your first Changa contribution.",
        icon: "footprint",
        criterion: "contributionCount >= 1",
    },
    {
        id: "ten_contributions",
        title: "10 Contributions",
        description: "Contributed ten times to your language.",
        icon: "auto_awesome",
        criterion: "contributionCount >= 10",
    },
    {
        id: "audio_contributor",
        title: "Voice Carrier",
        description: "Recorded at least one audio reading.",
        icon: "mic",
        criterion: "any audio_reading submission",
    },
    {
        id: "rare_language_champion",
        title: "Rare Language Champion",
        description: "Contributed in a rare or endangered language.",
        icon: "language",
        criterion: "any submission with a rare language code",
    },
    {
        id: "streak_7",
        title: "Week-Long Streak",
        description: "Contributed seven days in a row.",
        icon: "local_fire_department",
        criterion: "streakDays >= 7",
    },
    {
        id: "streak_30",
        title: "30-Day Streak",
        description: "A whole month of daily contributions.",
        icon: "whatshot",
        criterion: "streakDays >= 30",
    },
    {
        id: "validator",
        title: "Validator",
        description: "Cast at least five validation votes.",
        icon: "fact_check",
        criterion: "validationCount >= 5",
    },
    {
        id: "language_master",
        title: "Language Master",
        description: "Reached the highest Changa level.",
        icon: "workspace_premium",
        criterion: "level >= 10",
    },
];

export const listBadges = query({
    args: {},
    handler: async () => BADGE_CATALOG,
});

// Award a badge to a user. Idempotent: re-granting is a no-op.
export const grantBadge = mutation({
    args: {
        userId: v.id("users"),
        badgeId: v.union(
            v.literal("first_contribution"),
            v.literal("ten_contributions"),
            v.literal("audio_contributor"),
            v.literal("rare_language_champion"),
            v.literal("streak_7"),
            v.literal("streak_30"),
            v.literal("validator"),
            v.literal("language_master"),
        ),
    },
    handler: async (ctx, args) => {
        // Anyone can self-grant via the contribution pipeline; admins
        // can grant any badge to anyone. We just enforce that the
        // self-grant is for the current user.
        const actor = await getCurrentUser(ctx);
        if (!actor) throw new Error("Unauthorized");
        if (args.userId !== actor._id && !isModerator(actor)) {
            throw new Error("You can only grant badges to yourself");
        }
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");
        const existing = user.badges ?? [];
        if (existing.includes(args.badgeId)) {
            return { granted: false, alreadyHad: true };
        }
        await ctx.db.patch(args.userId, { badges: [...existing, args.badgeId] });

        // Also mirror into changaUserStats.badges
        const stats = await ctx.db.query("changaUserStats")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();
        const statsBadges = stats?.badges ?? [];
        if (!statsBadges.includes(args.badgeId)) {
            await chokepoint.upsertUserStats(ctx, {
                userId: args.userId,
                patch: { badges: [...statsBadges, args.badgeId] },
            });
        }
        return { granted: true, badgeId: args.badgeId };
    },
});

// Award every badge the user currently qualifies for. Called from the
// contribution pipeline after awardContributionXP.
export const evaluateAndGrantBadges = mutation({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return { granted: [] as string[] };
        const stats = await ctx.db.query("changaUserStats")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();

        const have = new Set(user.badges ?? []);
        const granted: string[] = [];

        const tryGrant = async (id: BadgeDef["id"]) => {
            if (have.has(id)) return;
            have.add(id);
            granted.push(id);
        };

        const contributionCount = stats?.contributionCount ?? 0;
        if (contributionCount >= 1) await tryGrant("first_contribution");
        if (contributionCount >= 10) await tryGrant("ten_contributions");
        if ((user.level ?? 0) >= 10) await tryGrant("language_master");
        if ((stats?.streakDays ?? 0) >= 7) await tryGrant("streak_7");
        if ((stats?.streakDays ?? 0) >= 30) await tryGrant("streak_30");
        if ((stats?.validationCount ?? 0) >= 5) await tryGrant("validator");

        // Audio + rare language: scan recent submissions
        const recentSubs = await ctx.db.query("changaSubmissions")
            .withIndex("by_user_status", (q) => q.eq("userId", args.userId))
            .take(50);
        if (recentSubs.some((s) => s.submissionType === "audio_reading")) {
            await tryGrant("audio_contributor");
        }
        const RARE = ["Suba", "Ogiek", "Yaaku", "El Molo", "Omotik", "Dahalo", "Boni", "Elmolo", "Ongamo", "Sogoo", "Sanye", "Aasax"];
        if (recentSubs.some((s) => RARE.includes(s.languageCode))) {
            await tryGrant("rare_language_champion");
        }

        if (granted.length > 0) {
            await ctx.db.patch(args.userId, { badges: Array.from(have) });
            await chokepoint.upsertUserStats(ctx, {
                userId: args.userId,
                patch: { badges: Array.from(have) },
            });
        }
        return { granted };
    },
});
