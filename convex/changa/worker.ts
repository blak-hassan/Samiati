import { internalAction, internalMutation, internalQuery } from "../_generated/server";import { api, internal } from "../_generated/api";
import { v } from "convex/values";
import {
    HARD_QUALITY_FLAGS,
    calculateTextSimilarity,
} from "./processing";
import type { Doc } from "../_generated/dataModel";

const ASR_MODEL_VERSION = "paza-whisper-large-v3-turbo";
const WORKER_BATCH_SIZE = 10;

// Internal: list queued processing runs with their submission and assets so
// the worker action can process them. Bounded by batch size.
export const listQueuedRuns = internalQuery({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args): Promise<Array<{
        run: Doc<"changaProcessingRuns">;
        submission: Doc<"changaSubmissions"> | null;
        assets: Doc<"changaSubmissionAssets">[];
    }>> => {
        const runs = await ctx.db.query("changaProcessingRuns")
            .withIndex("by_status", (q) => q.eq("status", "queued"))
            .take(args.limit ?? WORKER_BATCH_SIZE);

        return Promise.all(runs.map(async (run) => {
            const submission = await ctx.db.get(run.submissionId);
            const assets = await ctx.db.query("changaSubmissionAssets")
                .withIndex("by_submission", (q) => q.eq("submissionId", run.submissionId))
                .collect();
            return { run, submission, assets };
        }));
    },
});

// The worker is the only place automated evidence is produced. It polls the
// queued run queue, runs the external adapters (ASR via Paza Whisper) and
// records model/version/config provenance on every run. Internal so clients
// can never enqueue or complete runs directly.
export const processQueuedRuns = internalAction({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args): Promise<number> => {
        const batch = await ctx.runQuery(internal.changa.worker.listQueuedRuns, {
            limit: args.limit ?? WORKER_BATCH_SIZE,
        });

        for (const { run, submission, assets } of batch) {
            if (!submission) continue;

            switch (run.processor) {
                case "asr": {
                    const audioAsset = assets.find((asset) => asset.assetType === "audio");
                    if (!audioAsset) {
                        await ctx.runMutation(internal.changa.worker.completeAsrRun, {
                            runId: run._id,
                            error: "no_audio_asset",
                        });
                        break;
                    }

                    const url = await ctx.storage.getUrl(audioAsset.storageId);
                    if (!url) {
                        await ctx.runMutation(internal.changa.worker.completeAsrRun, {
                            runId: run._id,
                            error: "storage_unavailable",
                        });
                        break;
                    }

                    try {
                        const response = await fetch(url);
                        if (!response.ok) {
                            throw new Error(`audio fetch failed: ${response.status}`);
                        }
                        const bytes = await response.arrayBuffer();
                        const audioBase64 = Buffer.from(bytes).toString("base64");
                        const result = await ctx.runAction(api.asr.transcribeAudio, { audioBase64 });
                        if (result.error) {
                            await ctx.runMutation(internal.changa.worker.completeAsrRun, {
                                runId: run._id,
                                error: result.error,
                            });
                        } else {
                            await ctx.runMutation(internal.changa.worker.completeAsrRun, {
                                runId: run._id,
                                text: result.text,
                            });
                        }
                    } catch (error) {
                        await ctx.runMutation(internal.changa.worker.completeAsrRun, {
                            runId: run._id,
                            error: error instanceof Error ? error.message : "asr_failed",
                        });
                    }
                    break;
                }

                case "language_id": {
                    await ctx.runMutation(internal.changa.worker.completeLanguageIdRun, {
                        runId: run._id,
                        declaredLanguageCode: submission.languageCode,
                    });
                    break;
                }

                case "moderation": {
                    await ctx.runMutation(internal.changa.worker.completeModerationRun, {
                        runId: run._id,
                    });
                    break;
                }

                default: {
                    // basic_task_check / duplicate_detection / audio_quality
                    // are decided inline at submit time; a queued copy here is
                    // stale and can only be recorded as reviewed.
                    await ctx.runMutation(internal.changa.worker.completeInlineReviewedRun, {
                        runId: run._id,
                    });
                }
            }
        }

        return batch.length;
    },
});

// Record the ASR hypothesis on the asset, compare it to the contributor's
// transcript when one exists, and route the submission when the queue drains.
export const completeAsrRun = internalMutation({
    args: {
        runId: v.id("changaProcessingRuns"),
        text: v.optional(v.string()),
        error: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const run = await ctx.db.get(args.runId);
        if (!run) throw new Error("Processing run not found");
        const now = Date.now();

        if (args.error) {
            await ctx.db.patch(run._id, {
                status: "failed",
                error: args.error,
                modelVersion: ASR_MODEL_VERSION,
                completedAt: now,
            });
            return run._id;
        }

        const submission = await ctx.db.get(run.submissionId);
        const asset = run.assetId ? await ctx.db.get(run.assetId) : null;
        const audioAsset = asset?.assetType === "audio"
            ? asset
            : await ctx.db.query("changaSubmissionAssets")
                .withIndex("by_submission", (q) => q.eq("submissionId", run.submissionId))
                .filter((q) => q.eq(q.field("assetType"), "audio"))
                .first();

        const flags = [...(submission?.qualityFlags || [])];
        const text = args.text ?? "";
        if (audioAsset) {
            await ctx.db.patch(audioAsset._id, { asrText: text });
        }

        // Compare the transcript the contributor supplied against the ASR
        // hypothesis. A low match is a routing flag, not a rejection.
        if (submission?.transcriptText && text) {
            const similarity = calculateTextSimilarity(submission.transcriptText, text);
            if (similarity < 0.5 && !flags.includes("low_transcription_confidence")) {
                flags.push("low_transcription_confidence");
            }
            await ctx.db.patch(run._id, {
                status: "completed",
                result: { text, similarity, threshold: 0.7, model: ASR_MODEL_VERSION },
                modelVersion: ASR_MODEL_VERSION,
                completedAt: now,
            });
        } else {
            await ctx.db.patch(run._id, {
                status: "completed",
                result: { text, model: ASR_MODEL_VERSION },
                modelVersion: ASR_MODEL_VERSION,
                completedAt: now,
            });
        }

        if (submission && flags.length !== (submission.qualityFlags?.length ?? 0)) {
            await ctx.db.patch(submission._id, { qualityFlags: flags, updatedAt: now });
        }

        await ctx.runMutation(internal.changa.worker.finalizeSubmissionRouting, {
            submissionId: run.submissionId,
        });

        return run._id;
    },
});

// Records the declared language for a submission transparently — never a model
// claim, but useful provenance for the coverage dashboard.
export const completeLanguageIdRun = internalMutation({
    args: {
        runId: v.id("changaProcessingRuns"),
        declaredLanguageCode: v.string(),
    },
    handler: async (ctx, args) => {
        const run = await ctx.db.get(args.runId);
        if (!run) throw new Error("Processing run not found");

        await ctx.db.patch(run._id, {
            status: "completed",
            result: {
                method: "declared_language",
                languageCode: args.declaredLanguageCode,
                confidence: null,
            },
            completedAt: Date.now(),
        });
        return run._id;
    },
});

// Records that automated moderation has no adapter yet and human moderation is
// required. Never auto-approves or auto-rejects content.
export const completeModerationRun = internalMutation({
    args: {
        runId: v.id("changaProcessingRuns"),
    },
    handler: async (ctx, args) => {
        const run = await ctx.db.get(args.runId);
        if (!run) throw new Error("Processing run not found");

        await ctx.db.patch(run._id, {
            status: "completed",
            result: { requiresHumanModeration: true },
            completedAt: Date.now(),
        });
        return run._id;
    },
});

// Stale inline-run cleanup for runs that reach the queue without evidence.
export const completeInlineReviewedRun = internalMutation({
    args: {
        runId: v.id("changaProcessingRuns"),
    },
    handler: async (ctx, args) => {
        const run = await ctx.db.get(args.runId);
        if (!run) throw new Error("Processing run not found");

        await ctx.db.patch(run._id, {
            status: "completed",
            result: { reviewed: true, note: "decided inline at submit time" },
            completedAt: Date.now(),
        });
        return run._id;
    },
});

// Route a submission to peer review once its processing queue is drained and
// no hard quality flag remains; otherwise it stays "submitted" (human lane).
export const finalizeSubmissionRouting = internalMutation({
    args: {
        submissionId: v.id("changaSubmissions"),
    },
    handler: async (ctx, args) => {
        const submission = await ctx.db.get(args.submissionId);
        if (!submission || submission.status !== "submitted") return;

        const remainingRuns = await ctx.db.query("changaProcessingRuns")
            .withIndex("by_submission", (q) => q.eq("submissionId", args.submissionId))
            .filter((q) => q.or(
                q.eq(q.field("status"), "queued"),
                q.eq(q.field("status"), "running"),
            ))
            .collect();
        const remaining = remainingRuns.length;

        const flags = submission.qualityFlags ?? [];
        const hasHardFlag = flags.some((flag) =>
            (HARD_QUALITY_FLAGS as readonly string[]).includes(flag),
        );

        if (remaining === 0 && !hasHardFlag) {
            await ctx.db.patch(args.submissionId, {
                status: "in_validation",
                updatedAt: Date.now(),
            });
        }
    },
});

export type ProcessingRunDoc = Doc<"changaProcessingRuns">;