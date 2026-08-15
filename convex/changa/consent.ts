import { mutation, query, type MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, isModerator } from "../users/utils";
import { changaConsentScopeValidator } from "./validators";
import type { Doc, Id } from "../_generated/dataModel";

// Fallback policy version used when no published consent policy exists yet in
// the changaConsentPolicies table. The published policy becomes authoritative
// once a data steward publishes it.
export const FALLBACK_CONSENT_POLICY_VERSION = "changa-pilot-v1";

// Plain helper used by the submission pipeline: persists a versioned consent
// record for a submission without double-writing.
export async function insertConsentRecord(
    db: MutationCtx["db"],
    record: {
        userId: Id<"users">;
        submissionId: Id<"changaSubmissions">;
        policyVersion: string;
        scopes: Array<"collection_storage" | "training" | "research" | "commercial_use" | "public_release" | "voice_use">;
        attributionPreference: "public" | "private" | "pseudonymous";
    },
): Promise<Id<"changaConsentRecords">> {
    const existing = await db.query("changaConsentRecords")
        .withIndex("by_user_submission", (q) =>
            q.eq("userId", record.userId).eq("submissionId", record.submissionId),
        )
        .first();
    if (existing) return existing._id;

    return db.insert("changaConsentRecords", {
        ...record,
        grantedAt: Date.now(),
    });
}

// Publish or update a versioned consent policy (data steward / moderator only).
export const publishConsentPolicy = mutation({
    args: {
        policyVersion: v.string(),
        summaryText: v.string(),
        fullText: v.string(),
        requiredScopes: v.array(changaConsentScopeValidator),
        effectiveAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized: Only moderators can publish consent policies");
        }

        const version = args.policyVersion.trim().slice(0, 100);
        const existing = await ctx.db.query("changaConsentPolicies")
            .withIndex("by_policyVersion", (q) => q.eq("policyVersion", version))
            .unique();
        if (existing) {
            throw new Error("A consent policy with this version already exists");
        }

        const policyId = await ctx.db.insert("changaConsentPolicies", {
            policyVersion: version,
            effectiveAt: args.effectiveAt ?? Date.now(),
            summaryText: args.summaryText.trim().slice(0, 4000),
            fullText: args.fullText.trim().slice(0, 20000),
            requiredScopes: args.requiredScopes,
            isActive: true,
            createdBy: user._id,
            createdAt: Date.now(),
        });

        return policyId;
    },
});

// The active published policy, or null when the pilot fallback is in effect.
export const getActiveConsentPolicy = query({
    args: {},
    handler: async (ctx) => {
        const policy = await ctx.db.query("changaConsentPolicies")
            .withIndex("by_isActive", (q) => q.eq("isActive", true))
            .order("desc")
            .first();
        return policy ?? null;
    },
});

// Record a granted consent snapshot for a submission. The record names the
// policy version and scopes the contributor actually agreed to, so consent is
// never inferred from a stale checkbox.
export const recordConsent = mutation({
    args: {
        submissionId: v.id("changaSubmissions"),
        policyVersion: v.string(),
        scopes: v.array(changaConsentScopeValidator),
        attributionPreference: v.union(
            v.literal("public"),
            v.literal("private"),
            v.literal("pseudonymous"),
        ),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const submission = await ctx.db.get(args.submissionId);
        if (!submission) throw new Error("Submission not found");
        if (submission.userId !== user._id) throw new Error("Unauthorized");

        const existing = await ctx.db.query("changaConsentRecords")
            .withIndex("by_user_submission", (q) =>
                q.eq("userId", user._id).eq("submissionId", args.submissionId),
            )
            .first();
        if (existing) return existing._id;

        return ctx.db.insert("changaConsentRecords", {
            userId: user._id,
            submissionId: args.submissionId,
            policyVersion: args.policyVersion,
            scopes: args.scopes,
            attributionPreference: args.attributionPreference,
            grantedAt: Date.now(),
        });
    },
});

// Revoke consent for a submission. The record keeps the original grant for
// auditability and marks revocation; the linked submission is withdrawn from
// any future allocation or export.
export const revokeConsent = mutation({
    args: {
        submissionId: v.id("changaSubmissions"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const submission = (await ctx.db.get(args.submissionId)) as Doc<"changaSubmissions"> | null;
        if (!submission) throw new Error("Submission not found");
        if (submission.userId !== user._id) throw new Error("Unauthorized");

        const record = await ctx.db.query("changaConsentRecords")
            .withIndex("by_user_submission", (q) =>
                q.eq("userId", user._id).eq("submissionId", args.submissionId),
            )
            .first();
        if (record && !record.revokedAt) {
            await ctx.db.patch(record._id, { revokedAt: Date.now() });
        }

        if (submission.status !== "withdrawn") {
            await ctx.db.patch(args.submissionId, {
                status: "withdrawn",
                withdrawnAt: Date.now(),
                updatedAt: Date.now(),
            });
        }

        return args.submissionId;
    },
});

export type ConsentRecord = Doc<"changaConsentRecords">;
export type ConsentPolicy = Doc<"changaConsentPolicies">;
export type ConsentPolicyId = Id<"changaConsentPolicies">;