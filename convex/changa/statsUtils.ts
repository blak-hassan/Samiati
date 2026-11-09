// Pure Changa statistics helpers.
//
// This module deliberately has no Convex server imports so the maths can be
// unit tested without a deployment.

export const DAY_MS = 24 * 60 * 60 * 1000;

// Upper bound on how many records a single stats query reads. Keeps a single
// very active account from turning the dashboard query into a full scan.
export const MAX_STATS_RECORDS = 1000;

export function buildTrustScore(params: {
    contributionCount: number;
    validationCount: number;
    acceptRate: number;
    reviewAgreementRate: number;
}) {
    const trustScore =
        params.contributionCount * 2 +
        params.validationCount * 3 +
        params.acceptRate * 40 +
        params.reviewAgreementRate * 30;

    return Math.round(trustScore);
}

// Consecutive-day streak ending at the most recent activity.
//
// The streak stays alive only if the latest activity happened today or
// yesterday; otherwise it is reported as broken (0) rather than as a historic
// run the contributor can no longer extend.
export function computeStreakDays(timestamps: number[], now: number): number {
    if (timestamps.length === 0) return 0;

    const activeDays = new Set(timestamps.map((t) => Math.floor(t / DAY_MS)));
    const today = Math.floor(now / DAY_MS);
    const sorted = [...activeDays].sort((left, right) => right - left);

    if (sorted[0] < today - 1) return 0;

    let streak = 1;
    for (let index = 1; index < sorted.length; index++) {
        if (sorted[index - 1] - sorted[index] !== 1) break;
        streak += 1;
    }

    return streak;
}
