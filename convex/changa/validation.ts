import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, isModerator } from "../users/utils";
import { recordValidationStats } from "./reputation";
import {
    changaAssignmentStatusValidator,
    changaValidatorRoleValidator,
    changaValidationVoteValidator,
} from "./validators";
import type { Doc, Id } from "../_generated/dataModel";

const rejectVotes = new Set(["reject", "duplicate", "unsafe", "unclear_audio", "wrong_language"]);
const DECISION_EVIDENCE_VERSION = "votes-v1";

type SubmissionDoc = Doc<"changaSubmissions">;

function roleRank(role: string | undefined): number {
    const ranks: Record<string, number> = {
        new_contributor: 1,
        contributor: 2,
        trusted_contributor: 3,
        community_reviewer: 4,
        language_moderator: 5,
        verified_expert: 6,
    };
    return ranks[role || ""] ?? 0;
}

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

        // Peer lane: submissions in review, excluding the user's own work and
        // items they already voted on.
        const allSubmissions = await ctx.db.query("changaSubmissions")
            .withIndex(args.languageCode ? "by_language_status" : "by_status", (q) =>
                args.languageCode
                    ? q.eq("languageCode", args.languageCode).eq("status", "in_validation")
                    : q.eq("status", "in_validation"),
            )
            .collect();

        // Moderator lane: explicitly assigned moderation work from
        // changaValidationAssignments (escalations, disagreements). Bound the
        // scan — the assignment table is low-volume during the pilot.
        const moderatorAssignmentIds = new Set<Id<"changaSubmissions">>();
        if (isModerator(user)) {
            const openAssignments = await ctx.db.query("changaValidationAssignments")
                .filter((q) => q.eq(q.field("status"), "open"))
                .take(100);
            moderatorAssignmentIds.clear();
            for (const assignment of openAssignments) {
                if (!assignment.assignedTo || assignment.assignedTo === user._id) {
                    moderatorAssignmentIds.add(assignment.submissionId);
                }
            }
        }

        const candidates = allSubmissions
            .filter((submission) => submission.userId !== user._id)
            .concat(
                moderatorAssignmentIds.size > 0
                    ? (await Promise.all([...moderatorAssignmentIds].map((id) => ctx.db.get(id))))
                        .filter((submission): submission is SubmissionDoc => submission !== null)
                    : [],
            )
            // De-duplicate and remove items the user already reviewed.
            .filter((submission, index, array) =>
                array.findIndex((candidate) => candidate._id === submission._id) === index,
            )
            .slice(0, (args.limit ?? 25) * 3);

        const submissionsWithVotes = await Promise.all(
            candidates.map(async (submission) => {
                const submissionVotes = await ctx.db.query("changaValidationVotes")
                    .withIndex("by_submission", (q) => q.eq("submissionId", submission._id))
                    .collect();
                return {
                    ...submission,
                    voteCount: submissionVotes.length,
                    acceptCount: submissionVotes.filter((vote) => vote.vote === "accept").length,
                    rejectCount: submissionVotes.filter((vote) => rejectVotes.has(vote.vote)).length,
                    hasCurrentUserVote: submissionVotes.some((vote) => vote.validatorId === user._id),
                    requiresModerator: moderatorAssignmentIds.has(submission._id),
                };
            }),
        );

        return submissionsWithVotes
            .filter((submission) => !submission.hasCurrentUserVote)
            .sort((left, right) => {
                // Moderator-required items first, then by vote count.
                if (left.requiresModerator !== right.requiresModerator) {
                    return left.requiresModerator ? -1 : 1;
                }
                return right.voteCount - left.voteCount;
            })
            .slice(0, args.limit ?? 25);
    },
});

export const getValidationBundle = query({
    args: {
        submissionId: v.id("changaSubmissions"),
    },
    handler: async (ctx, args) => {
        const submission = await ctx.db.get(args.submissionId);
        if (!submission) {
            return null;
        }

        const user = await getCurrentUser(ctx);
        if (!user || submission.userId === user._id) {
            throw new Error("Unauthorized");
        }

        const assets = await ctx.db.query("changaSubmissionAssets")
            .withIndex("by_submission", (q) => q.eq("submissionId", args.submissionId))
            .collect();

        const votes = await ctx.db.query("changaValidationVotes")
            .withIndex("by_submission", (q) => q.eq("submissionId", args.submissionId))
            .collect();

        return {
            ...submission,
            assets,
            // Peer reviewers must not be influenced by earlier reviewers.
            votes: isModerator(user) ? votes : [],
        };
    },
});

export const getSubmissionAssetUrl = query({
    args: {
        assetId: v.id("changaSubmissionAssets"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const asset = await ctx.db.get(args.assetId);
        if (!asset) return null;
        const submission = await ctx.db.get(asset.submissionId);
        if (!submission) return null;

        const canAccess = submission.userId === user._id
            || isModerator(user)
            || (submission.status === "in_validation" && submission.userId !== user._id);
        if (!canAccess) throw new Error("Unauthorized");

        return ctx.storage.getUrl(asset.storageId);
    },
});

export const submitValidationVote = mutation({
    args: {
        submissionId: v.id("changaSubmissions"),
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

        const submission = await ctx.db.get(args.submissionId);
        if (!submission) {
            throw new Error("Submission not found");
        }

        if (submission.userId === user._id) {
            throw new Error("Cannot validate your own submission");
        }

        // One vote per reviewer per submission, indexed by the reviewer.
        const existingVote = await ctx.db.query("changaValidationVotes")
            .withIndex("by_validator", (q) => q.eq("validatorId", user._id))
            .filter((q) => q.eq(q.field("submissionId"), args.submissionId))
            .first();

        // Determine the validator's role from language-scoped role grants,
        // falling back to the legacy moderator flag. A user-provided role
        // string is never trusted directly.
        const roleGrants = await ctx.db.query("changaRoleGrants")
            .withIndex("by_user_language", (q) =>
                q.eq("userId", user._id).eq("languageCode", submission.languageCode),
            )
            .collect();
        const now = Date.now();
        const activeRole = roleGrants
            .filter((grant) => grant.status === "active" && (!grant.expiresAt || grant.expiresAt > now))
            .sort((a, b) => roleRank(b.role) - roleRank(a.role))[0]?.role;

        const validatorRole = isModerator(user) ? "moderator" : activeRole === "verified_expert" ? "expert" : "peer";
        if (existingVote) {
            await ctx.db.patch(existingVote._id, {
                validatorRole,
                vote: args.vote,
                confidence: args.confidence,
                issueCodes: args.issueCodes,
                comment: args.comment,
                trustSnapshot: user.level ?? 0,
                createdAt: now,
            });
        } else {
            await ctx.db.insert("changaValidationVotes", {
                submissionId: args.submissionId,
                validatorId: user._id,
                validatorRole,
                vote: args.vote,
                confidence: args.confidence,
                issueCodes: args.issueCodes,
                comment: args.comment,
                trustSnapshot: user.level ?? 0,
                createdAt: now,
            });
        }

        // Re-fetch votes for this submission.
        const updatedVotes = await ctx.db.query("changaValidationVotes")
            .withIndex("by_submission", (q) => q.eq("submissionId", args.submissionId))
            .collect();
        const acceptCount = updatedVotes.filter((vote) => vote.vote === "accept").length;
        const rejectCount = updatedVotes.filter((vote) => rejectVotes.has(vote.vote)).length;
        const minorFixCount = updatedVotes.filter((vote) => vote.vote === "minor_fix").length;

        let nextStatus: SubmissionDoc["status"] = "in_validation";

        // Escalation: if there is disagreement (both accept and reject) or an
        // expert/moderator vote conflicts with peer votes, route to a language
        // moderator rather than auto-resolving.
        const hasDisagreement = acceptCount > 0 && rejectCount > 0;
        const hasExpertVote = updatedVotes.some(
            (vote) => vote.validatorRole === "expert" || vote.validatorRole === "moderator",
        );

        if (hasDisagreement && !hasExpertVote) {
            // Route to moderator — do not auto-validate on disagreement.
            const existingAssignment = await ctx.db.query("changaValidationAssignments")
                .withIndex("by_submission_status", (q) =>
                    q.eq("submissionId", args.submissionId).eq("status", "open"),
                )
                .first();
            if (!existingAssignment) {
                await ctx.db.insert("changaValidationAssignments", {
                    submissionId: args.submissionId,
                    roleRequired: "moderator",
                    status: "open",
                    assignedAt: now,
                });
            }
            nextStatus = "in_validation";
        } else if (acceptCount >= 2 && rejectCount === 0) {
            nextStatus = "validated";
        } else if (rejectCount >= 2) {
            nextStatus = "rejected";
        } else if (minorFixCount >= 2) {
            nextStatus = "needs_fix";
        }

        await ctx.db.patch(args.submissionId, {
            status: nextStatus,
            updatedAt: now,
        });

        // Close any open moderator assignment for this submission when a
        // moderator has reviewed it.
        if (validatorRole === "moderator") {
            const assignment = await ctx.db.query("changaValidationAssignments")
                .withIndex("by_submission_status", (q) =>
                    q.eq("submissionId", args.submissionId).eq("status", "open"),
                )
                .first();
            if (assignment) {
                await ctx.db.patch(assignment._id, {
                    status: "completed",
                    assignedTo: user._id,
                    completedAt: now,
                });
            }
        }

        // An immutable decision record is written for every final state —
        // never inferred later from vote counts alone.
        const decisionMap: Record<string, { decision: "accepted" | "rejected" | "needs_fix" | "escalated"; needsVotes: boolean }> = {
            validated: { decision: "accepted", needsVotes: true },
            rejected: { decision: "rejected", needsVotes: true },
            needs_fix: { decision: "needs_fix", needsVotes: true },
        };
        const mapped = decisionMap[nextStatus];
        const escalated = hasDisagreement && !hasExpertVote && nextStatus === "in_validation";
        if (mapped || escalated) {
            const existingDecision = await ctx.db.query("changaDecisions")
                .withIndex("by_submission", (q) => q.eq("submissionId", args.submissionId))
                .order("desc")
                .first();
            const decision = mapped?.decision ?? "escalated";
            if (!existingDecision || existingDecision.decision !== decision) {
                await ctx.db.insert("changaDecisions", {
                    submissionId: args.submissionId,
                    decision,
                    reason: args.comment?.slice(0, 2000),
                    resolverId: user._id,
                    evidenceVersion: DECISION_EVIDENCE_VERSION,
                    createdAt: now,
                });
            }
        }

        // Record reviewer statistics: accuracy against the final outcome of
        // this vote's decision, and acceptance behaviour.
        const voteAccepted = args.vote === "accept";
        const agreesWithOutcome = nextStatus === "validated"
            ? voteAccepted
            : nextStatus === "rejected"
                ? !voteAccepted && args.vote !== "minor_fix"
                : nextStatus === "needs_fix"
                    ? args.vote === "minor_fix"
                    : true;
        await recordValidationStats(ctx, user._id, {
            voteAccepted,
            agreesWithOutcome,
        });

        return {
            submissionId: args.submissionId,
            status: nextStatus,
            acceptCount,
            rejectCount,
            escalated,
        };
    },
});

// Route an item to a language moderator without a vote. Any reviewer may
// escalate; only moderators resolve the resulting assignment.
export const escalateSubmission = mutation({
    args: {
        submissionId: v.id("changaSubmissions"),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const submission = await ctx.db.get(args.submissionId);
        if (!submission) throw new Error("Submission not found");
        if (submission.userId === user._id) throw new Error("Cannot escalate your own submission");

        const existingAssignment = await ctx.db.query("changaValidationAssignments")
            .withIndex("by_submission_status", (q) =>
                q.eq("submissionId", args.submissionId).eq("status", "open"),
            )
            .first();
        if (!existingAssignment) {
            await ctx.db.insert("changaValidationAssignments", {
                submissionId: args.submissionId,
                roleRequired: "moderator",
                status: "open",
                assignedAt: Date.now(),
            });
        }

        await ctx.db.insert("changaDecisions", {
            submissionId: args.submissionId,
            decision: "escalated",
            reason: args.reason?.slice(0, 2000),
            resolverId: user._id,
            evidenceVersion: DECISION_EVIDENCE_VERSION,
            createdAt: Date.now(),
        });

        return args.submissionId;
    },
});

// Seed a gold task for reviewer calibration. The expected verdict is stored on
// the linked validation_gold example; reviewer votes on the item are compared
// against it by getReviewerCalibration. Moderators/expert reviewers only.
export const seedGoldTask = mutation({
    args: {
        languageCode: v.string(),
        promptSourceText: v.string(),
        goldAnswerText: v.string(),
        expectedVerdict: v.union(v.literal("accept"), v.literal("reject")),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized: Only moderators can seed gold tasks");
        }

        const now = Date.now();
        const taskId = await ctx.db.insert("changaTasks", {
            taskType: "validation",
            languageCode: args.languageCode,
            priority: "high",
            status: "open",
            targetSubmissionCount: 1,
            targetValidationCount: 3,
            createdBy: user._id,
            createdAt: now,
        });

        const submissionId = await ctx.db.insert("changaSubmissions", {
            taskId,
            userId: user._id,
            submissionType: "validation",
            languageCode: args.languageCode,
            sourceText: args.promptSourceText.slice(0, 2000),
            targetText: args.goldAnswerText.slice(0, 2000),
            consent: {
                isGranted: true,
                allowTraining: false,
                allowResearch: true,
                allowPublicAttribution: false,
                grantedAt: now,
            },
            license: "internal",
            status: "in_validation",
            submittedAt: now,
            updatedAt: now,
        });

        await ctx.db.insert("changaCuratedExamples", {
            sourceSubmissionId: submissionId,
            exampleType: "validation_gold",
            languageCode: args.languageCode,
            sourceText: args.promptSourceText.slice(0, 2000),
            targetText: args.goldAnswerText.slice(0, 2000),
            // The expected verdict is the calibration key: getReviewerCalibration
            // compares reviewer votes against this value.
            reviewSummary: args.expectedVerdict,
            releaseStatus: "gold",
            createdAt: now,
        });

        return submissionId;
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

        return ctx.db.insert("changaValidationAssignments", {
            submissionId: args.submissionId,
            assignedTo: args.assignedTo,
            roleRequired: args.roleRequired ?? "moderator",
            status: args.status ?? "assigned",
            assignedAt: Date.now(),
        });
    },
});