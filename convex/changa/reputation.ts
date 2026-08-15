import { mutation, query, type MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, isModerator } from "../users/utils";
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

        await Promise.all(existing
            .filter((grant) => grant.status === "active")
            .map((grant) => ctx.db.patch(grant._id, { status: "revoked" })));

        return ctx.db.insert("changaRoleGrants", {
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
export async function recordValidationStats(
    ctx: { db: MutationCtx["db"] },
    userId: Id<"users">,
    params: { voteAccepted: boolean; agreesWithOutcome: boolean },
): Promise<Id<"changaUserStats"> | null> {
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
        await db.patch(stats._id, {
            validationCount,
            acceptRate,
            reviewAgreementRate,
            trustScore,
            lastActiveDate: new Date().toISOString().slice(0, 10),
        });
        return stats._id;
    }

    return db.insert("changaUserStats", {
        userId,
        contributionCount: 0,
        validationCount,
        acceptRate,
        reviewAgreementRate,
        trustScore,
        streakDays: 1,
        lastActiveDate: new Date().toISOString().slice(0, 10),
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