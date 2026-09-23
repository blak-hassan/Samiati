/**
 * Changa moderation classifier — non-decisional.
 *
 * PRINCIPLE: This module returns *scores*, never decisions. The existing
 * Changa design explicitly refuses to auto-reject content based on
 * automated signals (see `processing.ts` — the moderation processor
 * records `requiresHumanModeration: true` and routes to humans). The
 * classifier extends that principle: scores are recorded as soft flags
 * for human review *prioritization*, never as gates.
 *
 * The classifier calls `routeModeration` from the AI router, which
 * today maps to `unitary/toxic-bert` on HuggingFace. The model returns
 * a probability vector over six categories (toxicity, severe_toxicity,
 * obscene, threat, insult, identity_attack) plus sexual_explicit.
 *
 * Soft-flag thresholds (configurable):
 *   - toxicity > 0.80  →  add "model_toxicity_high"
 *   - insult > 0.80    →  add "model_insult_high"
 *   - threat > 0.50    →  add "model_threat_high"   (lower bar — threats are rarer & more serious)
 *   - identity_attack > 0.50 → add "model_identity_attack_high"
 *
 * These flags do NOT prevent a submission from reaching human review.
 * They appear in the moderator dashboard and let human moderators
 * prioritize their queue (a "threat_high" submission is reviewed
 * before a "looks_fine" one).
 *
 * Failure mode: if the moderation model is unavailable, the worker
 * records `requiresHumanModeration: true` and `moderation_unavailable`
 * is set on the run. The submission still goes to human review.
 */
import { internalAction, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";

// Thresholds are deliberately conservative. The model will be wrong on
// some fraction of African-language text (toxic-bert is English-centric).
// High thresholds minimize false positives; missed positives are caught
// by humans, while false positives in our pipeline are amplified.
export const SOFT_FLAG_THRESHOLDS = {
    toxicity: 0.80,
    insult: 0.80,
    threat: 0.50,
    identityAttack: 0.50,
    sexual: 0.50,
} as const;

interface SoftFlag {
    flag: string;
    score: number;
    threshold: number;
}

/**
 * Map a ModerationScore to the set of soft flags it should produce.
 * Pure function — testable without a Convex runtime.
 */
export function deriveSoftFlags(score: {
    toxicity: number;
    insult: number;
    threat: number;
    identityAttack: number;
    sexual: number;
}): SoftFlag[] {
    const out: SoftFlag[] = [];
    if (score.toxicity > SOFT_FLAG_THRESHOLDS.toxicity) {
        out.push({ flag: "model_toxicity_high", score: score.toxicity, threshold: SOFT_FLAG_THRESHOLDS.toxicity });
    }
    if (score.insult > SOFT_FLAG_THRESHOLDS.insult) {
        out.push({ flag: "model_insult_high", score: score.insult, threshold: SOFT_FLAG_THRESHOLDS.insult });
    }
    if (score.threat > SOFT_FLAG_THRESHOLDS.threat) {
        out.push({ flag: "model_threat_high", score: score.threat, threshold: SOFT_FLAG_THRESHOLDS.threat });
    }
    if (score.identityAttack > SOFT_FLAG_THRESHOLDS.identityAttack) {
        out.push({ flag: "model_identity_attack_high", score: score.identityAttack, threshold: SOFT_FLAG_THRESHOLDS.identityAttack });
    }
    if (score.sexual > SOFT_FLAG_THRESHOLDS.sexual) {
        out.push({ flag: "model_sexual_high", score: score.sexual, threshold: SOFT_FLAG_THRESHOLDS.sexual });
    }
    return out;
}

// =============================================================================
// Storage helpers
// =============================================================================

export const recordModerationScore = internalMutation({
    args: {
        runId: v.id("changaProcessingRuns"),
        score: v.object({
            toxicity: v.number(),
            severeToxicity: v.number(),
            obscene: v.number(),
            threat: v.number(),
            insult: v.number(),
            identityAttack: v.number(),
            sexual: v.number(),
            model: v.string(),
            latencyMs: v.number(),
        }),
        softFlags: v.array(v.object({
            flag: v.string(),
            score: v.number(),
            threshold: v.number(),
        })),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.runId, {
            status: "completed",
            result: {
                score: args.score,
                softFlags: args.softFlags,
                requiresHumanModeration: true,
                modelVersion: args.score.model,
            },
            modelVersion: args.score.model,
            completedAt: Date.now(),
        });
        return args.runId;
    },
});

export const recordModerationUnavailable = internalMutation({
    args: {
        runId: v.id("changaProcessingRuns"),
        reason: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.runId, {
            status: "failed",
            error: args.reason,
            result: { requiresHumanModeration: true, moderationUnavailable: true },
            completedAt: Date.now(),
        });
        return args.runId;
    },
});

/**
 * Apply derived soft flags to a submission's qualityFlags array.
 * Soft flags are *additive* — they never remove existing flags and
 * never block routing to peer review (unlike HARD_QUALITY_FLAGS).
 */
export const applySoftFlags = internalMutation({
    args: {
        submissionId: v.id("changaSubmissions"),
        softFlags: v.array(v.object({
            flag: v.string(),
            score: v.number(),
            threshold: v.number(),
        })),
    },
    handler: async (ctx, args) => {
        const submission = await ctx.db.get(args.submissionId);
        if (!submission) throw new Error("Submission not found");
        const existing = submission.qualityFlags ?? [];
        const toAdd = args.softFlags.map((f) => f.flag).filter((f) => !existing.includes(f));
        if (toAdd.length === 0) return args.submissionId;
        await ctx.db.patch(args.submissionId, {
            qualityFlags: [...existing, ...toAdd],
            updatedAt: Date.now(),
        });
        return args.submissionId;
    },
});

// =============================================================================
// Public action: classify a single submission
// =============================================================================

/**
 * Classify a submission's text and record the result. Internal — only
 * callable from the Changa processing worker.
 *
 * Contract: this function NEVER rejects a submission. It records a
 * score and a set of soft flags; humans remain the only deciders.
 */
export const classifySubmissionText = internalAction({
    args: {
        runId: v.id("changaProcessingRuns"),
        submissionId: v.id("changaSubmissions"),
        text: v.string(),
    },
    handler: async (ctx, args): Promise<{ ok: boolean; reason?: string }> => {
        const text = args.text.trim().slice(0, 4000);
        if (text.length === 0) {
            // Empty text is not a moderation concern; record success with
            // no flags. Human review still happens via the existing pipeline.
            await ctx.runMutation(internal.changa.moderationClassifier.recordModerationScore, {
                runId: args.runId,
                score: {
                    toxicity: 0, severeToxicity: 0, obscene: 0, threat: 0,
                    insult: 0, identityAttack: 0, sexual: 0,
                    model: "none",
                    latencyMs: 0,
                },
                softFlags: [],
            });
            return { ok: true };
        }

        const { routeModeration } = await import("../lib/aiRouter");
        const result = await routeModeration({ text });
        if (result.usage) {
            const { usageToRecordArgs } = await import("../lib/aiUsage");
            const { internal: convexInternal } = await import("../_generated/api");
            try {
                await ctx.runMutation(
                    convexInternal.lib.aiUsage.recordUsage,
                    usageToRecordArgs(result.usage, result.provider, {
                        ok: result.ok,
                        errorCode: result.ok ? undefined : result.error.code,
                        subject: "changa-moderation",
                    }),
                );
            } catch (e) {
                console.error("[moderation] failed to record usage:", e);
            }
        }
        if (!result.ok) {
            await ctx.runMutation(internal.changa.moderationClassifier.recordModerationUnavailable, {
                runId: args.runId,
                reason: result.error.code,
            });
            // Soft-fail: do not block the submission. The worker still
            // routes to human review (requiresHumanModeration is true).
            return { ok: false, reason: result.error.code };
        }

        const softFlags = deriveSoftFlags(result.value);
        await ctx.runMutation(internal.changa.moderationClassifier.recordModerationScore, {
            runId: args.runId,
            score: result.value,
            softFlags,
        });
        if (softFlags.length > 0) {
            await ctx.runMutation(internal.changa.moderationClassifier.applySoftFlags, {
                submissionId: args.submissionId,
                softFlags,
            });
        }
        return { ok: true };
    },
});

// Re-export the threshold constants for observability / docs.
export const MODERATION_CONSTANTS = SOFT_FLAG_THRESHOLDS;
export type { Doc as ProcessingRun, Id as ProcessingRunId };
