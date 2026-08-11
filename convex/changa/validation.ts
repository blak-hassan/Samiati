import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, isModerator } from "../users/utils";
import { getLooseDb, LooseDoc } from "./db";
import {
    changaAssignmentStatusValidator,
    changaValidatorRoleValidator,
    changaValidationVoteValidator,
} from "./validators";

type SubmissionDoc = LooseDoc & {
    userId?: string;
    status?: string;
    languageCode?: string;
};

type VoteDoc = LooseDoc & {
    submissionId?: string;
    validatorId?: string;
    vote?: string;
};

const rejectVotes = new Set(["reject", "duplicate", "unsafe", "unclear_audio", "wrong_language"]);

export const listValidationQueue = query({
    args: {
        languageCode: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) {
            return [];
        }

        const db = getLooseDb(ctx);

        // Use indexed queries for submissions by status
        const [submittedSubmissions, validationSubmissions] = await Promise.all([
            db.query("changaSubmissions")
                .withIndex("by_language_status", (q: any) => 
                    args.languageCode 
                        ? q.eq("languageCode", args.languageCode).eq("status", "submitted")
                        : q.eq("status", "submitted")
                )
                .collect(),
            db.query("changaSubmissions")
                .withIndex("by_language_status", (q: any) => 
                    args.languageCode 
                        ? q.eq("languageCode", args.languageCode).eq("status", "in_validation")
                        : q.eq("status", "in_validation")
                )
                .collect(),
        ]);
        const allSubmissions = [...submittedSubmissions, ...validationSubmissions] as SubmissionDoc[];

        // For votes, we'll fetch per-submission only for the displayed results
        // (after filtering and limiting to avoid fetching all votes)

        // Filter submissions first
        const filteredSubmissions = allSubmissions
            .filter((submission) => submission.userId !== user._id);

        // Then fetch votes only for the limited set of submissions
        const limitedSubmissions = filteredSubmissions.slice(0, args.limit ?? 25);

        const submissionsWithVotes = await Promise.all(
            limitedSubmissions.map(async (submission) => {
                const submissionVotes = await db.query("changaValidationVotes")
                    .withIndex("by_submission", (q: any) => q.eq("submissionId", submission._id))
                    .collect() as VoteDoc[];
                return {
                    ...submission,
                    voteCount: submissionVotes.length,
                    acceptCount: submissionVotes.filter((vote) => vote.vote === "accept").length,
                    rejectCount: submissionVotes.filter((vote) => rejectVotes.has(vote.vote || "")).length,
                };
            })
        );

        return submissionsWithVotes
            .sort((left, right) => right.voteCount - left.voteCount);
    },
});

export const getValidationBundle = query({
    args: {
        submissionId: v.id("changaSubmissions"),
    },
    handler: async (ctx, args) => {
        const db = getLooseDb(ctx);
        const submission = await db.get(args.submissionId);
        if (!submission) {
            return null;
        }

        // Use index for assets by submission
        const assetsQuery = db.query("changaSubmissionAssets")
            .withIndex("by_submission", (q: any) => q.eq("submissionId", args.submissionId));
        const assets = await assetsQuery.collect();

        // Use index for votes by submission
        const votesQuery = db.query("changaValidationVotes")
            .withIndex("by_submission", (q: any) => q.eq("submissionId", args.submissionId));
        const votes = await votesQuery.collect();

        return {
            ...submission,
            assets,
            votes,
        };
    },
});

export const submitValidationVote = mutation({
    args: {
        submissionId: v.id("changaSubmissions"),
        validatorRole: v.optional(changaValidatorRoleValidator),
        vote: changaValidationVoteValidator,
        confidence: v.optional(v.number()),
        issueCodes: v.optional(v.array(v.string())),
        comment: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) {
            throw new Error("Unauthorized");
        }

        const db = getLooseDb(ctx);
        const submission = (await db.get(args.submissionId)) as SubmissionDoc | null;
        if (!submission) {
            throw new Error("Submission not found");
        }

        if (submission.userId === user._id) {
            throw new Error("Cannot validate your own submission");
        }

        // Use index to find existing vote by this user for this submission
        const existingVotesQuery = db.query("changaValidationVotes")
            .withIndex("by_submission", (q: any) => q.eq("submissionId", args.submissionId));
        const existingVotes = (await existingVotesQuery.collect()) as VoteDoc[];
        const existingVote = existingVotes.find(
            (vote) => vote.validatorId === user._id,
        );

        if (existingVote) {
            await db.patch(existingVote._id, {
                validatorRole: args.validatorRole ?? "peer",
                vote: args.vote,
                confidence: args.confidence,
                issueCodes: args.issueCodes,
                comment: args.comment,
                trustSnapshot: user.level ?? 0,
                createdAt: Date.now(),
            });
        } else {
            await db.insert("changaValidationVotes", {
                submissionId: args.submissionId,
                validatorId: user._id,
                validatorRole: args.validatorRole ?? "peer",
                vote: args.vote,
                confidence: args.confidence,
                issueCodes: args.issueCodes,
                comment: args.comment,
                trustSnapshot: user.level ?? 0,
                createdAt: Date.now(),
            });
        }

        // Re-fetch votes for this submission using index
        const updatedVotesQuery = db.query("changaValidationVotes")
            .withIndex("by_submission", (q: any) => q.eq("submissionId", args.submissionId));
        const updatedVotes = (await updatedVotesQuery.collect()) as VoteDoc[];
        const acceptCount = updatedVotes.filter((vote) => vote.vote === "accept").length;
        const rejectCount = updatedVotes.filter((vote) => rejectVotes.has(vote.vote || "")).length;

        let nextStatus = "in_validation";
        if (acceptCount >= 2 && rejectCount === 0) {
            nextStatus = "validated";
        } else if (rejectCount >= 2) {
            nextStatus = "rejected";
        }

        await db.patch(args.submissionId, {
            status: nextStatus,
            updatedAt: Date.now(),
        });

        return {
            submissionId: args.submissionId,
            status: nextStatus,
            acceptCount,
            rejectCount,
        };
    },
});

export const assignModeratorReview = mutation({
    args: {
        submissionId: v.id("changaSubmissions"),
        assignedTo: v.optional(v.id("users")),
        roleRequired: v.optional(changaValidatorRoleValidator),
        status: v.optional(changaAssignmentStatusValidator),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized");
        }

        const db = getLooseDb(ctx);
        return db.insert("changaValidationAssignments", {
            submissionId: args.submissionId,
            assignedTo: args.assignedTo,
            roleRequired: args.roleRequired ?? "moderator",
            status: args.status ?? "assigned",
            assignedAt: Date.now(),
        });
    },
});
