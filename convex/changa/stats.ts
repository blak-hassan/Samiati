import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, isModerator } from "../users/utils";
import type { Doc } from "../_generated/dataModel";

type StatsDoc = Doc<"changaUserStats">;

function buildTrustScore(params: {
    contributionCount: number;
    validationCount: number;
    acceptRate: number;
    reviewAgreementRate: number;
}) {
    const trustScore =
        params.contributionCount * 2 +
        params.validationCount * 3 +
        params.acceptRate * 40 +
        params.reviewAgreementRate * 30;

    return Math.round(trustScore);
}

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
            .collect();

        const votes = await ctx.db.query("changaValidationVotes")
            .withIndex("by_validator", (q) => q.eq("validatorId", targetUserId))
            .collect();

        const storedStats = await ctx.db.query("changaUserStats")
            .withIndex("by_user", (q) => q.eq("userId", targetUserId))
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
        const topLanguages = Object.entries(
            submissions.reduce<Record<string, number>>((accumulator, submission) => {
                accumulator[submission.languageCode] = (accumulator[submission.languageCode] || 0) + 1;
                return accumulator;
            }, {}),
        )
            .sort((left, right) => right[1] - left[1])
            .slice(0, 5)
            .map(([languageCode]) => languageCode);

        const persisted = storedStats;

        return {
            userId: targetUserId,
            contributionCount: submissions.length,
            validationCount,
            acceptRate,
            reviewAgreementRate,
            trustScore: persisted?.trustScore ?? buildTrustScore({
                contributionCount: submissions.length,
                validationCount,
                acceptRate,
                reviewAgreementRate,
            }),
            streakDays: persisted?.streakDays ?? 0,
            lastActiveDate: persisted?.lastActiveDate ?? null,
            topLanguages,
            badges: persisted?.badges ?? [],
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
            .collect();

        const votes = await ctx.db.query("changaValidationVotes")
            .withIndex("by_validator", (q) => q.eq("validatorId", args.userId))
            .collect();

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

        if (existingStats) {
            await ctx.db.patch(existingStats._id, {
                contributionCount: submissions.length,
                validationCount,
                acceptRate,
                reviewAgreementRate,
                trustScore,
                lastActiveDate: new Date().toISOString(),
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
            streakDays: 0,
            lastActiveDate: new Date().toISOString(),
            topLanguages: [],
            badges: [],
        });
    },
});

export type UserStatsForDisplay = StatsDoc;