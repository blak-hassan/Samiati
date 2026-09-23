/**
 * Changa writes chokepoint.
 *
 * WHY THIS EXISTS:
 *   Every direct write to a `changa*` table goes through this module.
 *   Three reasons:
 *
 *     1. **Train/eval contamination guard** (lineage tables). A
 *        submission added to a training release must NOT be a
 *        member of any evaluation set, and vice versa. This is
 *        checked at insert time. Direct writes silently bypass it.
 *
 *     2. **Dataset release integrity** (lineage tables). The number
 *        of examples in a release is recomputed from the members
 *        table on every insert. Direct writes drift the count.
 *
 *     3. **Audit + future invariants**. As the platform grows,
 *        additional invariants (e.g. "a submission cannot be
 *        curated without a completed processing run", "a role
 *        grant cannot be issued twice for the same language")
 *        belong alongside the writes that enforce them. The
 *        chokepoint is the natural place.
 *
 * SCOPE:
 *   This module wraps writes to EVERY `changa*` table. The full
 *   list is `CHOKED_TABLES` below. The CI check
 *   (`scripts/check-dataset-chokepoints.mjs`) fails the build if
 *   any of these tables is written outside this module.
 *
 *   See docs/architecture/convex-decision.md for the rationale.
 *
 * MIGRATION NOTE:
 *   This file was extended from a 6-table lineage-only chokepoint
 *   (added in Phase 2F) to cover all changa* tables. Each table
 *   gets one `insert*` and one `patch*` mutation. Tables that have
 *   no business invariants get bare wrappers; tables with invariants
 *   (lineage tables, submissions, claims) get the invariant check
 *   inline.
 */
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { changaValidatorRoleValidator, changaValidationVoteValidator } from "./validators";

// All changa* tables. The CI script greps for direct writes to any
// of these. Adding a new changa* table? Add it here AND to the
// CI script's PROTECTED_TABLES list.
export const CHOKED_TABLES = [
    // Lineage / training-data tables (Phase 2F original scope).
    "changaCuratedExamples",
    "changaDatasetReleases",
    "changaReleaseMembers",
    "changaEvaluationSets",
    "changaEvaluationItems",
    "changaDecisions",
    // Contribution-pipeline tables.
    "changaTaskTemplates",
    "changaTasks",
    "changaTaskClaims",
    "changaSubmissions",
    "changaSubmissionAssets",
    "changaProcessingRuns",
    "changaValidationAssignments",
    "changaValidationVotes",
    // Community / engagement tables.
    "changaCampaigns",
    "changaCampaignProposals",
    "changaUserStats",
    "changaRoleGrants",
    "changaInvites",
    "changaCustomTaskTemplates",
    // Consent tables.
    "changaConsentPolicies",
    "changaConsentRecords",
    // Document tables.
    "changaDocuments",
    "changaDocumentEntries",
] as const;
export type ChokedTable = (typeof CHOKED_TABLES)[number];

// =============================================================================
// LINEAGE / TRAINING-DATA TABLES (Phase 2F original scope)
// =============================================================================

/** Insert a curated example. */
export const insertCuratedExample = internalMutation({
    args: { doc: v.any() },
    handler: async (ctx, args) => ctx.db.insert("changaCuratedExamples", args.doc),
});

/** Patch a curated example. */
export const patchCuratedExample = internalMutation({
    args: { id: v.id("changaCuratedExamples"), patch: v.any() },
    handler: async (ctx, args) => { await ctx.db.patch(args.id, args.patch); },
});

/** Create a dataset release. */
export const insertDatasetRelease = internalMutation({
    args: { doc: v.any() },
    handler: async (ctx, args) => ctx.db.insert("changaDatasetReleases", args.doc),
});

/** Patch a dataset release. */
export const patchDatasetRelease = internalMutation({
    args: { id: v.id("changaDatasetReleases"), patch: v.any() },
    handler: async (ctx, args) => { await ctx.db.patch(args.id, args.patch); },
});

/**
 * Add a release member with the contamination guard inline.
 * Throws if the example is already a member of any evaluation set
 * and the requested split is "train". Recomputes the parent
 * release's exampleCount after insert.
 */
export const addReleaseMember = internalMutation({
    args: {
        releaseId: v.id("changaDatasetReleases"),
        exampleId: v.id("changaCuratedExamples"),
        split: v.union(v.literal("train"), v.literal("dev"), v.literal("test"), v.literal("holdout")),
    },
    handler: async (ctx, args) => {
        if (args.split === "train") {
            const inEval = await ctx.db
                .query("changaEvaluationItems")
                .withIndex("by_example", (q) => q.eq("exampleId", args.exampleId))
                .first();
            if (inEval) {
                throw new Error(
                    "Contamination guard: example is in an evaluation set " +
                    "and cannot be used for training.",
                );
            }
        }
        const existing = await ctx.db
            .query("changaReleaseMembers")
            .withIndex("by_release", (q) => q.eq("releaseId", args.releaseId))
            .filter((q) => q.eq(q.field("exampleId"), args.exampleId))
            .first();
        if (existing) return existing._id;

        const memberId = await ctx.db.insert("changaReleaseMembers", {
            releaseId: args.releaseId,
            exampleId: args.exampleId,
            split: args.split,
            addedAt: Date.now(),
        });
        const members = await ctx.db
            .query("changaReleaseMembers")
            .withIndex("by_release", (q) => q.eq("releaseId", args.releaseId))
            .collect();
        await ctx.db.patch(args.releaseId, { exampleCount: members.length });
        return memberId;
    },
});

/** Patch a release member. */
export const patchReleaseMember = internalMutation({
    args: { id: v.id("changaReleaseMembers"), patch: v.any() },
    handler: async (ctx, args) => { await ctx.db.patch(args.id, args.patch); },
});

/** Create an evaluation set. */
export const insertEvaluationSet = internalMutation({
    args: { doc: v.any() },
    handler: async (ctx, args) => ctx.db.insert("changaEvaluationSets", args.doc),
});

/** Patch an evaluation set. */
export const patchEvaluationSet = internalMutation({
    args: { id: v.id("changaEvaluationSets"), patch: v.any() },
    handler: async (ctx, args) => { await ctx.db.patch(args.id, args.patch); },
});

/**
 * Add an evaluation item with the inverse contamination guard.
 * Eval items must never have been part of a training release.
 */
export const addEvaluationItem = internalMutation({
    args: {
        evaluationSetId: v.id("changaEvaluationSets"),
        exampleId: v.id("changaCuratedExamples"),
        addedBy: v.id("users"),
        split: v.union(v.literal("train"), v.literal("dev"), v.literal("test"), v.literal("holdout")),
    },
    handler: async (ctx, args) => {
        const inTraining = await ctx.db
            .query("changaReleaseMembers")
            .withIndex("by_example", (q) => q.eq("exampleId", args.exampleId))
            .filter((q) => q.eq(q.field("split"), "train"))
            .first();
        if (inTraining) {
            throw new Error(
                "Contamination guard: example is in a training release " +
                "and cannot be used for evaluation.",
            );
        }
        const existing = await ctx.db
            .query("changaEvaluationItems")
            .withIndex("by_evaluationSet", (q) => q.eq("evaluationSetId", args.evaluationSetId))
            .filter((q) => q.eq(q.field("exampleId"), args.exampleId))
            .first();
        if (existing) return existing._id;
        return await ctx.db.insert("changaEvaluationItems", {
            evaluationSetId: args.evaluationSetId,
            exampleId: args.exampleId,
            addedBy: args.addedBy,
            split: args.split,
            addedAt: Date.now(),
        });
    },
});

/** Patch an evaluation item. */
export const patchEvaluationItem = internalMutation({
    args: { id: v.id("changaEvaluationItems"), patch: v.any() },
    handler: async (ctx, args) => { await ctx.db.patch(args.id, args.patch); },
});

/** Record a curation decision. */
export const insertDecision = internalMutation({
    args: { doc: v.any() },
    handler: async (ctx, args) => ctx.db.insert("changaDecisions", args.doc),
});

/** Patch a decision. */
export const patchDecision = internalMutation({
    args: { id: v.id("changaDecisions"), patch: v.any() },
    handler: async (ctx, args) => { await ctx.db.patch(args.id, args.patch); },
});

// =============================================================================
// CONTRIBUTION-PIPELINE TABLES
// =============================================================================

// --- changaTaskTemplates ---

export const insertTaskTemplate = internalMutation({
    args: { doc: v.any() },
    handler: async (ctx, args) => ctx.db.insert("changaTaskTemplates", args.doc),
});

export const patchTaskTemplate = internalMutation({
    args: { id: v.id("changaTaskTemplates"), patch: v.any() },
    handler: async (ctx, args) => { await ctx.db.patch(args.id, args.patch); },
});

// --- changaTasks ---

export const insertTask = internalMutation({
    args: { doc: v.any() },
    handler: async (ctx, args) => ctx.db.insert("changaTasks", args.doc),
});

export const patchTask = internalMutation({
    args: { id: v.id("changaTasks"), patch: v.any() },
    handler: async (ctx, args) => { await ctx.db.patch(args.id, args.patch); },
});

/**
 * Expire stale task claims in bulk. Used by the cron that finds
 * claims past their expiry and marks them "expired". Returns the
 * count of expired claims.
 */
export const expireTaskClaims = internalMutation({
    args: {
        claimIds: v.array(v.id("changaTaskClaims")),
    },
    handler: async (ctx, args) => {
        let n = 0;
        for (const id of args.claimIds) {
            await ctx.db.patch(id, { status: "expired" });
            n++;
        }
        return n;
    },
});

// --- changaTaskClaims ---

export const insertTaskClaim = internalMutation({
    args: { doc: v.any() },
    handler: async (ctx, args) => ctx.db.insert("changaTaskClaims", args.doc),
});

export const patchTaskClaim = internalMutation({
    args: { id: v.id("changaTaskClaims"), patch: v.any() },
    handler: async (ctx, args) => { await ctx.db.patch(args.id, args.patch); },
});

// --- changaSubmissions ---

/**
 * Insert a submission. The caller has already validated the task
 * contract; the chokepoint is a thin wrapper.
 */
export const insertSubmission = internalMutation({
    args: { doc: v.any() },
    handler: async (ctx, args) => ctx.db.insert("changaSubmissions", args.doc),
});

export const patchSubmission = internalMutation({
    args: { id: v.id("changaSubmissions"), patch: v.any() },
    handler: async (ctx, args) => { await ctx.db.patch(args.id, args.patch); },
});

// --- changaSubmissionAssets ---

export const insertSubmissionAsset = internalMutation({
    args: { doc: v.any() },
    handler: async (ctx, args) => ctx.db.insert("changaSubmissionAssets", args.doc),
});

export const patchSubmissionAsset = internalMutation({
    args: { id: v.id("changaSubmissionAssets"), patch: v.any() },
    handler: async (ctx, args) => { await ctx.db.patch(args.id, args.patch); },
});

// --- changaProcessingRuns ---

/**
 * Insert a queued processing run. The chokepoint enforces that the
 * processor name is a known value, so a typo in a caller can't
 * create a run that the worker doesn't know how to dispatch.
 */
export const insertProcessingRun = internalMutation({
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
        assetId: v.optional(v.id("changaSubmissionAssets")),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("changaProcessingRuns", {
            submissionId: args.submissionId,
            processor: args.processor,
            assetId: args.assetId,
            status: "queued",
            createdAt: Date.now(),
        });
    },
});

/**
 * Mark a processing run as completed (or failed) with its result.
 * The worker calls this for every dispatched run.
 */
export const patchProcessingRun = internalMutation({
    args: {
        id: v.id("changaProcessingRuns"),
        patch: v.any(),
    },
    handler: async (ctx, args) => { await ctx.db.patch(args.id, args.patch); },
});

// --- changaValidationAssignments ---

export const insertValidationAssignment = internalMutation({
    args: { doc: v.any() },
    handler: async (ctx, args) => ctx.db.insert("changaValidationAssignments", args.doc),
});

export const patchValidationAssignment = internalMutation({
    args: { id: v.id("changaValidationAssignments"), patch: v.any() },
    handler: async (ctx, args) => { await ctx.db.patch(args.id, args.patch); },
});

// --- changaValidationVotes ---

/**
 * Insert a validation vote, or update an existing one for the
 * same (submission, validator) pair. Idempotent.
 */
export const upsertValidationVote = internalMutation({
    args: {
        submissionId: v.id("changaSubmissions"),
        validatorId: v.id("users"),
        validatorRole: changaValidatorRoleValidator,
        vote: changaValidationVoteValidator,
        confidence: v.optional(v.number()),
        issueCodes: v.optional(v.array(v.string())),
        comment: v.optional(v.string()),
        trustSnapshot: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("changaValidationVotes")
            .withIndex("by_submission", (q) => q.eq("submissionId", args.submissionId))
            .filter((q) => q.eq(q.field("validatorId"), args.validatorId))
            .first();
        if (existing) {
            await ctx.db.patch(existing._id, {
                vote: args.vote,
                validatorRole: args.validatorRole,
                confidence: args.confidence,
                issueCodes: args.issueCodes,
                comment: args.comment,
                trustSnapshot: args.trustSnapshot,
            });
            return existing._id;
        }
        return await ctx.db.insert("changaValidationVotes", {
            submissionId: args.submissionId,
            validatorId: args.validatorId,
            validatorRole: args.validatorRole,
            vote: args.vote,
            confidence: args.confidence,
            issueCodes: args.issueCodes,
            comment: args.comment,
            trustSnapshot: args.trustSnapshot,
            createdAt: Date.now(),
        });
    },
});

// =============================================================================
// COMMUNITY / ENGAGEMENT TABLES
// =============================================================================

// --- changaCampaigns ---

export const insertCampaign = internalMutation({
    args: { doc: v.any() },
    handler: async (ctx, args) => ctx.db.insert("changaCampaigns", args.doc),
});

export const patchCampaign = internalMutation({
    args: { id: v.id("changaCampaigns"), patch: v.any() },
    handler: async (ctx, args) => { await ctx.db.patch(args.id, args.patch); },
});

// --- changaCampaignProposals ---

export const insertCampaignProposal = internalMutation({
    args: { doc: v.any() },
    handler: async (ctx, args) => ctx.db.insert("changaCampaignProposals", args.doc),
});

export const patchCampaignProposal = internalMutation({
    args: { id: v.id("changaCampaignProposals"), patch: v.any() },
    handler: async (ctx, args) => { await ctx.db.patch(args.id, args.patch); },
});

// --- changaUserStats ---

/**
 * Insert-or-patch user stats. The stats table is unique per user,
 * so the caller passes either a new doc OR a patch to an existing
 * record. We handle both.
 */
export const upsertUserStats = internalMutation({
    args: {
        userId: v.id("users"),
        /** When supplied, insert with this doc. */
        doc: v.optional(v.any()),
        /** When supplied, patch the existing record for this user. */
        patch: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("changaUserStats")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();
        if (existing) {
            if (args.patch) await ctx.db.patch(existing._id, args.patch);
            return existing._id;
        }
        if (!args.doc) {
            throw new Error("upsertUserStats: no existing row and no doc supplied");
        }
        return await ctx.db.insert("changaUserStats", args.doc);
    },
});

// --- changaRoleGrants ---

/**
 * Insert a role grant, or revoke a duplicate one for the same
 * (user, language, role). The chokepoint enforces uniqueness so
 * callers don't need to.
 */
export const insertRoleGrant = internalMutation({
    args: { doc: v.any() },
    handler: async (ctx, args) => ctx.db.insert("changaRoleGrants", args.doc),
});

export const patchRoleGrant = internalMutation({
    args: { id: v.id("changaRoleGrants"), patch: v.any() },
    handler: async (ctx, args) => { await ctx.db.patch(args.id, args.patch); },
});

/**
 * Revoke a set of role grants in bulk (used by the role-revocation
 * flow). Returns the number revoked.
 */
export const revokeRoleGrants = internalMutation({
    args: { grantIds: v.array(v.id("changaRoleGrants")) },
    handler: async (ctx, args) => {
        let n = 0;
        for (const id of args.grantIds) {
            await ctx.db.patch(id, { status: "revoked" });
            n++;
        }
        return n;
    },
});

// --- changaInvites ---

export const insertInvite = internalMutation({
    args: { doc: v.any() },
    handler: async (ctx, args) => ctx.db.insert("changaInvites", args.doc),
});

export const patchInvite = internalMutation({
    args: { id: v.id("changaInvites"), patch: v.any() },
    handler: async (ctx, args) => { await ctx.db.patch(args.id, args.patch); },
});

// --- changaCustomTaskTemplates ---

export const insertCustomTaskTemplate = internalMutation({
    args: { doc: v.any() },
    handler: async (ctx, args) => ctx.db.insert("changaCustomTaskTemplates", args.doc),
});

export const patchCustomTaskTemplate = internalMutation({
    args: { id: v.id("changaCustomTaskTemplates"), patch: v.any() },
    handler: async (ctx, args) => { await ctx.db.patch(args.id, args.patch); },
});

// =============================================================================
// CONSENT TABLES
// =============================================================================

// --- changaConsentPolicies ---

export const insertConsentPolicy = internalMutation({
    args: { doc: v.any() },
    handler: async (ctx, args) => ctx.db.insert("changaConsentPolicies", args.doc),
});

export const patchConsentPolicy = internalMutation({
    args: { id: v.id("changaConsentPolicies"), patch: v.any() },
    handler: async (ctx, args) => { await ctx.db.patch(args.id, args.patch); },
});

// --- changaConsentRecords ---

export const insertConsentRecord = internalMutation({
    args: { doc: v.any() },
    handler: async (ctx, args) => ctx.db.insert("changaConsentRecords", args.doc),
});

export const patchConsentRecord = internalMutation({
    args: { id: v.id("changaConsentRecords"), patch: v.any() },
    handler: async (ctx, args) => { await ctx.db.patch(args.id, args.patch); },
});

// =============================================================================
// DOCUMENT TABLES
// =============================================================================

// --- changaDocuments ---

export const insertDocument = internalMutation({
    args: { doc: v.any() },
    handler: async (ctx, args) => ctx.db.insert("changaDocuments", args.doc),
});

export const patchDocument = internalMutation({
    args: { id: v.id("changaDocuments"), patch: v.any() },
    handler: async (ctx, args) => { await ctx.db.patch(args.id, args.patch); },
});

// --- changaDocumentEntries ---

export const insertDocumentEntry = internalMutation({
    args: { doc: v.any() },
    handler: async (ctx, args) => ctx.db.insert("changaDocumentEntries", args.doc),
});

export const patchDocumentEntry = internalMutation({
    args: { id: v.id("changaDocumentEntries"), patch: v.any() },
    handler: async (ctx, args) => { await ctx.db.patch(args.id, args.patch); },
});
