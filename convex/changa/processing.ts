import { internalMutation, query, type MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, isModerator } from "../users/utils";
import type { Doc, Id } from "../_generated/dataModel";

// Flags that keep a submission out of peer review until a human looks at it.
// A raw submission must never be treated as training data on false certainty.
export const HARD_QUALITY_FLAGS = [
    "low_audio_quality",
    "low_transcription_confidence",
    "transcript_missing",
    "potential_duplicate",
    "audio_analysis_pending",
] as const;

// Processors that must produce evidence before a raw record is considered for
// curation. `basic_task_check`, `duplicate_detection`, `audio_quality` (from
// asset metadata), `language_id` (declared language) and `moderation` are
// decided inline from stored data; `asr` requires the external worker and is
// the only processor that stays queued after submission.
const BASE_PROCESSORS = ["basic_task_check", "duplicate_detection", "language_id", "moderation"] as const;
const AUDIO_PROCESSORS = ["audio_quality", "asr"] as const;

export type ProcessorName = (typeof BASE_PROCESSORS)[number] | (typeof AUDIO_PROCESSORS)[number];

export function requiredProcessorsForTask(taskType: string | undefined): readonly ProcessorName[] {
    return taskType === "audio_reading" ? [...BASE_PROCESSORS, ...AUDIO_PROCESSORS] : BASE_PROCESSORS;
}

// Insert queued processing runs for a submission, avoiding duplicates for
// processors that already have a queued run.
export async function enqueueSubmissionProcessing(
    db: MutationCtx["db"],
    submissionId: Id<"changaSubmissions">,
    taskType: string | undefined,
): Promise<Id<"changaProcessingRuns">[]> {
    const existing = await db.query("changaProcessingRuns")
        .withIndex("by_submission", (q) => q.eq("submissionId", submissionId))
        .collect();
    const queued = new Set(existing.filter((run) => run.status === "queued").map((run) => run.processor));

    const created: Id<"changaProcessingRuns">[] = [];
    for (const processor of requiredProcessorsForTask(taskType)) {
        if (queued.has(processor)) continue;
        created.push(await db.insert("changaProcessingRuns", {
            submissionId,
            processor,
            status: "queued",
            createdAt: Date.now(),
        }));
    }
    return created;
}

export function calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    const intersection = [...words1].filter((w) => words2.has(w)).length;
    const union = new Set([...words1, ...words2]).size;
    return union > 0 ? intersection / union : 0;
}

// Placeholder exact/near-duplicate scan over recent submissions. The index
// strategy and per-task thresholds are repaired in Phase 2; this must not be
// treated as a definitive duplicate determination.
export async function findDuplicateText(
    db: MutationCtx["db"],
    text: string,
    excludeId: Id<"changaSubmissions">,
): Promise<number> {
    if (!text) return 0;
    const submissions = await db.query("changaSubmissions")
        .order("desc")
        .take(200);
    let maxSimilarity = 0;
    for (const sub of submissions) {
        if (sub._id === excludeId) continue;
        const similarity = calculateTextSimilarity(text, sub.sourceText || sub.targetText || "");
        if (similarity > maxSimilarity) maxSimilarity = similarity;
    }
    return maxSimilarity;
}

// Runs the deterministic checks that need no external services and advances
// the submission to human review when it is safe to do so. Every run records
// an explicit result so decisions are explainable; `asr` is left queued for
// the external worker. Hard quality flags keep the submission in "submitted"
// (routed to human) rather than claiming a false certainty.
export async function runSubmissionChecks(
    ctx: { db: MutationCtx["db"] },
    submissionId: Id<"changaSubmissions">,
): Promise<{ routedTo: "in_validation" | "submitted"; flags: string[] }> {
    const db = ctx.db;
    const submission = await db.get(submissionId);
    if (!submission) throw new Error("Submission not found");

    const runs = await db.query("changaProcessingRuns")
        .withIndex("by_submission", (q) => q.eq("submissionId", submissionId))
        .collect();

    const assets = await db.query("changaSubmissionAssets")
        .withIndex("by_submission", (q) => q.eq("submissionId", submissionId))
        .collect();

    const flags = [...(submission.qualityFlags || [])];
    const now = Date.now();

    const complete = async (run: Doc<"changaProcessingRuns">, result: Record<string, unknown>) => {
        await db.patch(run._id, {
            status: "completed",
            result,
            completedAt: now,
        });
    };
    const fail = async (run: Doc<"changaProcessingRuns">, error: string) => {
        await db.patch(run._id, { status: "failed", error, completedAt: now });
    };

    // basic_task_check — the task contract was validated at submit time; this
    // run records that evidence (answer presence / audio attachment).
    const basicRun = runs.find((run) => run.processor === "basic_task_check");
    if (basicRun && basicRun.status === "queued") {
        const answer = submission.transcriptText || submission.targetText;
        const answerPresent = typeof answer === "string" && answer.trim().length > 0;
        const audioAttached = assets.some((asset) => asset.assetType === "audio");
        if (answerPresent || audioAttached) {
            await complete(basicRun, { answerPresent, audioAttached });
        } else {
            await fail(basicRun, "missing_answer");
        }
    }

    // duplicate_detection — exact/near text similarity against recent work.
    const duplicateRun = runs.find((run) => run.processor === "duplicate_detection");
    if (duplicateRun && duplicateRun.status === "queued") {
        const text = String(submission.targetText || submission.transcriptText || submission.sourceText || "");
        const similarity = await findDuplicateText(db, text, submissionId);
        const threshold = 0.8;
        if (similarity > threshold && !flags.includes("potential_duplicate")) {
            flags.push("potential_duplicate");
        }
        await complete(duplicateRun, { maxSimilarity: similarity, threshold });
    }

    // audio_quality — only decides from recorded asset signal metadata; with
    // no metadata it records that a manual audio review is required.
    const audioAsset = assets.find((asset) => asset.assetType === "audio");
    const audioQualityRun = runs.find((run) => run.processor === "audio_quality");
    if (audioQualityRun && audioQualityRun.status === "queued") {
        const snr = audioAsset?.snrScore;
        if (typeof snr === "number") {
            const passed = snr >= 10;
            if (!passed && !flags.includes("low_audio_quality")) flags.push("low_audio_quality");
            await complete(audioQualityRun, { snrScore: snr, passed });
        } else {
            await complete(audioQualityRun, { requiresManualAudioReview: true });
        }
    }

    // language_id — records the task's declared language transparently. A real
    // LID model adapter replaces this in Phase 2; this is never presented as
    // model certainty.
    const languageIdRun = runs.find((run) => run.processor === "language_id");
    if (languageIdRun && languageIdRun.status === "queued") {
        await complete(languageIdRun, {
            method: "declared_language",
            languageCode: submission.languageCode,
            confidence: null,
        });
    }

    // moderation — no automated content-classification adapter exists yet;
    // the run records that human moderation is required and review decides.
    const moderationRun = runs.find((run) => run.processor === "moderation");
    if (moderationRun && moderationRun.status === "queued") {
        await complete(moderationRun, { requiresHumanModeration: true });
    }

    await db.patch(submissionId, { qualityFlags: flags, updatedAt: now });

    const hasUnresolvedFlag = flags.some((flag) =>
        (HARD_QUALITY_FLAGS as readonly string[]).includes(flag),
    );

    const routedTo: "in_validation" | "submitted" = hasUnresolvedFlag ? "submitted" : "in_validation";
    if (submission.status === "submitted" && routedTo !== submission.status) {
        await db.patch(submissionId, { status: routedTo });
    }

    return { routedTo, flags };
}

// A transparent, user-facing status derived from the stored submission state.
// This is what the UI should show instead of a raw status string.
export const getSubmissionStatus = query({
    args: {
        submissionId: v.id("changaSubmissions"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const submission = await ctx.db.get(args.submissionId);
        if (!submission) throw new Error("Submission not found");
        if (submission.userId !== user._id && !isModerator(user)) {
            throw new Error("Unauthorized");
        }

        const processingRuns = await ctx.db.query("changaProcessingRuns")
            .withIndex("by_submission", (q) => q.eq("submissionId", args.submissionId))
            .collect();

        const qualityFlags = submission.qualityFlags || [];
        const autoChecks = submission.autoChecks || {};

        // Derive a transparent status message.
        let status: "received" | "needs_retry" | "in_review" | "accepted" | "rejected" = "received";
        let message = "Your contribution was received and is being checked.";
        let retryReason: string | null = null;

        if (submission.status === "validated" || submission.status === "curated") {
            status = "accepted";
            message = "Your contribution was accepted and is eligible for training data.";
        } else if (submission.status === "rejected") {
            status = "rejected";
            message = "This contribution could not be accepted.";
        } else if (submission.status === "needs_fix") {
            status = "needs_retry";
            message = "We need a small correction before this can be accepted.";
            retryReason = "reviewer_requested_fix";
        } else if (qualityFlags.includes("low_audio_quality")) {
            status = "needs_retry";
            message = "Please re-record — the audio was too quiet.";
            retryReason = "low_audio_quality";
        } else if (qualityFlags.includes("low_transcription_confidence")) {
            status = "needs_retry";
            message = "The transcription did not match the audio closely enough.";
            retryReason = "low_transcription_confidence";
        } else if (qualityFlags.includes("potential_duplicate")) {
            status = "needs_retry";
            message = "This looks very similar to an existing contribution.";
            retryReason = "potential_duplicate";
        } else if (submission.status === "in_validation") {
            status = "in_review";
            message = "Your contribution is being reviewed by the community.";
        }

        return {
            submissionId: args.submissionId,
            status,
            message,
            retryReason,
            qualityFlags,
            autoChecks,
            processingRuns: processingRuns.map((run) => ({
                processor: run.processor,
                status: run.status,
                completedAt: run.completedAt,
            })),
        };
    },
});

// Enqueue a processing run for a submission. Internal — called by the job
// worker and trusted server code, never directly by the client. The
// submission pipeline enqueues its required runs inside `submitSubmission`;
// this entry point exists for targeted runs (e.g. a moderation re-run).
export const enqueueProcessing = internalMutation({
    args: {
        submissionId: v.id("changaSubmissions"),
        processor: v.union(
            v.literal("basic_task_check"),
            v.literal("audio_quality"),
            v.literal("asr"),
            v.literal("language_id"),
            v.literal("duplicate_detection"),
            v.literal("moderation"),
        ),
    },
    handler: async (ctx, args) => {
        const submission = await ctx.db.get(args.submissionId);
        if (!submission) throw new Error("Submission not found");

        await enqueueSubmissionProcessing(ctx.db, args.submissionId, submission.submissionType);
        return args.submissionId;
    },
});

// Mark a processing run as completed with a result. Internal — used by the
// job worker, never by the client.
export const completeProcessingRun = internalMutation({
    args: {
        runId: v.id("changaProcessingRuns"),
        result: v.optional(v.any()),
        error: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const run = await ctx.db.get(args.runId);
        if (!run) throw new Error("Processing run not found");

        await ctx.db.patch(args.runId, {
            status: args.error ? "failed" : "completed",
            result: args.result,
            error: args.error,
            completedAt: Date.now(),
        });

        return args.runId;
    },
});