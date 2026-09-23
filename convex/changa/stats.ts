import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, isModerator } from "../users/utils";
import { internal } from "../_generated/api";
import { chokepoint } from "../lib/chokepoint";
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

// Public platform-level stats for the landing page trust strip.
// Cheap where an index exists (active campaigns); otherwise capped full-scans
// that gracefully degrade to "N+" style numbers when the cap is hit.
export const getPlatformStats = query({
    args: {},
    handler: async (ctx) => {
        // Active campaigns — index-backed (by_status).
        const activeCampaigns = (await ctx.db.query("changaCampaigns")
            .withIndex("by_status", (q) => q.eq("status", "active"))
            .take(1000)).length;

        // Total contributions (changaSubmissions). No language-agnostic index;
        // take a large cap and report "N+" when we hit it.
        const submissions = await ctx.db.query("changaSubmissions")
            .withIndex("by_status", (q) => q.eq("status", "submitted"))
            .take(10000)
            .collect();
        const totalContributions = submissions.length;

        // Curated examples (words preserved). Full scan with a large cap.
        const curatedExamples = await ctx.db.query("changaCuratedExamples")
            .withIndex("by_releaseStatus_createdAt", (q) => q.eq("releaseStatus", "published"))
            .take(10000)
            .collect();
        const wordsPreserved = curatedExamples.length;

        // Distinct languages represented in submissions. Collect all languageCodes
        // up to a cap and dedupe. This is a best-effort count for the landing page.
        const submissionDocs = await ctx.db.query("changaSubmissions")
            .withIndex("by_status", (q) => q.eq("status", "submitted"))
            .take(20000)
            .collect();
        const distinctLanguages = new Set<string>();
        for (const doc of submissionDocs) {
            if (doc.languageCode) {
                distinctLanguages.add(doc.languageCode);
            }
        }
        // If we hit the cap, treat the count as a floor — label it "N+" in the UI.
        const languagesCount = distinctLanguages.size;
        const languagesCountIsApprox = submissionDocs.length >= 20000;

        return {
            totalContributions,
            wordsPreserved,
            activeCampaigns,
            distinctLanguages: languagesCount,
            languagesCountIsApprox,
            updatedAt: Date.now(),
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
            await chokepoint.upsertUserStats(ctx, {
                userId: args.userId,
                patch: {
                    contributionCount: submissions.length,
                    validationCount,
                    acceptRate,
                    reviewAgreementRate,
                    trustScore,
                    lastActiveDate: new Date().toISOString(),
                },
            });
            return existingStats._id;
        }

        return chokepoint.upsertUserStats(ctx, {
            userId: args.userId,
            doc: {
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
            },
        });
    },
});

export type UserStatsForDisplay = StatsDoc;