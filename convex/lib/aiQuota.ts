/**
 * AI service quota configuration and pure math. Kept free of Convex imports
 * so it can be unit-tested without a Convex runtime.
 *
 * Limits are defined per plan tier. Voice services (ASR + TTS) use
 * a weighted counting system where voice = 5x text cost.
 */
export type AiService = "chat" | "search" | "translate" | "tts" | "asr";
export type PlanTier = "free" | "learner" | "fluent" | "organization";

export const AI_SERVICE_LIMITS: Record<PlanTier, Record<AiService, { hourly: { windowMs: number; max: number }; daily: { windowMs: number; max: number } }>> = {
    free: {
        chat: { hourly: { windowMs: 60 * 60 * 1000, max: 5 }, daily: { windowMs: 24 * 60 * 60 * 1000, max: 10 } },
        search: { hourly: { windowMs: 60 * 60 * 1000, max: 5 }, daily: { windowMs: 24 * 60 * 60 * 1000, max: 10 } },
        translate: { hourly: { windowMs: 60 * 60 * 1000, max: 5 }, daily: { windowMs: 24 * 60 * 60 * 1000, max: 5 } },
        tts: { hourly: { windowMs: 60 * 60 * 1000, max: 2 }, daily: { windowMs: 24 * 60 * 60 * 1000, max: 2 } },
        asr: { hourly: { windowMs: 60 * 60 * 1000, max: 1 }, daily: { windowMs: 24 * 60 * 60 * 1000, max: 2 } },
    },
    learner: {
        chat: { hourly: { windowMs: 60 * 60 * 1000, max: 20 }, daily: { windowMs: 24 * 60 * 60 * 1000, max: 50 } },
        search: { hourly: { windowMs: 60 * 60 * 1000, max: 20 }, daily: { windowMs: 24 * 60 * 60 * 1000, max: 50 } },
        translate: { hourly: { windowMs: 60 * 60 * 1000, max: 25 }, daily: { windowMs: 24 * 60 * 60 * 1000, max: 100 } },
        tts: { hourly: { windowMs: 60 * 60 * 1000, max: 10 }, daily: { windowMs: 24 * 60 * 60 * 1000, max: 30 } },
        asr: { hourly: { windowMs: 60 * 60 * 1000, max: 8 }, daily: { windowMs: 24 * 60 * 60 * 1000, max: 20 } },
    },
    fluent: {
        chat: { hourly: { windowMs: 60 * 60 * 1000, max: 50 }, daily: { windowMs: 24 * 60 * 60 * 1000, max: 200 } },
        search: { hourly: { windowMs: 60 * 60 * 1000, max: 50 }, daily: { windowMs: 24 * 60 * 60 * 1000, max: 200 } },
        translate: { hourly: { windowMs: 60 * 60 * 1000, max: 50 }, daily: { windowMs: 24 * 60 * 60 * 1000, max: 250 } },
        tts: { hourly: { windowMs: 60 * 60 * 1000, max: 20 }, daily: { windowMs: 24 * 60 * 60 * 1000, max: 80 } },
        asr: { hourly: { windowMs: 60 * 60 * 1000, max: 15 }, daily: { windowMs: 24 * 60 * 60 * 1000, max: 50 } },
    },
    organization: {
        chat: { hourly: { windowMs: 60 * 60 * 1000, max: 100 }, daily: { windowMs: 24 * 60 * 60 * 1000, max: 500 } },
        search: { hourly: { windowMs: 60 * 60 * 1000, max: 100 }, daily: { windowMs: 24 * 60 * 60 * 1000, max: 500 } },
        translate: { hourly: { windowMs: 60 * 60 * 1000, max: 100 }, daily: { windowMs: 24 * 60 * 60 * 1000, max: 500 } },
        tts: { hourly: { windowMs: 60 * 60 * 1000, max: 40 }, daily: { windowMs: 24 * 60 * 60 * 1000, max: 200 } },
        asr: { hourly: { windowMs: 60 * 60 * 1000, max: 30 }, daily: { windowMs: 24 * 60 * 60 * 1000, max: 100 } },
    },
} as const;

/**
 * Estimate remaining quota in the current windows.
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
