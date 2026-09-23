/**
 * Typed wrapper over the dataset-write chokepoint.
 *
 * The chokepoint itself (`convex/changa/datasetWrites.ts`) defines its
 * mutations with `args: { doc: v.any() }` / `{ id, patch: v.any() }`
 * so callers don't have to restate the per-table field types. The
 * trade-off: in this worktree the generated `_generated/api.d.ts`
 * does not yet include the chokepoint module, so the
 * `internal.changa.datasetWrites.*` references resolve to `any`.
 * That cascades into `TS7022/TS7023` (implicit any return) on every
 * caller.
 *
 * This wrapper casts the chokepoint module to a narrow function
 * shape once, at module load, so each wrapper has a concrete
 * (non-recursive) return type. The cast is contained to this file
 * (not exported, not aliased to `internal`), so other modules
 * importing `internal` from `_generated/api` are unaffected.
 *
 * Runtime behavior is identical to calling the chokepoint directly.
 *
 * When `npx convex dev` regenerates `_generated/api.d.ts` and the
 * chokepoint's own types are visible, callers can call the chokepoint
 * directly. This wrapper can be deleted at that point.
 */
import { internal } from "../_generated/api";
import type { ActionCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/**
 * Minimal `ctx` shape accepted by the wrappers. Both `MutationCtx`
 * and `ActionCtx` (and the partial `{ db; runMutation }` shapes used
 * by some helpers in this codebase) satisfy this. Accepting the
 * minimal shape means helpers like `recordValidationStats` can call
 * into the chokepoint without TS rejecting the narrower ctx type.
 */
type ChokepointCtx = MutationCtx | ActionCtx | {
    runMutation: MutationCtx["runMutation"] | ActionCtx["runMutation"];
};

type ChokepointFn = (args: never) => Promise<unknown>;
type ChokepointModule = Record<string, ChokepointFn>;

/**
 * Cast the chokepoint module to a narrow, function-shaped type. Each
 * entry is opaque to TypeScript; we only access the right one at
 * each call site via `Object.create` / property access, which
 * doesn't re-trigger the deep-instantiation cycle that
 * `Parameters<typeof CW[key]>` does.
 */
const CW = internal.changa.datasetWrites as unknown as ChokepointModule;

function run(ctx: ChokepointCtx, key: string, args: object): Promise<unknown> {
    return ctx.runMutation(
        CW[key] as unknown as Parameters<typeof ctx.runMutation>[0],
        args as Parameters<typeof ctx.runMutation>[1],
    );
}

export const chokepoint = {
    insertCuratedExample: (ctx: ChokepointCtx, doc: object) =>
        run(ctx, "insertCuratedExample", { doc }) as Promise<Id<"changaCuratedExamples">>,
    patchCuratedExample: (ctx: ChokepointCtx, id: Id<"changaCuratedExamples">, patch: object) =>
        run(ctx, "patchCuratedExample", { id, patch }) as Promise<Id<"changaCuratedExamples">>,

    insertDatasetRelease: (ctx: ChokepointCtx, doc: object) =>
        run(ctx, "insertDatasetRelease", { doc }) as Promise<Id<"changaDatasetReleases">>,
    patchDatasetRelease: (ctx: ChokepointCtx, id: Id<"changaDatasetReleases">, patch: object) =>
        run(ctx, "patchDatasetRelease", { id, patch }) as Promise<Id<"changaDatasetReleases">>,

    addReleaseMember: (ctx: ChokepointCtx, args: {
        releaseId: Id<"changaDatasetReleases">;
        exampleId: Id<"changaCuratedExamples">;
        split: "train" | "dev" | "test" | "holdout";
    }) => run(ctx, "addReleaseMember", args) as Promise<Id<"changaReleaseMembers">>,
    patchReleaseMember: (ctx: ChokepointCtx, id: Id<"changaReleaseMembers">, patch: object) =>
        run(ctx, "patchReleaseMember", { id, patch }) as Promise<Id<"changaReleaseMembers">>,

    insertEvaluationSet: (ctx: ChokepointCtx, doc: object) =>
        run(ctx, "insertEvaluationSet", { doc }) as Promise<Id<"changaEvaluationSets">>,
    patchEvaluationSet: (ctx: ChokepointCtx, id: Id<"changaEvaluationSets">, patch: object) =>
        run(ctx, "patchEvaluationSet", { id, patch }) as Promise<Id<"changaEvaluationSets">>,

    addEvaluationItem: (ctx: ChokepointCtx, args: {
        evaluationSetId: Id<"changaEvaluationSets">;
        exampleId: Id<"changaCuratedExamples">;
        addedBy: Id<"users">;
        split: "train" | "dev" | "test" | "holdout";
    }) => run(ctx, "addEvaluationItem", args) as Promise<Id<"changaEvaluationItems">>,
    patchEvaluationItem: (ctx: ChokepointCtx, id: Id<"changaEvaluationItems">, patch: object) =>
        run(ctx, "patchEvaluationItem", { id, patch }) as Promise<Id<"changaEvaluationItems">>,

    insertDecision: (ctx: ChokepointCtx, doc: object) =>
        run(ctx, "insertDecision", { doc }) as Promise<Id<"changaDecisions">>,
    patchDecision: (ctx: ChokepointCtx, id: Id<"changaDecisions">, patch: object) =>
        run(ctx, "patchDecision", { id, patch }) as Promise<Id<"changaDecisions">>,

    insertTaskTemplate: (ctx: ChokepointCtx, doc: object) =>
        run(ctx, "insertTaskTemplate", { doc }) as Promise<Id<"changaTaskTemplates">>,
    patchTaskTemplate: (ctx: ChokepointCtx, id: Id<"changaTaskTemplates">, patch: object) =>
        run(ctx, "patchTaskTemplate", { id, patch }) as Promise<Id<"changaTaskTemplates">>,

    insertTask: (ctx: ChokepointCtx, doc: object) =>
        run(ctx, "insertTask", { doc }) as Promise<Id<"changaTasks">>,
    patchTask: (ctx: ChokepointCtx, id: Id<"changaTasks">, patch: object) =>
        run(ctx, "patchTask", { id, patch }) as Promise<Id<"changaTasks">>,

    insertTaskClaim: (ctx: ChokepointCtx, doc: object) =>
        run(ctx, "insertTaskClaim", { doc }) as Promise<Id<"changaTaskClaims">>,
    patchTaskClaim: (ctx: ChokepointCtx, id: Id<"changaTaskClaims">, patch: object) =>
        run(ctx, "patchTaskClaim", { id, patch }) as Promise<Id<"changaTaskClaims">>,
    expireTaskClaims: (ctx: ChokepointCtx, claimIds: Id<"changaTaskClaims">[]) =>
        run(ctx, "expireTaskClaims", { claimIds }) as Promise<Id<"changaTaskClaims">>,

    insertSubmission: (ctx: ChokepointCtx, doc: object) =>
        run(ctx, "insertSubmission", { doc }) as Promise<Id<"changaSubmissions">>,
    patchSubmission: (ctx: ChokepointCtx, id: Id<"changaSubmissions">, patch: object) =>
        run(ctx, "patchSubmission", { id, patch }) as Promise<Id<"changaSubmissions">>,

    insertSubmissionAsset: (ctx: ChokepointCtx, doc: object) =>
        run(ctx, "insertSubmissionAsset", { doc }) as Promise<Id<"changaSubmissionAssets">>,
    patchSubmissionAsset: (ctx: ChokepointCtx, id: Id<"changaSubmissionAssets">, patch: object) =>
        run(ctx, "patchSubmissionAsset", { id, patch }) as Promise<Id<"changaSubmissionAssets">>,

    insertProcessingRun: (ctx: ChokepointCtx, args: {
        submissionId: Id<"changaSubmissions">;
        processor: "basic_task_check" | "audio_quality" | "asr" | "language_id" | "duplicate_detection" | "moderation";
        assetId?: Id<"changaSubmissionAssets">;
    }) => run(ctx, "insertProcessingRun", args) as Promise<Id<"changaProcessingRuns">>,
    patchProcessingRun: (ctx: ChokepointCtx, id: Id<"changaProcessingRuns">, patch: object) =>
        run(ctx, "patchProcessingRun", { id, patch }) as Promise<Id<"changaProcessingRuns">>,

    insertValidationAssignment: (ctx: ChokepointCtx, doc: object) =>
        run(ctx, "insertValidationAssignment", { doc }) as Promise<Id<"changaValidationAssignments">>,
    patchValidationAssignment: (ctx: ChokepointCtx, id: Id<"changaValidationAssignments">, patch: object) =>
        run(ctx, "patchValidationAssignment", { id, patch }) as Promise<Id<"changaValidationAssignments">>,

    upsertValidationVote: (ctx: ChokepointCtx, args: {
        submissionId: Id<"changaSubmissions">;
        validatorId: Id<"users">;
        validatorRole: "peer" | "moderator" | "expert";
        vote: "accept" | "minor_fix" | "reject" | "duplicate" | "unsafe" | "unclear_audio" | "wrong_language";
        confidence?: number;
        issueCodes?: string[];
        comment?: string;
        trustSnapshot?: number;
    }) => run(ctx, "upsertValidationVote", args) as Promise<Id<"changaValidationVotes">>,

    insertCampaign: (ctx: ChokepointCtx, doc: object) =>
        run(ctx, "insertCampaign", { doc }) as Promise<Id<"changaCampaigns">>,
    patchCampaign: (ctx: ChokepointCtx, id: Id<"changaCampaigns">, patch: object) =>
        run(ctx, "patchCampaign", { id, patch }) as Promise<Id<"changaCampaigns">>,

    insertCampaignProposal: (ctx: ChokepointCtx, doc: object) =>
        run(ctx, "insertCampaignProposal", { doc }) as Promise<Id<"changaCampaignProposals">>,
    patchCampaignProposal: (ctx: ChokepointCtx, id: Id<"changaCampaignProposals">, patch: object) =>
        run(ctx, "patchCampaignProposal", { id, patch }) as Promise<Id<"changaCampaignProposals">>,

    upsertUserStats: (ctx: ChokepointCtx, args: {
        userId: Id<"users">;
        doc?: object;
        patch?: object;
    }) => run(ctx, "upsertUserStats", args) as Promise<Id<"changaUserStats"> | null>,

    insertRoleGrant: (ctx: ChokepointCtx, doc: object) =>
        run(ctx, "insertRoleGrant", { doc }) as Promise<Id<"changaRoleGrants">>,
    patchRoleGrant: (ctx: ChokepointCtx, id: Id<"changaRoleGrants">, patch: object) =>
        run(ctx, "patchRoleGrant", { id, patch }) as Promise<Id<"changaRoleGrants">>,
    revokeRoleGrants: (ctx: ChokepointCtx, grantIds: Id<"changaRoleGrants">[]) =>
        run(ctx, "revokeRoleGrants", { grantIds }) as Promise<Id<"changaRoleGrants">>,

    insertInvite: (ctx: ChokepointCtx, doc: object) =>
        run(ctx, "insertInvite", { doc }) as Promise<Id<"changaInvites">>,
    patchInvite: (ctx: ChokepointCtx, id: Id<"changaInvites">, patch: object) =>
        run(ctx, "patchInvite", { id, patch }) as Promise<Id<"changaInvites">>,

    insertConsentPolicy: (ctx: ChokepointCtx, doc: object) =>
        run(ctx, "insertConsentPolicy", { doc }) as Promise<Id<"changaConsentPolicies">>,
    patchConsentPolicy: (ctx: ChokepointCtx, id: Id<"changaConsentPolicies">, patch: object) =>
        run(ctx, "patchConsentPolicy", { id, patch }) as Promise<Id<"changaConsentPolicies">>,

    insertConsentRecord: (ctx: ChokepointCtx, doc: object) =>
        run(ctx, "insertConsentRecord", { doc }) as Promise<Id<"changaConsentRecords">>,
    patchConsentRecord: (ctx: ChokepointCtx, id: Id<"changaConsentRecords">, patch: object) =>
        run(ctx, "patchConsentRecord", { id, patch }) as Promise<Id<"changaConsentRecords">>,

    insertDocument: (ctx: ChokepointCtx, doc: object) =>
        run(ctx, "insertDocument", { doc }) as Promise<Id<"changaDocuments">>,
    patchDocument: (ctx: ChokepointCtx, id: Id<"changaDocuments">, patch: object) =>
        run(ctx, "patchDocument", { id, patch }) as Promise<Id<"changaDocuments">>,

    insertDocumentEntry: (ctx: ChokepointCtx, doc: object) =>
        run(ctx, "insertDocumentEntry", { doc }) as Promise<Id<"changaDocumentEntries">>,
    patchDocumentEntry: (ctx: ChokepointCtx, id: Id<"changaDocumentEntries">, patch: object) =>
        run(ctx, "patchDocumentEntry", { id, patch }) as Promise<Id<"changaDocumentEntries">>,

    insertCustomTaskTemplate: (ctx: ChokepointCtx, doc: object) =>
        run(ctx, "insertCustomTaskTemplate", { doc }) as Promise<Id<"changaCustomTaskTemplates">>,
    patchCustomTaskTemplate: (ctx: ChokepointCtx, id: Id<"changaCustomTaskTemplates">, patch: object) =>
        run(ctx, "patchCustomTaskTemplate", { id, patch }) as Promise<Id<"changaCustomTaskTemplates">>,
};
