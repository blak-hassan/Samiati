import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";
import type { Doc } from "../_generated/dataModel";

// Fields to strip from public profiles
const SENSITIVE_FIELDS = ["email", "clerkId", "moderatorStatus"] as const;

function sanitizeUser(user: Record<string, unknown>) {
    const sanitized = { ...user };
    for (const field of SENSITIVE_FIELDS) {
        sanitized[field] = undefined;
    }
    return sanitized;
}

// Product spec §17 — contributor titles. Progression depends on verified
// volume AND quality (acceptance rate), not volume alone.
export const CONTRIBUTOR_LEVELS = [
    "Explorer",
    "Contributor",
    "Language Builder",
    "Translator",
    "Language Advocate",
    "Language Specialist",
    "Language Keeper",
    "Cultural Archivist",
    "Community Expert",
    "Language Steward",
] as const;

// How many verified contributions it takes to reach each level (beyond 1).
// Volume ladder: level n requires (n - 1) * CONTRIBUTIONS_PER_LEVEL verified
// contributions. The quality gate below caps how far volume can carry a user
// whose acceptance rate is low (spec §15 — quality, not raw count).
export const CONTRIBUTIONS_PER_LEVEL = 5;

export function computeContributorLevel(params: {
    accepted: number;
    acceptRate: number;
}): { level: number; title: string } {
    const { accepted, acceptRate } = params;
    if (accepted <= 0) {
        return { level: 1, title: "Explorer" };
    }

    const volumeLevel = Math.min(
        CONTRIBUTOR_LEVELS.length,
        1 + Math.floor(accepted / CONTRIBUTIONS_PER_LEVEL),
    );
    const qualityCap =
        acceptRate >= 0.8 ? 10
        : acceptRate >= 0.6 ? 8
        : acceptRate >= 0.4 ? 6
        : 3;
    const level = Math.max(1, Math.min(volumeLevel, qualityCap));
    return { level, title: CONTRIBUTOR_LEVELS[level - 1] };
}

export const TASK_TYPE_LABELS: Record<string, string> = {
    lexicon_entry: "Word",
    phrase_translation: "Phrase translation",
    sentence_translation: "Sentence translation",
    audio_reading: "Voice recording",
    transcription: "Transcription",
    cultural_context: "Cultural context",
    dialect_mapping: "Dialect mapping",
    validation: "Validation",
};

const ACCEPTED_STATUSES = new Set(["validated", "curated"]);

// One aggregate read for the profile surface. Kept intentionally bounded:
// every collection is limited with .take() so the query stays cheap.
export const getDashboard = query({
    args: {
        userId: v.optional(v.id("users")),
        handle: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let user: Doc<"users"> | null = null;
        try {
            if (args.userId) {
                user = await ctx.db.get(args.userId);
            } else if (args.handle) {
                user = await ctx.db
                    .query("users")
                    .withIndex("by_handle", (q) => q.eq("handle", args.handle!))
                    .unique();
            } else {
                user = await getCurrentUser(ctx);
            }
        } catch {
            return null;
        }
        if (!user) return null;

        let currentUser: Doc<"users"> | null = null;
        try {
            currentUser = await getCurrentUser(ctx);
        } catch {
            // Auth unavailable — treat as logged out.
        }
        const isMe = currentUser?._id === user._id;

        let isFollowing = false;
        if (currentUser && !isMe) {
            const follow = await ctx.db
                .query("followers")
                .withIndex("by_follower_following", (q) =>
                    q.eq("followerId", currentUser._id).eq("followingId", user._id))
                .first();
            isFollowing = !!follow;
        }

        // Real counts from the followers table — never denormalized guesses.
        const followerCount = (await ctx.db
            .query("followers")
            .withIndex("by_following", (q) => q.eq("followingId", user._id))
            .take(1000)).length;
        const followingCount = (await ctx.db
            .query("followers")
            .withIndex("by_follower", (q) => q.eq("followerId", user._id))
            .take(1000)).length;

        // Contribution pipeline (Changa submissions).
        const submissions = await ctx.db
            .query("changaSubmissions")
            .withIndex("by_user_status", (q) => q.eq("userId", user._id))
            .take(1000);

        const byStatus: Record<string, number> = {};
        const byType: Record<string, { total: number; accepted: number }> = {};
        const byLanguage: Record<string, { total: number; accepted: number }> = {};
        let acceptedCount = 0;

        for (const submission of submissions) {
            byStatus[submission.status] = (byStatus[submission.status] ?? 0) + 1;
            const type = byType[submission.submissionType] ?? { total: 0, accepted: 0 };
            type.total += 1;
            if (ACCEPTED_STATUSES.has(submission.status)) {
                type.accepted += 1;
                acceptedCount += 1;
            }
            byType[submission.submissionType] = type;

            const lang = byLanguage[submission.languageCode] ?? { total: 0, accepted: 0 };
            lang.total += 1;
            if (ACCEPTED_STATUSES.has(submission.status)) lang.accepted += 1;
            byLanguage[submission.languageCode] = lang;
        }

        const reviewedCount =
            (byStatus["validated"] ?? 0) +
            (byStatus["curated"] ?? 0) +
            (byStatus["rejected"] ?? 0) +
            (byStatus["needs_fix"] ?? 0);
        const acceptRate = reviewedCount > 0 ? acceptedCount / reviewedCount : 0;

        const topLanguages = Object.entries(byLanguage)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 5)
            .map(([code]) => code);

        const storedStats = await ctx.db
            .query("changaUserStats")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .first();

        const validationCount = (await ctx.db
            .query("changaValidationVotes")
            .withIndex("by_validator", (q) => q.eq("validatorId", user._id))
            .take(1000)).length;

        // Meaningful activity timeline (spec §10): submissions + validation
        // work, most recent first. Legacy contributions have no timestamp so
        // they cannot be placed on a timeline without lying.
        const timeline: Array<{
            kind: "contribution" | "validation";
            id: string;
            label: string;
            languageCode?: string;
            status?: string;
            snippet?: string;
            timestamp: number;
        }> = [];

        for (const submission of submissions.slice(0, 20)) {
            timeline.push({
                kind: "contribution",
                id: submission._id,
                label: TASK_TYPE_LABELS[submission.submissionType] ?? "Contribution",
                languageCode: submission.languageCode,
                status: submission.status,
                snippet: submission.targetText || submission.transcriptText || submission.sourceText || undefined,
                timestamp: submission.updatedAt,
            });
        }

        const recentVotes = await ctx.db
            .query("changaValidationVotes")
            .withIndex("by_validator", (q) => q.eq("validatorId", user._id))
            .order("desc")
            .take(10);

        for (const vote of recentVotes) {
            const target = await ctx.db.get(vote.submissionId);
            timeline.push({
                kind: "validation",
                id: vote._id,
                label: vote.vote === "accept" ? "Validated a contribution" : "Reviewed a contribution",
                languageCode: target?.languageCode,
                snippet: target?.targetText || target?.transcriptText || undefined,
                timestamp: vote.createdAt,
            });
        }

        timeline.sort((a, b) => b.timestamp - a.timestamp);
        const recentTimeline = timeline.slice(0, 12);

        const legacyContributionCount = (await ctx.db
            .query("contributions")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .take(1000)).length;

        // Language role grants (Changa reputation, spec §16).
        const roleGrants = await ctx.db
            .query("changaRoleGrants")
            .withIndex("by_user_language", (q) => q.eq("userId", user._id))
            .take(50);
        const now = Date.now();
        const activeRoles = roleGrants
            .filter((grant) => grant.status === "active" && (!grant.expiresAt || grant.expiresAt > now))
            .map((grant) => ({
                languageCode: grant.languageCode ?? "",
                role: grant.role,
            }));

        const contributorLevel = computeContributorLevel({
            accepted: acceptedCount,
            acceptRate,
        });

        const profile = (isMe ? user : sanitizeUser(user as Record<string, unknown>)) as typeof user;

        return {
            profile: {
                ...profile,
                isMe,
                isFollowing,
            },
            // joinedAt: prefer explicit field; fall back to _creationTime for
            // pre-backfill accounts. Displayed as "Joined · Mon YYYY".
            joinedAt: user.joinedAt ?? user._creationTime,
            followerCount,
            followingCount,
            contribution: {
                total: submissions.length,
                accepted: acceptedCount,
                inReview: (byStatus["submitted"] ?? 0) + (byStatus["in_validation"] ?? 0),
                drafts: byStatus["draft"] ?? 0,
                needsFix: byStatus["needs_fix"] ?? 0,
                rejected: byStatus["rejected"] ?? 0,
                withdrawn: byStatus["withdrawn"] ?? 0,
                acceptRate,
                reviewAgreementRate: storedStats?.reviewAgreementRate ?? 0,
                trustScore: storedStats?.trustScore ?? 0,
                validationCount,
                streakDays: storedStats?.streakDays ?? 0,
                // Voice recordings are a dedicated metric (spec §6/§12):
                // audio_reading submissions are also counted in byType, but
                // surfaced prominently on the profile as their own stat.
                voiceRecordings: byType["audio_reading"]?.total ?? 0,
                voiceAccepted: byType["audio_reading"]?.accepted ?? 0,
                byType,
                byLanguage,
                topLanguages,
                badges: storedStats?.badges ?? [],
            },
            contributorLevel,
            activeRoles,
            legacyContributionCount,
            timeline: recentTimeline,
            // Privacy (spec §25–27): absent = public/all-on, written by updatePrivacy.
            privacy: {
                profileVisible: user.profileVisible ?? true,
                showChanga: user.showChanga ?? true,
                voiceDataAllowed: user.voiceDataAllowed ?? true,
                culturalDataAllowed: user.culturalDataAllowed ?? true,
            },
        };
    },
});