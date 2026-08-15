import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, isModerator } from "../users/utils";
import {
    changaExampleTypeValidator,
    changaReleaseStatusValidator,
    changaSplitRecommendationValidator,
} from "./validators";
import type { Doc } from "../_generated/dataModel";

type SubmissionDoc = Doc<"changaSubmissions">;
type ExampleDoc = Doc<"changaCuratedExamples">;

export const listCuratedCandidates = query({
    args: {
        languageCode: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized: Only moderators and admins can view curation candidates");
        }

        // Use the status-only index when no language is given, then bound the
        // result with take() instead of collecting every validated submission.
        const limit = args.limit ?? 50;
        const submissions = await ctx.db.query("changaSubmissions")
            .withIndex(args.languageCode ? "by_language_status" : "by_status", (q) =>
                args.languageCode
                    ? q.eq("languageCode", args.languageCode).eq("status", "validated")
                    : q.eq("status", "validated")
            )
            .take(limit);

        return submissions;
    },
});

export const listDatasetReleaseCandidates = query({
    args: {
        languageCode: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized: Only moderators and admins can view dataset release candidates");
        }

        const examples = await ctx.db.query("changaCuratedExamples")
            .withIndex("by_releaseStatus_createdAt", (q) => q.eq("releaseStatus", "candidate"))
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

        const submission = await ctx.db.get(args.submissionId);
        if (!submission) {
            throw new Error("Submission not found");
        }

        if (submission.status !== "validated" && submission.status !== "curated") {
            throw new Error("Submission is not ready for curation");
        }

        // A curated candidate must link to its processing evidence.
        const processingRuns = await ctx.db.query("changaProcessingRuns")
            .withIndex("by_submission", (q) => q.eq("submissionId", args.submissionId))
            .collect();
        if (processingRuns.length === 0 || !processingRuns.some((run) => run.status === "completed")) {
            throw new Error("Submission has no completed processing evidence and cannot be curated");
        }

        const existingExample = await ctx.db.query("changaCuratedExamples")
            .withIndex("by_sourceSubmission", (q) => q.eq("sourceSubmissionId", args.submissionId))
            .first();
        if (existingExample) {
            return existingExample._id;
        }

        const assets = await ctx.db.query("changaSubmissionAssets")
            .withIndex("by_submission", (q) => q.eq("submissionId", args.submissionId))
            .collect();
        const audioAsset = assets.find(
            (asset) => asset.assetType === "audio",
        );

        const exampleId = await ctx.db.insert("changaCuratedExamples", {
            sourceSubmissionId: args.submissionId,
            exampleType: args.exampleType,
            languageCode: submission.languageCode,
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

        await ctx.db.patch(args.submissionId, {
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

        const example = await ctx.db.get(args.exampleId);
        if (!example) throw new Error("Curated example not found");
        if (args.releaseStatus === "exported" && !args.datasetReleaseId) {
            throw new Error("An exported example must belong to a dataset release");
        }
        if (args.datasetReleaseId) {
            const release = await ctx.db.get(args.datasetReleaseId);
            if (!release) throw new Error("Dataset release not found");
            if (args.releaseStatus === "exported" && example.datasetReleaseId !== args.datasetReleaseId) {
                await ctx.db.patch(args.datasetReleaseId, {
                    exampleCount: Math.max(0, release.exampleCount + 1),
                });
                if (example.datasetReleaseId) {
                    const previousRelease = await ctx.db.get(example.datasetReleaseId);
                    if (previousRelease) {
                        await ctx.db.patch(previousRelease._id, {
                            exampleCount: Math.max(0, previousRelease.exampleCount - 1),
                        });
                    }
                }
            }
        }
        await ctx.db.patch(args.exampleId, {
            releaseStatus: args.releaseStatus,
            datasetReleaseId: args.datasetReleaseId,
        });

        return args.exampleId;
    },
});

export const createDatasetRelease = mutation({
    args: {
        name: v.string(),
        version: v.string(),
        languageScope: v.optional(v.array(v.string())),
        criteria: v.optional(v.string()),
        releaseNotes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized: Only moderators and admins can create releases");
        }

        const existing = await ctx.db.query("changaDatasetReleases")
            .withIndex("by_version", (q) => q.eq("version", args.version.trim()))
            .first();
        if (existing) throw new Error("A dataset release with this version already exists");

        return ctx.db.insert("changaDatasetReleases", {
            name: args.name.trim().slice(0, 200),
            version: args.version.trim().slice(0, 100),
            languageScope: args.languageScope,
            criteria: args.criteria?.trim().slice(0, 4000),
            exampleCount: 0,
            releaseNotes: args.releaseNotes?.trim().slice(0, 4000),
            createdAt: Date.now(),
            createdBy: user._id,
        });
    },
});

export const retireCuratedExample = mutation({
    args: {
        exampleId: v.id("changaCuratedExamples"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized: Only moderators and admins can retire examples");
        }

        const example = await ctx.db.get(args.exampleId);
        if (!example) throw new Error("Curated example not found");
        await ctx.db.patch(args.exampleId, { releaseStatus: "retired" });
        return args.exampleId;
    },
});

export type SubmissionDocForCuration = SubmissionDoc;
export type CuratedExampleDoc = ExampleDoc;