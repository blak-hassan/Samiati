import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, isModerator } from "../users/utils";
import type { Doc } from "../_generated/dataModel";
import {
    buildTrustScore,
    computeStreakDays,
    MAX_STATS_RECORDS,
} from "./statsUtils";

type StatsDoc = Doc<"changaUserStats">;

export const getUserContributionStats = query({
    args: {
        userId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUser(ctx);
        const targetUserId = args.userId ?? currentUser?._id;
        if (!targetUserId) {
            return null;
        }

        const submissions = await ctx.db.query("changaSubmissions")
            .withIndex("by_user_status", (q) => q.eq("userId", targetUserId))
            .take(MAX_STATS_RECORDS);

        const votes = await ctx.db.query("changaValidationVotes")
            .withIndex("by_validator", (q) => q.eq("validatorId", targetUserId))
            .take(MAX_STATS_RECORDS);

        const storedStats = await ctx.db.query("changaUserStats")
            .withIndex("by_user", (q) => q.eq("userId", targetUserId))
            .first();

        const now = Date.now();
        const reviewedCount = submissions.filter(
            (submission) => submission.status === "validated" || submission.status === "rejected" || submission.status === "curated",
        ).length;
        const acceptedCount = submissions.filter(
            (submission) => submission.status === "validated" || submission.status === "curated",
        ).length;
        const validationCount = votes.length;
        const acceptRate = reviewedCount > 0 ? acceptedCount / reviewedCount : 0;
        const reviewAgreementRate = validationCount > 0
            ? votes.filter((vote) => vote.vote === "accept").length / validationCount
            : 0;
        const topLanguages = Object.entries(
            submissions.reduce<Record<string, number>>((accumulator, submission) => {
                accumulator[submission.languageCode] = (accumulator[submission.languageCode] || 0) + 1;
                return accumulator;
            }, {}),
        )
            .sort((left, right) => right[1] - left[1])
            .slice(0, 5)
            .map(([languageCode]) => languageCode);

        // Trust score and streak are derived from the live records so the
        // dashboard can never show a stale cached value. `changaUserStats`
        // keeps a persisted copy for leaderboards and exports.
        const activityTimestamps = submissions
            .map((submission) => submission.submittedAt ?? submission.updatedAt)
            .filter((timestamp): timestamp is number => typeof timestamp === "number");
        const lastActiveAt = activityTimestamps.length > 0 ? Math.max(...activityTimestamps) : null;

        return {
            userId: targetUserId,
            contributionCount: submissions.length,
            acceptedCount,
            validationCount,
            acceptRate,
            reviewAgreementRate,
            trustScore: buildTrustScore({
                contributionCount: submissions.length,
                validationCount,
                acceptRate,
                reviewAgreementRate,
            }),
            streakDays: computeStreakDays(activityTimestamps, now),
            lastActiveAt,
            lastActiveDate: lastActiveAt !== null
                ? new Date(lastActiveAt).toISOString()
                : (storedStats?.lastActiveDate ?? null),
            topLanguages,
            badges: storedStats?.badges ?? [],
        };
    },
});

export const getLanguageProgressStats = query({
    args: {
        languageCode: v.string(),
    },
    handler: async (ctx, args) => {
        const openTasks = (await ctx.db.query("changaTasks")
            .withIndex("by_language_status", (q) =>
                q.eq("languageCode", args.languageCode).eq("status", "open")
            )
            .take(1000)).length;

        const submissionsCount = (await ctx.db.query("changaSubmissions")
            .withIndex("by_language_status", (q) => q.eq("languageCode", args.languageCode))
            .take(1000)).length;

        const curatedExamplesCount = (await ctx.db.query("changaCuratedExamples")
            .withIndex("by_language_releaseStatus", (q) => q.eq("languageCode", args.languageCode))
            .take(1000)).length;

        const activeCampaignsCount = (await ctx.db.query("changaCampaigns")
            .withIndex("by_language_status", (q) => q.eq("languageCode", args.languageCode).eq("status", "active"))
            .take(1000)).length;

        return {
            languageCode: args.languageCode,
            openTasks,
            submissions: submissionsCount,
            curatedExamples: curatedExamplesCount,
            activeCampaigns: activeCampaignsCount,
        };
    },
});

export const recomputeTrustScore = mutation({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUser(ctx);
        if (!currentUser || (!isModerator(currentUser) && currentUser._id !== args.userId)) {
            throw new Error("Unauthorized");
        }

        const submissions = await ctx.db.query("changaSubmissions")
            .withIndex("by_user_status", (q) => q.eq("userId", args.userId))
            .take(MAX_STATS_RECORDS);

        const votes = await ctx.db.query("changaValidationVotes")
            .withIndex("by_validator", (q) => q.eq("validatorId", args.userId))
            .take(MAX_STATS_RECORDS);

        const existingStats = await ctx.db.query("changaUserStats")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();

        const reviewedCount = submissions.filter(
            (submission) => submission.status === "validated" || submission.status === "rejected" || submission.status === "curated",
        ).length;
        const acceptedCount = submissions.filter(
            (submission) => submission.status === "validated" || submission.status === "curated",
        ).length;
        const validationCount = votes.length;
        const acceptRate = reviewedCount > 0 ? acceptedCount / reviewedCount : 0;
        const reviewAgreementRate = validationCount > 0
            ? votes.filter((vote) => vote.vote === "accept").length / validationCount
            : 0;
        const trustScore = buildTrustScore({
            contributionCount: submissions.length,
            validationCount,
            acceptRate,
            reviewAgreementRate,
        });

        const activityTimestamps = submissions
            .map((submission) => submission.submittedAt ?? submission.updatedAt)
            .filter((timestamp): timestamp is number => typeof timestamp === "number");
        const streakDays = computeStreakDays(activityTimestamps, Date.now());
        const lastActiveAt = activityTimestamps.length > 0 ? Math.max(...activityTimestamps) : null;
        const lastActiveDate = lastActiveAt !== null ? new Date(lastActiveAt).toISOString() : null;
        const topLanguages = Object.entries(
            submissions.reduce<Record<string, number>>((accumulator, submission) => {
                accumulator[submission.languageCode] = (accumulator[submission.languageCode] || 0) + 1;
                return accumulator;
            }, {}),
        )
            .sort((left, right) => right[1] - left[1])
            .slice(0, 5)
            .map(([languageCode]) => languageCode);

        if (existingStats) {
            await ctx.db.patch(existingStats._id, {
                contributionCount: submissions.length,
                validationCount,
                acceptRate,
                reviewAgreementRate,
                trustScore,
                streakDays,
                topLanguages,
                ...(lastActiveDate ? { lastActiveDate } : {}),
            });
            return existingStats._id;
        }

        return ctx.db.insert("changaUserStats", {
            userId: args.userId,
            contributionCount: submissions.length,
            validationCount,
            acceptRate,
            reviewAgreementRate,
            trustScore,
            streakDays,
            lastActiveDate: lastActiveDate ?? undefined,
            topLanguages,
            badges: [],
        });
    },
});

export type UserStatsForDisplay = StatsDoc;