import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { getCurrentUser } from "./users/utils";
import type { Id } from "./_generated/dataModel";
import {
    AI_CORRECTION_DOMAIN,
    AI_CORRECTION_TEMPLATE_NAME,
    FEEDBACK_TEXT_MAX_LENGTH,
    classifyFeedbackCorrection,
    feedbackCodeCandidates,
    feedbackReasonLabel,
    isPromotableFeedbackContext,
} from "./feedbackConstants";
import { changaConsentValidator } from "./changa/validators";
import { getActiveConsentPolicyVersion, insertConsentRecord } from "./changa/consent";
import { enqueueSubmissionProcessing, runSubmissionChecks } from "./changa/processing";
import {
    DAY_WINDOW_MS,
    MAX_SUBMISSIONS_PER_DAY,
    MAX_SUBMISSIONS_PER_HOUR,
    VELOCITY_WINDOW_MS,
} from "./changa/constants";

// Assign a short, quotable public code to a feedback row.
//
// The code is derived from the (unique) document id rather than generated
// randomly, so it never has to be rolled back or re-issued. Longer suffixes
// are tried only if a shorter one is already taken.
async function assignFeedbackCode(
    ctx: MutationCtx,
    feedbackId: Id<"feedback">,
): Promise<string | undefined> {
    const candidates = feedbackCodeCandidates(feedbackId);
    for (const candidate of candidates) {
        const taken = await ctx.db
            .query("feedback")
            .withIndex("by_code", (q) => q.eq("code", candidate))
            .first();
        if (!taken) {
            await ctx.db.patch(feedbackId, { code: candidate });
            return candidate;
        }
    }
    return undefined;
}

// Submit feedback on an AI response (thumbs up/down + optional reason/correction)
export const submit = mutation({
    args: {
        messageId: v.optional(v.string()),
        conversationId: v.optional(v.string()),
        type: v.union(v.literal("up"), v.literal("down")),
        reason: v.optional(v.string()),
        correction: v.optional(v.string()),
        contextType: v.union(
            v.literal("chat"),
            v.literal("translate"),
            v.literal("voice"),
            v.literal("tts"),
            v.literal("search"),
        ),
        language: v.optional(v.string()),
        originalText: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Check for duplicate feedback on the same message (toggle behavior)
        if (args.messageId) {
            const existing = await ctx.db
                .query("feedback")
                .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
                .filter((q) => q.eq(q.field("userId"), user._id))
                .first();

            if (existing) {
                // A down-vote that carries a reason or a correction is an
                // *update* of the same report, not a second vote. Toggling it
                // off would silently discard the correction the user wrote,
                // which is the most valuable part of the report.
                const isSameVote = existing.type === args.type;
                const addsDetail = Boolean(args.reason) || Boolean(args.correction);

                if (isSameVote && !addsDetail) {
                    // Same bare vote again — remove it (toggle off)
                    await ctx.db.delete(existing._id);
                    return { action: "removed", id: existing._id, code: existing.code };
                }

                if (isSameVote) {
                    // More detail on the same report. A field the new call
                    // omits is kept, so adding a reason after a correction
                    // does not erase the correction.
                    await ctx.db.patch(existing._id, {
                        type: args.type,
                        reason: args.reason ?? existing.reason,
                        correction: args.correction ?? existing.correction,
                        timestamp: Date.now(),
                    });
                } else {
                    // A different vote replaces the report: the old reason and
                    // correction no longer describe what the user thinks.
                    await ctx.db.patch(existing._id, {
                        type: args.type,
                        reason: args.reason,
                        correction: args.correction,
                        timestamp: Date.now(),
                    });
                }
                return { action: "updated", id: existing._id, code: existing.code };
            }
        }

        // New feedback
        const feedbackId = await ctx.db.insert("feedback", {
            userId: user._id,
            messageId: args.messageId,
            conversationId: args.conversationId,
            type: args.type,
            reason: args.reason,
            correction: args.correction,
            contextType: args.contextType,
            language: args.language,
            originalText: args.originalText?.slice(0, 2000),
            timestamp: Date.now(),
        });

        // Give every feedback row a short code the user can quote to support
        // or a moderator. The code is derived from the (unique) document id,
        // so it never has to be rolled back or re-issued.
        const code = await assignFeedbackCode(ctx, feedbackId);

        return { action: "created", id: feedbackId, code };
    },
});

// Get feedback stats for a user (profile impact)
export const getUserStats = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return null;

        const allFeedback = await ctx.db
            .query("feedback")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        const totalFeedback = allFeedback.length;
        const thumbsUp = allFeedback.filter((f) => f.type === "up").length;
        const thumbsDown = allFeedback.filter((f) => f.type === "down").length;
        const correctionsSubmitted = allFeedback.filter((f) => f.correction).length;
        const withReasons = allFeedback.filter((f) => f.reason).length;
        // Corrections that were promoted into the Changa review queue. The
        // count is what makes a user's impact legible on their profile.
        const correctionsPromoted = allFeedback.filter((f) => f.changaSubmissionId).length;

        return {
            totalFeedback,
            thumbsUp,
            thumbsDown,
            correctionsSubmitted,
            withReasons,
            correctionsPromoted,
        };
    },
});

// The user's own corrections, newest first, with the review status of each
// promoted one. This is the "Your corrections" surface on the profile.
export const listMyCorrections = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        const allFeedback = await ctx.db
            .query("feedback")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        const corrections = allFeedback
            .filter((f) => Boolean(f.correction))
            .sort((left, right) => right.timestamp - left.timestamp)
            .slice(0, args.limit ?? 20);

        return Promise.all(
            corrections.map(async (feedback) => {
                const submission = feedback.changaSubmissionId
                    ? await ctx.db.get(feedback.changaSubmissionId)
                    : null;
                return {
                    id: feedback._id,
                    code: feedback.code ?? null,
                    correction: feedback.correction ?? "",
                    originalText: feedback.originalText ?? null,
                    reason: feedback.reason ?? null,
                    reasonLabel: feedback.reason
                        ? feedbackReasonLabel(feedback.contextType, feedback.reason)
                        : null,
                    contextType: feedback.contextType,
                    language: feedback.language ?? null,
                    timestamp: feedback.timestamp,
                    submissionId: feedback.changaSubmissionId ?? null,
                    submissionStatus: submission?.status ?? null,
                };
            }),
        );
    },
});

// Get recent feedback (for moderation / admin review)
export const getRecent = query({
    args: {
        limit: v.optional(v.number()),
        type: v.optional(v.union(v.literal("up"), v.literal("down"))),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "admin" && user.role !== "moderator")) {
            throw new Error("Unauthorized");
        }

        let query = ctx.db.query("feedback").order("desc");

        if (args.type) {
            const t = args.type;
            query = ctx.db
                .query("feedback")
                .withIndex("by_type", (q) => q.eq("type", t))
                .order("desc");
        }

        const items = await query.take(args.limit || 50);

        return Promise.all(
            items.map(async (item) => {
                const feedbackUser = await ctx.db.get(item.userId);
                return {
                    ...item,
                    userName: feedbackUser?.name,
                    userHandle: feedbackUser?.handle,
                    userAvatar: feedbackUser?.avatar,
                };
            })
        );
    },
});

// Promote a reported correction into the Changa contribution pipeline.
//
// A user who types "this should be mũgithi" while reporting a bad answer has
// just handed Samiati a curated training example. This mutation files that
// correction as a Changa submission so it is validated by other speakers and
// can end up in a dataset release — exactly the loop the Changa architecture
// was designed for.
//
// The submission is created through the same pipeline a task contribution
// uses: an explicit consent check, a versioned consent record, the shared
// velocity limits, and the automatic quality checks that route it to peer
// review. Nothing here bypasses the review queue.
export const promoteToChanga = mutation({
    args: {
        feedbackId: v.id("feedback"),
        consent: changaConsentValidator,
        consentPolicyVersion: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const feedback = await ctx.db.get(args.feedbackId);
        if (!feedback || feedback.userId !== user._id) {
            throw new Error("Unauthorized: You can only promote your own feedback");
        }
        if (feedback.changaSubmissionId) {
            throw new Error("This correction has already been sent for review");
        }
        if (feedback.type !== "down") {
            throw new Error("Only a reported answer can be corrected");
        }
        if (!feedback.correction?.trim()) {
            throw new Error("This feedback has no correction to promote");
        }
        if (!isPromotableFeedbackContext(feedback.contextType)) {
            throw new Error("This kind of feedback cannot be promoted");
        }

        // Consent is never assumed: training use must be granted explicitly,
        // and it must be granted against the policy version actually in force.
        if (!args.consent.isGranted || !args.consent.allowTraining) {
            throw new Error("Training consent is required to send a correction for review");
        }
        const activePolicyVersion = await getActiveConsentPolicyVersion(ctx.db);
        if (args.consentPolicyVersion !== activePolicyVersion) {
            throw new Error("This needs the latest consent policy. Please refresh and try again.");
        }

        const correction = feedback.correction.trim().slice(0, FEEDBACK_TEXT_MAX_LENGTH);
        const sourceText = feedback.originalText?.slice(0, FEEDBACK_TEXT_MAX_LENGTH);
        const languageCode = (feedback.language ?? "en").trim().toLowerCase().slice(0, 20);
        const taskType = classifyFeedbackCorrection(correction);

        // The same anti-abuse budget the task-contribution path uses, so a
        // correction cannot be used to flood the review queue.
        const now = Date.now();
        const recentSubmissions = await ctx.db
            .query("changaSubmissions")
            .withIndex("by_user_status", (q) => q.eq("userId", user._id))
            .collect();
        const hourCount = recentSubmissions.filter(
            (s) => (s.submittedAt || 0) > now - VELOCITY_WINDOW_MS,
        ).length;
        const dayCount = recentSubmissions.filter(
            (s) => (s.submittedAt || 0) > now - DAY_WINDOW_MS,
        ).length;
        if (hourCount >= MAX_SUBMISSIONS_PER_HOUR || dayCount >= MAX_SUBMISSIONS_PER_DAY) {
            throw new Error("You have reached the submission limit for now. Please come back later.");
        }

        // Changa is task-first: a submission has to hang off a task so there is
        // a contract for reviewers to judge it against. Promoted corrections
        // share one template per task type so the contract stays consistent.
        const template = await ctx.db
            .query("changaTaskTemplates")
            .withIndex("by_taskType", (q) => q.eq("taskType", taskType))
            .filter((q) => q.eq(q.field("name"), AI_CORRECTION_TEMPLATE_NAME))
            .first();

        let templateId = template?._id;
        let templateVersion = template?.templateVersion;
        if (!template) {
            templateId = await ctx.db.insert("changaTaskTemplates", {
                name: AI_CORRECTION_TEMPLATE_NAME,
                taskType,
                instructions:
                    "A community member reported that this wording was wrong. Give the version a fluent speaker in this language would actually use.",
                sourceMode: "freeform",
                inputSchema: [
                    { id: "sourceText", label: "Reported wording", inputType: "text", required: false },
                ],
                outputSchema: [
                    { id: "targetText", label: "Corrected wording", inputType: "text", required: true },
                ],
                requiresAudio: false,
                requiresTranslation: true,
                requiresValidationCount: 3,
                templateVersion: 1,
                riskTier: "low",
                destinationDataProduct: "community_corrections",
                requiredConsentScopes: ["collection_storage", "training"],
                isActive: true,
                createdBy: user._id,
                createdAt: now,
            });
            templateVersion = 1;
        }

        const taskId = await ctx.db.insert("changaTasks", {
            templateId,
            templateVersion,
            taskType,
            languageCode,
            domain: AI_CORRECTION_DOMAIN,
            difficulty: "intermediate",
            promptSourceText: sourceText,
            priority: "normal",
            status: "open",
            targetSubmissionCount: 1,
            targetValidationCount: 3,
            createdBy: user._id,
            createdAt: now,
        });

        // The reason the user gave travels with the correction: it tells a
        // reviewer *why* the original was wrong, which is often the more
        // valuable half of the report.
        const contextNote = feedback.reason
            ? `Reported as: ${feedbackReasonLabel(feedback.contextType, feedback.reason)}.`
            : undefined;

        const submissionId = await ctx.db.insert("changaSubmissions", {
            taskId,
            userId: user._id,
            submissionType: taskType,
            languageCode,
            sourceText,
            targetText: correction,
            contextNote,
            consent: args.consent,
            consentPolicyVersion: args.consentPolicyVersion,
            clientIdempotencyKey: `feedback:${feedback._id}`,
            license: "internal",
            status: "draft",
            updatedAt: now,
        });

        // Persist the versioned consent snapshot, exactly as the task flow
        // does, so the scopes the user agreed to are never inferred later.
        const scopes: Array<"collection_storage" | "training" | "research"> = [
            "collection_storage",
        ];
        if (args.consent.allowTraining) scopes.push("training");
        if (args.consent.allowResearch) scopes.push("research");
        await insertConsentRecord(ctx.db, {
            userId: user._id,
            submissionId,
            policyVersion: args.consentPolicyVersion,
            scopes,
            attributionPreference: args.consent.allowPublicAttribution ? "public" : "private",
        });

        // Run the submission through the same checks a task contribution gets,
        // so it lands in peer review with its evidence attached rather than
        // being waved through.
        await ctx.db.patch(submissionId, {
            status: "submitted",
            submittedAt: now,
            revision: 1,
            updatedAt: now,
        });
        await enqueueSubmissionProcessing(ctx.db, submissionId, taskType);
        const { routedTo } = await runSubmissionChecks(ctx, submissionId);

        // Link the feedback row back to the submission so the link is visible
        // from both ends, and so the correction is never promoted twice.
        await ctx.db.patch(feedback._id, { changaSubmissionId: submissionId });

        return { submissionId, taskId, status: routedTo };
    },
});
