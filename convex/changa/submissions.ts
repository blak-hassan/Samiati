import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, isModerator } from "../users/utils";
import { enqueueSubmissionProcessing, runSubmissionChecks } from "./processing";
import { FALLBACK_CONSENT_POLICY_VERSION, insertConsentRecord } from "./consent";
import {
    changaAutoChecksValidator,
    changaConsentValidator,
    changaLicenseValidator,
    changaSpeakerProfileValidator,
    changaSubmissionStatusValidator,
    changaTaskTypeValidator,
} from "./validators";

function createDefaultConsent() {
    return {
        isGranted: true,
        allowTraining: true,
        allowResearch: true,
        allowPublicAttribution: false,
        grantedAt: Date.now(),
    };
}

function ensureRequiredTaskAnswer(taskType: string | undefined, args: {
    targetText?: string;
    transcriptText?: string;
}) {
    const answer = taskType === "transcription" ? args.transcriptText : args.targetText;
    if (!answer?.trim()) {
        throw new Error("Please provide an answer before submitting this task");
    }
}

// Max input lengths
const MAX_TARGET_TEXT = 5000;
const MAX_TRANSCRIPT_TEXT = 5000;
const MAX_CONTEXT_NOTE = 1000;
const MAX_GLOSS = 500;
const ACTIVE_CONSENT_POLICY_VERSION = FALLBACK_CONSENT_POLICY_VERSION;

// Anti-abuse velocity limits. These are deliberately conservative for the
// pilot; they prevent a single account from flooding the review queue.
const MAX_SUBMISSIONS_PER_HOUR = 50;
const MAX_SUBMISSIONS_PER_DAY = 300;
const VELOCITY_WINDOW_MS = 60 * 60 * 1000;
const DAY_WINDOW_MS = 24 * 60 * 60 * 1000;

export const listUserSubmissions = query({
    args: {
        userId: v.optional(v.id("users")),
        status: v.optional(changaSubmissionStatusValidator),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUser(ctx);
        const targetUserId = args.userId ?? currentUser?._id;
        if (!targetUserId) {
            return [];
        }

        // Non-moderators can only see their own submissions
        if (args.userId && args.userId !== currentUser?._id && !isModerator(currentUser)) {
            throw new Error("Unauthorized: You can only view your own submissions");
        }

        const submissions = await ctx.db.query("changaSubmissions")
            .withIndex("by_user_status", (q) => q.eq("userId", targetUserId))
            .collect();

        return submissions
            .filter((submission) => !args.status || submission.status === args.status)
            .sort((left, right) => right.updatedAt - left.updatedAt)
            .slice(0, args.limit ?? 50);
    },
});

// Admin query: list all submissions (moderator only)
export const listAllSubmissions = query({
    args: {
        status: v.optional(changaSubmissionStatusValidator),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUser(ctx);
        if (!currentUser || !isModerator(currentUser)) {
            throw new Error("Unauthorized: Only moderators can view all submissions");
        }

        // Status is not a valid prefix of the by_language_status composite
        // index, so the status-only index is the authoritative query here.
        const status = args.status;
        const submissions = await (status
            ? ctx.db.query("changaSubmissions").withIndex("by_status", (q) => q.eq("status", status))
            : ctx.db.query("changaSubmissions")
        ).order("desc").take(args.limit ?? 50);

        return submissions
            .filter((submission) => !args.status || submission.status === args.status)
            .sort((left, right) => right.updatedAt - left.updatedAt)
            .slice(0, args.limit ?? 50);
    },
});

export const getSubmission = query({
    args: {
        submissionId: v.id("changaSubmissions"),
    },
    handler: async (ctx, args) => {
        const submission = await ctx.db.get(args.submissionId);
        if (!submission) {
            return null;
        }

        const currentUser = await getCurrentUser(ctx);
        if (!currentUser || (submission.userId !== currentUser._id && !isModerator(currentUser))) {
            throw new Error("Unauthorized");
        }

        const assets = await ctx.db.query("changaSubmissionAssets")
            .withIndex("by_submission", (q) => q.eq("submissionId", args.submissionId))
            .collect();

        return {
            ...submission,
            assets,
        };
    },
});

export const getSubmissionProcessingRuns = query({
    args: {
        submissionId: v.id("changaSubmissions"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUser(ctx);
        if (!currentUser) throw new Error("Unauthorized");

        const submission = await ctx.db.get(args.submissionId);
        if (!submission || (submission.userId !== currentUser._id && !isModerator(currentUser))) {
            throw new Error("Unauthorized");
        }

        return ctx.db.query("changaProcessingRuns")
            .withIndex("by_submission", (q) => q.eq("submissionId", args.submissionId))
            .collect();
    },
});

export const createDraftSubmission = mutation({
    args: {
        taskId: v.id("changaTasks"),
        submissionType: changaTaskTypeValidator,
        languageCode: v.string(),
        dialectCode: v.optional(v.string()),
        regionCode: v.optional(v.string()),
        sourceText: v.optional(v.string()),
        targetText: v.optional(v.string()),
        transcriptText: v.optional(v.string()),
        contextNote: v.optional(v.string()),
        gloss: v.optional(v.string()),
        partOfSpeech: v.optional(v.string()),
        speakerProfile: v.optional(changaSpeakerProfileValidator),
        consent: v.optional(changaConsentValidator),
        license: v.optional(changaLicenseValidator),
        qualityFlags: v.optional(v.array(v.string())),
        autoChecks: v.optional(changaAutoChecksValidator),
        clientIdempotencyKey: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) {
            throw new Error("Unauthorized");
        }

        // Idempotent draft creation: a retried request with the same key
        // returns the existing draft instead of creating a duplicate.
        if (args.clientIdempotencyKey) {
            const existing = await ctx.db.query("changaSubmissions")
                .withIndex("by_user_key", (q) =>
                    q.eq("userId", user._id).eq("clientIdempotencyKey", args.clientIdempotencyKey),
                )
                .first();
            if (existing) return existing._id;
        }

        return ctx.db.insert("changaSubmissions", {
            ...args,
            userId: user._id,
            consent: args.consent ?? createDefaultConsent(),
            license: args.license ?? "community",
            status: "draft",
            updatedAt: Date.now(),
        });
    },
});

export const startClaimedSubmission = mutation({
    args: {
        claimId: v.id("changaTaskClaims"),
        consent: changaConsentValidator,
        consentPolicyVersion: v.string(),
        clientIdempotencyKey: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");
        if (!args.consent.isGranted || !args.consent.allowTraining) {
            throw new Error("Training consent is required for this task");
        }
        if (args.consentPolicyVersion !== ACTIVE_CONSENT_POLICY_VERSION) {
            throw new Error("This task needs the latest consent policy. Please refresh and try again.");
        }

        // Idempotent start: a retried request with the same key returns the
        // existing submission for this claim instead of creating a duplicate.
        if (args.clientIdempotencyKey) {
            const existing = await ctx.db.query("changaSubmissions")
                .withIndex("by_user_key", (q) =>
                    q.eq("userId", user._id).eq("clientIdempotencyKey", args.clientIdempotencyKey),
                )
                .first();
            if (existing) return existing._id;
        }

        const claim = await ctx.db.get(args.claimId);
        const now = Date.now();
        if (!claim || claim.userId !== user._id) {
            throw new Error("Task claim not found");
        }
        if (claim.submissionId) return claim.submissionId;
        if (claim.status !== "active" || claim.expiresAt <= now) {
            if (claim.status === "active") {
                await ctx.db.patch(args.claimId, { status: "expired" });
            }
            throw new Error("This task claim has expired. Please start again.");
        }

        const task = await ctx.db.get(claim.taskId);
        if (!task || !task.taskType || !task.languageCode) {
            throw new Error("The claimed task is no longer available");
        }

        const submissionId = await ctx.db.insert("changaSubmissions", {
            taskId: claim.taskId,
            userId: user._id,
            submissionType: task.taskType,
            languageCode: task.languageCode,
            dialectCode: task.dialectCode,
            regionCode: task.regionCode,
            sourceText: task.promptSourceText,
            consent: args.consent,
            consentPolicyVersion: args.consentPolicyVersion,
            clientIdempotencyKey: args.clientIdempotencyKey,
            license: "internal",
            status: "draft",
            updatedAt: now,
        });

        // Persist a versioned consent snapshot separate from the submission.
        const scopes: Array<"collection_storage" | "training" | "research"> = ["collection_storage"];
        if (args.consent.allowTraining) scopes.push("training");
        if (args.consent.allowResearch) scopes.push("research");
        await insertConsentRecord(ctx.db, {
            userId: user._id,
            submissionId,
            policyVersion: args.consentPolicyVersion,
            scopes,
            attributionPreference: args.consent.allowPublicAttribution ? "public" : "private",
        });

        await ctx.db.patch(args.claimId, {
            status: "submitted",
            submissionId,
        });

        return submissionId;
    },
});

// Finalize a draft into a raw submission record. The submission is stored in
// "submitted", its required processing runs are enqueued, and the checks that
// can be decided from already-stored evidence run inline. A raw submission is
// never treated as training data: it only reaches "in_validation" (peer
// review) when no unresolved quality flag exists, and curation additionally
// requires the processing evidence produced by the worker.
export const submitSubmission = mutation({
    args: {
        submissionId: v.id("changaSubmissions"),
        sourceText: v.optional(v.string()),
        targetText: v.optional(v.string()),
        transcriptText: v.optional(v.string()),
        contextNote: v.optional(v.string()),
        gloss: v.optional(v.string()),
        partOfSpeech: v.optional(v.string()),
        clientIdempotencyKey: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Idempotency: a retried request with the same key returns the
        // already-submitted record instead of re-processing it.
        if (args.clientIdempotencyKey) {
            const existing = await ctx.db.query("changaSubmissions")
                .withIndex("by_user_key", (q) =>
                    q.eq("userId", user._id).eq("clientIdempotencyKey", args.clientIdempotencyKey),
                )
                .first();
            if (existing) return existing._id;
        }

        const submission = await ctx.db.get(args.submissionId);
        if (!submission) throw new Error("Submission not found");

        if (submission.userId !== user._id) {
            throw new Error("Unauthorized: You can only update your own submissions");
        }

        // A submission that has already left the draft state must not be
        // re-submitted. This prevents double-submit from a retried request
        // creating duplicate processing runs or votes.
        if (submission.status !== "draft") {
            return args.submissionId;
        }

        // Velocity limit: reject submissions that exceed the per-hour or
        // per-day cap. This is a progressive-friction control, not a hard
        // block on legitimate contributors.
        const now = Date.now();
        const recentSubmissions = await ctx.db.query("changaSubmissions")
            .withIndex("by_user_status", (q) => q.eq("userId", user._id))
            .collect();
        const hourCount = recentSubmissions.filter((s) => (s.submittedAt || 0) > now - VELOCITY_WINDOW_MS).length;
        const dayCount = recentSubmissions.filter((s) => (s.submittedAt || 0) > now - DAY_WINDOW_MS).length;
        if (hourCount >= MAX_SUBMISSIONS_PER_HOUR || dayCount >= MAX_SUBMISSIONS_PER_DAY) {
            throw new Error("You have reached the submission limit for now. Please come back later.");
        }

        const task = await ctx.db.get(submission.taskId);
        if (!task) throw new Error("Task not found");
        if (task.taskType === "audio_reading") {
            const assets = await ctx.db.query("changaSubmissionAssets")
                .withIndex("by_submission", (q) => q.eq("submissionId", args.submissionId))
                .collect();
            if (!assets.some((asset) => asset.assetType === "audio")) {
                throw new Error("Record and upload audio before submitting this task");
            }
        } else {
            ensureRequiredTaskAnswer(task.taskType, args);
        }

        const qualityFlags = task.taskType === "audio_reading" ? ["audio_analysis_pending"] : [];
        await ctx.db.patch(args.submissionId, {
            // Source text comes from the task. Contributors may supply a
            // context note but must not silently replace the task prompt.
            targetText: args.targetText?.slice(0, MAX_TARGET_TEXT),
            transcriptText: args.transcriptText?.slice(0, MAX_TRANSCRIPT_TEXT),
            contextNote: args.contextNote?.slice(0, MAX_CONTEXT_NOTE),
            gloss: args.gloss?.slice(0, MAX_GLOSS),
            partOfSpeech: args.partOfSpeech,
            clientIdempotencyKey: args.clientIdempotencyKey,
            qualityFlags,
            revision: (submission.revision ?? 0) + 1,
            status: "submitted",
            submittedAt: now,
            updatedAt: now,
        });

        // Enqueue the required processing runs, then run the deterministic
        // checks inline so the submission can route to review (or stay
        // submitted for human attention) with stored evidence.
        await enqueueSubmissionProcessing(ctx.db, args.submissionId, task.taskType);
        await runSubmissionChecks(ctx, args.submissionId);

        return args.submissionId;
    },
});

export const withdrawDraftSubmission = mutation({
    args: {
        submissionId: v.id("changaSubmissions"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const submission = await ctx.db.get(args.submissionId);
        if (!submission) throw new Error("Submission not found");
        if (submission.userId !== user._id) {
            throw new Error("Unauthorized: You can only withdraw your own submissions");
        }
        if (submission.status !== "draft") {
            throw new Error("Only draft submissions can be withdrawn");
        }

        const now = Date.now();
        await ctx.db.patch(args.submissionId, {
            status: "withdrawn",
            withdrawnAt: now,
            updatedAt: now,
        });

        // Release any active claim tied to this submission so the task
        // becomes available to other contributors.
        if (submission.taskId) {
            const claims = await ctx.db.query("changaTaskClaims")
                .withIndex("by_user_task", (q) =>
                    q.eq("userId", user._id).eq("taskId", submission.taskId),
                )
                .collect();
            const activeClaim = claims.find(
                (claim) => claim.status === "submitted" && claim.submissionId === args.submissionId,
            );
            if (activeClaim) {
                await ctx.db.patch(activeClaim._id, { status: "released" });
            }
        }

        return args.submissionId;
    },
});

export const attachSubmissionAsset = mutation({
    args: {
        submissionId: v.id("changaSubmissions"),
        storageId: v.id("_storage"),
        assetType: v.union(v.literal("audio"), v.literal("image")),
        mimeType: v.string(),
        durationMs: v.optional(v.number()),
        sampleRate: v.optional(v.number()),
        channels: v.optional(v.number()),
        sizeBytes: v.optional(v.number()),
        waveformPreview: v.optional(v.string()),
        asrText: v.optional(v.string()),
        asrConfidence: v.optional(v.number()),
        snrScore: v.optional(v.number()),
        clippingScore: v.optional(v.number()),
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

        if (submission.userId !== user._id) {
            throw new Error("Unauthorized");
        }
        if (submission.status !== "draft") {
            throw new Error("Assets can only be added to a draft submission");
        }
        if (args.assetType !== "audio") {
            throw new Error("Only audio assets are supported in this Changa collection flow");
        }
        if (!args.mimeType.startsWith("audio/")) {
            throw new Error("Upload a supported audio recording");
        }
        if (args.sizeBytes !== undefined && args.sizeBytes > 25 * 1024 * 1024) {
            throw new Error("Audio recordings must be 25 MB or smaller");
        }

        const existingAssets = await ctx.db.query("changaSubmissionAssets")
            .withIndex("by_submission", (q) => q.eq("submissionId", args.submissionId))
            .collect();
        if (existingAssets.some((asset) => asset.assetType === args.assetType)) {
            throw new Error("This submission already has an audio recording");
        }

        const assetId = await ctx.db.insert("changaSubmissionAssets", {
            ...args,
            createdAt: Date.now(),
        });

        await ctx.db.patch(args.submissionId, {
            updatedAt: Date.now(),
        });

        return assetId;
    },
});