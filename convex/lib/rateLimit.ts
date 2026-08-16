import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfterMs: number;
}

/**
 * Sliding-window rate limiter over the `rateLimits` table.
 *
 * Each counter records the requests that occurred at a single timestamp
 * (`windowStart` holds the request time). Counters older than `windowMs`
 * are deleted lazily; the remainder sum to the exact number of requests
 * inside the sliding window `(now - windowMs, now]`. Convex serializes
 * mutations, so the read-check-write sequence is atomic in practice.
 */
export async function checkRateLimit(
    db: MutationCtx["db"],
    key: string,
    windowMs: number,
    maxRequests: number,
    now: number = Date.now(),
): Promise<RateLimitResult> {
    const counters = await db
        .query("rateLimits")
        .withIndex("by_key", (q) => q.eq("key", key))
        .collect();

    const recent = counters.filter((c) => c.windowStart > now - windowMs);
    const stale = counters.filter((c) => c.windowStart <= now - windowMs);
    for (const counter of stale) {
        await db.delete(counter._id);
    }

    const count = recent.reduce((sum, c) => sum + c.count, 0);

    if (count >= maxRequests) {
        const oldestRecent = recent.reduce<number>(
            (oldest, c) => Math.min(oldest, c.windowStart),
            now,
        );
        return {
            allowed: false,
            remaining: 0,
            retryAfterMs: Math.max(0, oldestRecent + windowMs - now),
        };
    }

    const current = recent.find((c) => c.windowStart === now);
    if (current) {
        await db.patch(current._id, { count: current.count + 1, updatedAt: now });
    } else {
        await db.insert("rateLimits", {
            key,
            windowStart: now,
            count: 1,
            updatedAt: now,
        });
    }

    return {
        allowed: true,
        remaining: maxRequests - count - 1,
        retryAfterMs: 0,
    };
}

export type RateLimitDoc = { _id: Id<"rateLimits"> };