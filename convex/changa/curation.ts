import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, isModerator } from "../users/utils";
import { getLooseDb, LooseDoc } from "./db";
import {
    changaExampleTypeValidator,
    changaReleaseStatusValidator,
    changaSplitRecommendationValidator,
} from "./validators";

type SubmissionDoc = LooseDoc & {
    languageCode?: string;
    dialectCode?: string;
    regionCode?: string;
    sourceText?: string;
    targetText?: string;
    transcriptText?: string;
    contextNote?: string;
    status?: string;
};

export const listCuratedCandidates = query({
    args: {
        languageCode: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const db = getLooseDb(ctx);

        // Use indexed query - filter by language if provided, then status in memory
        const submissionsQuery = db.query("changaSubmissions")
            .withIndex("by_language_status", (q: any) =>
                args.languageCode
                    ? q.eq("languageCode", args.languageCode).eq("status", "validated")
                    : q.eq("status", "validated")
            );

        const submissions = (await submissionsQuery.collect()) as SubmissionDoc[];

        return submissions.slice(0, args.limit ?? 50);
    },
});

export const listDatasetReleaseCandidates = query({
    args: {
        languageCode: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const db = getLooseDb(ctx);
        
        // Use indexed query for curated examples by release status
        const examples = await db.query("changaCuratedExamples")
            .withIndex("by_releaseStatus_createdAt", (q: any) => q.eq("releaseStatus", "candidate"))
            .collect();

        return examples
            .filter((example) => !args.languageCode || example.languageCode === args.languageCode)
            .slice(0, args.limit ?? 50);
    },
});

export const promoteSubmissionToCuratedExample = mutation({
    args: {
        submissionId: v.id("changaSubmissions"),
        exampleType: changaExampleTypeValidator,
        splitRecommendation: v.optional(changaSplitRecommendationValidator),
        qualityScore: v.optional(v.number()),
        reviewSummary: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized: Only moderators and admins can promote submissions");
        }

        const db = getLooseDb(ctx);
        const submission = (await db.get(args.submissionId)) as SubmissionDoc | null;
        if (!submission) {
            throw new Error("Submission not found");
        }

        if (submission.status !== "validated" && submission.status !== "curated") {
            throw new Error("Submission is not ready for curation");
        }

        const assetsQuery = db.query("changaSubmissionAssets")
            .withIndex("by_submission", (q: any) => q.eq("submissionId", args.submissionId));
        const assets = await assetsQuery.collect();
        const audioAsset = assets.find(
            (asset) => asset.assetType === "audio",
        );

        const exampleId = await db.insert("changaCuratedExamples", {
            sourceSubmissionId: args.submissionId,
            exampleType: args.exampleType,
            languageCode: submission.languageCode || "",
            dialectCode: submission.dialectCode,
            regionCode: submission.regionCode,
            sourceText: submission.sourceText,
            targetText: submission.targetText,
            transcriptText: submission.transcriptText,
            contextText: submission.contextNote,
            audioAssetId: audioAsset?._id,
            qualityScore: args.qualityScore,
            reviewSummary: args.reviewSummary?.slice(0, 2000),
            splitRecommendation: args.splitRecommendation,
            releaseStatus: "candidate",
            createdAt: Date.now(),
        });

        await db.patch(args.submissionId, {
            status: "curated",
            curatedExampleId: exampleId,
            updatedAt: Date.now(),
        });

        return exampleId;
    },
});

export const approveCuratedExample = mutation({
    args: {
        exampleId: v.id("changaCuratedExamples"),
        releaseStatus: changaReleaseStatusValidator,
        datasetReleaseId: v.optional(v.id("changaDatasetReleases")),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized: Only moderators and admins can approve curated examples");
        }

        const db = getLooseDb(ctx);
        await db.patch(args.exampleId, {
            releaseStatus: args.releaseStatus,
            datasetReleaseId: args.datasetReleaseId,
        });

        return args.exampleId;
    },
});
