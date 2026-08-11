import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, isModerator } from "../users/utils";
import { getLooseDb, LooseDoc } from "./db";

type SubmissionDoc = LooseDoc & {
    userId?: string;
    languageCode?: string;
    status?: string;
};

type VoteDoc = LooseDoc & {
    validatorId?: string;
    vote?: string;
};

type StatsDoc = LooseDoc & {
    userId?: string;
    trustScore?: number;
    streakDays?: number;
    lastActiveDate?: string;
    badges?: string[];
};

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

        const db = getLooseDb(ctx);

        // Use index to fetch submissions by user instead of full table scan
        const submissionsQuery = db.query("changaSubmissions")
            .withIndex("by_user_status", (q: any) => q.eq("userId", targetUserId));
        const submissions = (await submissionsQuery.collect()) as SubmissionDoc[];

        // Use index to fetch votes by validator
        const votesQuery = db.query("changaValidationVotes")
            .withIndex("by_validator", (q: any) => q.eq("validatorId", targetUserId));
        const votes = (await votesQuery.collect()) as VoteDoc[];

        // Use index to fetch user stats instead of full table scan
        const storedStats = (await db.query("changaUserStats")
            .withIndex("by_user", (q: any) => q.eq("userId", targetUserId))
            .first()) as StatsDoc | null;

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
                if (submission.languageCode) {
                    accumulator[submission.languageCode] = (accumulator[submission.languageCode] || 0) + 1;
                }
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
        const db = getLooseDb(ctx);

        // Use index for tasks by language + status
        const openTasksQuery = db.query("changaTasks")
            .withIndex("by_language_status", (q: any) =>
                q.eq("languageCode", args.languageCode).eq("status", "open")
            );
        const openTasks = await openTasksQuery.collect();

        // Use index for submissions by language (filter in-memory for now)
        const submissionsQuery = db.query("changaSubmissions")
            .withIndex("by_language_status", (q: any) => q.eq("languageCode", args.languageCode));
        const submissions = await submissionsQuery.collect();

        // Use index for curated examples by language
        const curatedExamples = await db.query("changaCuratedExamples")
            .withIndex("by_language_releaseStatus", (q: any) => q.eq("languageCode", args.languageCode))
            .collect();
        
        // Use index for campaigns by language + status
        const campaigns = await db.query("changaCampaigns")
            .withIndex("by_language_status", (q: any) => q.eq("languageCode", args.languageCode).eq("status", "active"))
            .collect();

        return {
            languageCode: args.languageCode,
            openTasks: openTasks.length,
            submissions: submissions.length,
            curatedExamples: curatedExamples.length,
            activeCampaigns: campaigns.length,
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

        const db = getLooseDb(ctx);

        // Use index to fetch submissions by user
        const submissionsQuery = db.query("changaSubmissions")
            .withIndex("by_user_status", (q: any) => q.eq("userId", args.userId));
        const submissions = (await submissionsQuery.collect()) as SubmissionDoc[];

        // Use index to fetch votes by validator
        const votesQuery = db.query("changaValidationVotes")
            .withIndex("by_validator", (q: any) => q.eq("validatorId", args.userId));
        const votes = (await votesQuery.collect()) as VoteDoc[];

        // Use index for user stats instead of full table scan
        const existingStats = (await db.query("changaUserStats")
            .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
            .first()) as StatsDoc | null;

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
            await db.patch(existingStats._id, {
                contributionCount: submissions.length,
                validationCount,
                acceptRate,
                reviewAgreementRate,
                trustScore,
                lastActiveDate: new Date().toISOString(),
            });
            return existingStats._id;
        }

        return db.insert("changaUserStats", {
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
