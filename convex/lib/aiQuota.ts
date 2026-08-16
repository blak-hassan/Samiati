/**
 * AI service quota configuration and pure math. Kept free of Convex imports
 * so it can be unit-tested without a Convex runtime.
 *
 * Every value is deliberately bounded so a single malicious (or runaway)
 * account has a hard ceiling on external API cost.
 *
 * Window semantics: `hourly` allows `hourly.max` requests per
 * `hourly.windowMs`; `daily` allows `daily.max` per `daily.windowMs`.
 * A request must pass BOTH windows.
 */
export const AI_SERVICE_LIMITS = {
    chat: {
        hourly: { windowMs: 60 * 60 * 1000, max: 30 },
        daily: { windowMs: 24 * 60 * 60 * 1000, max: 120 },
    },
    search: {
        hourly: { windowMs: 60 * 60 * 1000, max: 30 },
        daily: { windowMs: 24 * 60 * 60 * 1000, max: 120 },
    },
    translate: {
        hourly: { windowMs: 60 * 60 * 1000, max: 40 },
        daily: { windowMs: 24 * 60 * 60 * 1000, max: 200 },
    },
    tts: {
        hourly: { windowMs: 60 * 60 * 1000, max: 15 },
        daily: { windowMs: 24 * 60 * 60 * 1000, max: 40 },
    },
    asr: {
        hourly: { windowMs: 60 * 60 * 1000, max: 10 },
        daily: { windowMs: 24 * 60 * 60 * 1000, max: 30 },
    },
} as const;

export type AiService = keyof typeof AI_SERVICE_LIMITS;

/**
 * Estimate remaining quota in the current windows — used for friendly
 * "n calls left" hints. Pure math over the counters.
 */
export function estimateRemaining(
    counters: { windowStart: number; count: number }[],
    limits: { windowMs: number; max: number },
    now: number = Date.now(),
): number {
    const recent = counters.filter((c) => c.windowStart + limits.windowMs > now);
    const count = recent.reduce((sum, c) => sum + c.count, 0);
    return Math.max(0, limits.max - count);
}