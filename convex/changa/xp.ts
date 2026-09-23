import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";
import { chokepoint } from "../lib/chokepoint";
import type { Id } from "../_generated/dataModel";

// Mirrors LEVEL_THRESHOLDS from src/services/xpService.ts. Kept in sync
// at runtime; if xpService changes, update this list too.
const LEVEL_THRESHOLDS_LOCAL = [
    0, 17, 67, 150, 283, 483, 750, 1083, 1583, 2416,
];

const RARE_LANGUAGES_LOCAL = [
    "Suba", "Ogiek", "Yaaku", "El Molo", "Omotik", "Dahalo",
    "Boni", "Elmolo", "Ongamo", "Sogoo", "Sanye", "Aasax",
];

const XP_VALUES_LOCAL: Record<string, number> = {
    Word: 5,
    Phrase: 8,
    "Translate Paragraphs": 17,
    Proverb: 13,
    Story: 25,
    Song: 20,
    Riddle: 10,
    History: 27,
    Custom: 10,
};
const AUDIO_BONUS_LOCAL = 7;
const STREAK_BONUSES_LOCAL: Record<number, number> = {
    3: 3,
    7: 8,
    14: 17,
    30: 33,
    100: 167,
};

function calculateXPLocal(taskType: string, hasAudio: boolean, languageCode?: string): number {
    let xp = XP_VALUES_LOCAL[taskType] ?? XP_VALUES_LOCAL.Custom;
    if (hasAudio) xp += AUDIO_BONUS_LOCAL;
    if (languageCode && RARE_LANGUAGES_LOCAL.some((l) => l.toLowerCase() === languageCode.toLowerCase())) {
        xp = Math.round(xp * 1.5);
    }
    return xp;
}

function levelFromXP(xp: number): number {
    for (let i = LEVEL_THRESHOLDS_LOCAL.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_THRESHOLDS_LOCAL[i]) return i + 1;
    }
    return 1;
}

function streakBonusFor(streakDays: number): number {
    let bonus = 0;
    for (const [thresholdStr, xp] of Object.entries(STREAK_BONUSES_LOCAL)) {
        if (streakDays === Number(thresholdStr)) bonus += xp;
    }
    return bonus;
}

function isRareLanguage(code?: string): boolean {
    if (!code) return false;
    return RARE_LANGUAGES_LOCAL.some((l) => l.toLowerCase() === code.toLowerCase());
}

// Award XP for a submitted changa submission. Called from the
// TaskContributionScreen submit handler. Persists to both
// changaUserStats (canonical) and the legacy users.xp/level mirror.
export const awardContributionXP = mutation({
    args: {
        submissionId: v.id("changaSubmissions"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const submission = await ctx.db.get(args.submissionId);
        if (!submission) throw new Error("Submission not found");
        if (submission.userId !== user._id) {
            throw new Error("You can only award XP for your own submissions");
        }
        if ((submission as { xpAwarded?: boolean }).xpAwarded) {
            // Idempotent: never double-award.
            return { xpAwarded: 0, newLevel: user.level ?? 1, newXP: user.xp ?? 0, alreadyAwarded: true };
        }

        // Pull current stats
        const stats = await ctx.db.query("changaUserStats")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .first();

        const previousXP = user.xp ?? 0;
        const hasAudio = submission.submissionType === "audio_reading";
        const baseXP = calculateXPLocal(
            String(submission.submissionType || "Custom"),
            hasAudio,
            submission.languageCode
        );

        const streakDays = stats?.streakDays ?? 1;
        const streakBonus = streakBonusFor(streakDays);
        const rareBonus = isRareLanguage(submission.languageCode) ? Math.round(baseXP * 0.5) : 0;

        const totalXP = baseXP + streakBonus + rareBonus;
        const newXP = previousXP + totalXP;
        const newLevel = levelFromXP(newXP);

        // Update changaUserStats
        const today = new Date().toISOString().slice(0, 10);
        const lastActive = stats?.lastActiveDate;
        let newStreak = 1;
        if (lastActive) {
            const diffDays = Math.round(
                (Date.parse(today) - Date.parse(lastActive)) / (24 * 60 * 60 * 1000)
            );
            newStreak = diffDays === 0 ? Math.max(1, streakDays) : diffDays === 1 ? streakDays + 1 : 1;
        }

        await chokepoint.upsertUserStats(ctx, {
            userId: user._id,
            patch: {
                contributionCount: (stats?.contributionCount ?? 0) + 1,
                trustScore: Math.min(1, (stats?.trustScore ?? 0.5) + 0.01),
                streakDays: newStreak,
                lastActiveDate: today,
            },
        });

        // Mirror to legacy users.xp/level
        await ctx.db.patch(user._id, {
            xp: newXP,
            level: newLevel,
        });

        // Mark the submission so we don't double-award
        await ctx.db.patch(args.submissionId, {
            xpAwarded: true,
            xpAwardedAmount: totalXP,
        } as never);

        const leveledUp = newLevel > levelFromXP(previousXP);
        return { xpAwarded: totalXP, newLevel, newXP, leveledUp };
    },
});

// Award XP for casting a validation vote. Small fixed bonus.
export const awardValidationXP = mutation({
    args: {
        voteId: v.id("changaValidationVotes"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const vote = await ctx.db.get(args.voteId);
        if (!vote) throw new Error("Vote not found");
        if (vote.validatorId !== user._id) {
            throw new Error("You can only award XP for your own votes");
        }
        if ((vote as { xpAwarded?: boolean }).xpAwarded) {
            return { xpAwarded: 0, newXP: user.xp ?? 0 };
        }

        const previousXP = user.xp ?? 0;
        const bonus = 2; // small fixed reward
        const newXP = previousXP + bonus;
        const newLevel = levelFromXP(newXP);

        await ctx.db.patch(user._id, { xp: newXP, level: newLevel });
        await ctx.db.patch(args.voteId, { xpAwarded: true } as never);

        return { xpAwarded: bonus, newXP };
    },
});

// Get the current user's full XP/level/streak snapshot.
export const getMyXPProfile = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return null;
        const stats = await ctx.db.query("changaUserStats")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .first();
        const xp = user.xp ?? 0;
        const level = user.level ?? 1;
        const nextThreshold = LEVEL_THRESHOLDS_LOCAL[Math.min(level, LEVEL_THRESHOLDS_LOCAL.length - 1)];
        const prevThreshold = LEVEL_THRESHOLDS_LOCAL[Math.max(0, level - 1)];
        const progress = level >= LEVEL_THRESHOLDS_LOCAL.length
            ? 100
            : Math.round(((xp - prevThreshold) / (nextThreshold - prevThreshold)) * 100);
        return {
            xp,
            level,
            progress,
            nextLevelXP: nextThreshold,
            streakDays: stats?.streakDays ?? 0,
            trustScore: stats?.trustScore ?? 0,
            contributionCount: stats?.contributionCount ?? 0,
            badges: user.badges ?? stats?.badges ?? [],
        };
    },
});
