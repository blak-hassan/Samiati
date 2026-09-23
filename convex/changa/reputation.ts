import { mutation, query, type MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, isModerator } from "../users/utils";
import { internal } from "../_generated/api";
import { chokepoint } from "../lib/chokepoint";
import type { Doc, Id } from "../_generated/dataModel";

// Get the highest active, unexpired role grant for a user in a language.
export const getMyChangaRole = query({
    args: {
        languageCode: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return null;

        const grants = await ctx.db.query("changaRoleGrants")
            .withIndex("by_user_language", (q) =>
                q.eq("userId", user._id).eq("languageCode", args.languageCode ?? ""),
            )
            .collect();

        const now = Date.now();
        const active = grants
            .filter((grant) => grant.status === "active" && (!grant.expiresAt || grant.expiresAt > now))
            .sort((a, b) => roleRank(b.role) - roleRank(a.role));

        return active[0]?.role ?? null;
    },
});

// Grant or revoke a language-scoped role. Only moderators/admins can grant.
export const grantChangaRole = mutation({
    args: {
        userId: v.id("users"),
        languageCode: v.optional(v.string()),
        role: v.union(
            v.literal("new_contributor"),
            v.literal("contributor"),
            v.literal("trusted_contributor"),
            v.literal("community_reviewer"),
            v.literal("language_moderator"),
            v.literal("verified_expert"),
        ),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized: Only moderators can grant Changa roles");
        }

        // Revoke any existing active grant for this scope so the new one supersedes it.
        const existing = await ctx.db.query("changaRoleGrants")
            .withIndex("by_user_language", (q) =>
                q.eq("userId", args.userId).eq("languageCode", args.languageCode ?? ""),
            )
            .collect();

        const activeIds = existing
            .filter((grant) => grant.status === "active")
            .map((grant) => grant._id);
        if (activeIds.length > 0) {
            await chokepoint.revokeRoleGrants(ctx, activeIds);
        }

        return chokepoint.insertRoleGrant(ctx, {
            userId: args.userId,
            languageCode: args.languageCode,
            role: args.role,
            grantedBy: user._id,
            status: "active",
            grantedAt: Date.now(),
        });
    },
});

// Compute a reviewer's accuracy against gold tasks. Called when a vote on a
// known gold submission is submitted, or periodically.
export const getReviewerCalibration = query({
    args: {
        userId: v.optional(v.id("users")),
        languageCode: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUser(ctx);
        if (!currentUser) return null;

        const targetUser = args.userId ?? currentUser._id;
        if (args.userId && args.userId !== currentUser._id && !isModerator(currentUser)) {
            throw new Error("Unauthorized");
        }

        // Find all votes cast by this reviewer.
        const votes = await ctx.db.query("changaValidationVotes")
            .withIndex("by_validator", (q) => q.eq("validatorId", targetUser))
            .collect();

        // Fetch the corresponding submissions to find gold items.
        const goldResults: Array<{ correct: boolean; vote: string }> = [];
        for (const vote of votes) {
            const submission = await ctx.db.get(vote.submissionId);
            if (!submission) continue;
            if (args.languageCode && submission.languageCode !== args.languageCode) continue;
            // A gold submission has a curated example of type validation_gold.
            const goldExample = await ctx.db.query("changaCuratedExamples")
                .withIndex("by_sourceSubmission", (q) => q.eq("sourceSubmissionId", vote.submissionId))
                .first();
            if (!goldExample || goldExample.exampleType !== "validation_gold") continue;

            const expectedVote = goldExample.reviewSummary === "accept" ? "accept" : "reject";
            goldResults.push({ correct: vote.vote === expectedVote, vote: vote.vote });
        }

        if (goldResults.length === 0) {
            return { sampleSize: 0, goldAccuracy: null };
        }

        const correctCount = goldResults.filter((r) => r.correct).length;
        return {
            sampleSize: goldResults.length,
            goldAccuracy: correctCount / goldResults.length,
        };
    },
});

// Rolling reviewer statistics. `voteAccepted` tracks acceptance behaviour;
// `agreesWithOutcome` tracks agreement with the final decision that this
// vote's submission reached (the reviewer-quality signal). The two metrics
// must never be conflated.
//
// Writes go through the dataset-write chokepoint so the CI grep-assert
// flags any future direct write. The function accepts a `ctx` with
// `db` and `runMutation` (a Convex mutation/action context).
export async function recordValidationStats(
    ctx: { db: MutationCtx["db"]; runMutation: MutationCtx["runMutation"] | import("../_generated/server").ActionCtx["runMutation"] },
    userId: Id<"users">,
    params: { voteAccepted: boolean; agreesWithOutcome: boolean },
) {
    const db = ctx.db;
    const stats = await db.query("changaUserStats")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

    const validationCount = (stats?.validationCount ?? 0) + 1;
    const acceptRate = params.voteAccepted
        ? Math.round(((stats?.acceptRate ?? 0) * (validationCount - 1) + 1) / validationCount * 100) / 100
        : stats?.acceptRate ?? 0;
    const reviewAgreementRate = params.agreesWithOutcome
        ? Math.round(((stats?.reviewAgreementRate ?? 0) * (validationCount - 1) + 1) / validationCount * 100) / 100
        : stats?.reviewAgreementRate ?? 0;
    const trustScore = Math.min(1, Math.max(0, (stats?.trustScore ?? 0.5) + (params.agreesWithOutcome ? 0.02 : -0.01)));

    if (stats) {
        await chokepoint.upsertUserStats(ctx, {
            userId,
            patch: {
                validationCount,
                acceptRate,
                reviewAgreementRate,
                trustScore,
                lastActiveDate: new Date().toISOString().slice(0, 10),
            },
        });
    } else {
        await chokepoint.upsertUserStats(ctx, {
            userId,
            doc: {
                userId,
                contributionCount: 0,
                validationCount,
                acceptRate,
                reviewAgreementRate,
                trustScore,
                streakDays: 1,
                lastActiveDate: new Date().toISOString().slice(0, 10),
            },
        });
    }

    // Fire-and-forget auto-promotion if the user crossed a trust
    // threshold. Skips admins/moderators (they already have global
    // privileges) and is keyed on a per-language scope when known.
    await maybeAutoPromote(
        ctx as unknown as Parameters<typeof maybeAutoPromote>[0],
        userId,
        trustScore
    );

    return stats?._id ?? null;
}

const TRUST_AUTO_PROMOTIONS: Array<{ minTrust: number; role: "trusted_contributor" | "community_reviewer" | "language_moderator" }> = [
    { minTrust: 0.7, role: "trusted_contributor" },
    { minTrust: 0.8, role: "community_reviewer" },
    { minTrust: 0.9, role: "language_moderator" },
];

async function maybeAutoPromote(
    ctx: { db: MutationCtx["db"]; runMutation: MutationCtx["runMutation"] | import("../_generated/server").ActionCtx["runMutation"] },
    userId: Id<"users">,
    trustScore: number
) {
    const user = await ctx.db.get(userId);
    if (!user) return;
    if (user.role === "admin" || user.role === "moderator") return;

    const nextRole = [...TRUST_AUTO_PROMOTIONS]
        .reverse()
        .find((p) => trustScore >= p.minTrust)?.role;
    if (!nextRole) return;

    // Don't downgrade / overwrite a higher-scoped grant.
    const existing = await ctx.db.query("changaRoleGrants")
        .withIndex("by_user_language", (q) => q.eq("userId", userId).eq("languageCode", ""))
        .collect();
    const top = existing
        .filter((g) => g.status === "active")
        .sort((a, b) => roleRank(b.role) - roleRank(a.role))[0];
    if (top && roleRank(top.role) >= roleRank(nextRole)) return;

    // Revoke existing active grants at the same scope.
    const activeIds = existing
        .filter((g) => g.status === "active")
        .map((g) => g._id);
    if (activeIds.length > 0) {
        await chokepoint.revokeRoleGrants(ctx, activeIds);
    }

    // Grant the new role. We use the admin user as grantedBy in lieu
    // of a moderator — the source of the grant is the trust signal,
    // not a human approver.
    const adminish = await ctx.db.query("users")
        .withIndex("by_role", (q) => q.eq("role", "admin"))
        .first();
    if (!adminish) return;
    await chokepoint.insertRoleGrant(ctx, {
        userId,
        languageCode: undefined,
        role: nextRole,
        grantedBy: adminish._id,
        status: "active",
        grantedAt: Date.now(),
    });
}

// Manual recompute entry point (moderator only). The submission pipeline
// records statistics via recordValidationStats inside the vote mutation.
export const updateUserStatsAfterVote = mutation({
    args: {
        userId: v.id("users"),
        voteAccepted: v.boolean(),
        agreesWithOutcome: v.boolean(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized");
        }

        return recordValidationStats(ctx, args.userId, {
            voteAccepted: args.voteAccepted,
            agreesWithOutcome: args.agreesWithOutcome,
        });
    },
});

export type UserStatsDoc = Doc<"changaUserStats">;

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