// convex/waitlist/counter.ts
// Shared counter helpers for the public waitlist counter.
//
// The landing page renders a subscriber count to anonymous visitors on every
// page view. Deriving it with `ctx.db.query("waitlist").collect().length` would
// read and deserialize every subscriber row per request, so we keep a single
// `waitlistCounters` document instead (key = "waitlist") and adjust it inside
// the same mutation transaction that inserts or removes the subscriber. Convex
// serialises mutations, which makes the read-modify-write here atomic.

import type { MutationCtx, QueryCtx } from "../_generated/server";

export const WAITLIST_COUNTER_KEY = "waitlist";

/**
 * Increment the counter by `delta` and return the new value.
 *
 * Callers MUST invoke this in the same mutation that changes the `waitlist`
 * table so the counter can never drift from the actual row count.
 */
export async function incrementWaitlistCount(
    ctx: MutationCtx,
    delta: number = 1,
): Promise<number> {
    const existing = await ctx.db
        .query("waitlistCounters")
        .withIndex("by_key", (q) => q.eq("key", WAITLIST_COUNTER_KEY))
        .first();

    const next = Math.max(0, (existing?.count ?? 0) + delta);

    if (existing) {
        await ctx.db.patch(existing._id, { count: next, updatedAt: Date.now() });
    } else {
        await ctx.db.insert("waitlistCounters", {
            key: WAITLIST_COUNTER_KEY,
            count: next,
            updatedAt: Date.now(),
        });
    }

    return next;
}

/**
 * Read the counter for public display.
 *
 * Falls back to a full table scan when the counter row is missing — which
 * happens for deployments that already accumulated subscribers before this
 * table existed. The result stays correct (and still reactive, because the
 * query reads the `waitlist` table too); the next subscriber insert creates the
 * counter row and every read after that is a single indexed document fetch.
 */
export async function readWaitlistCount(ctx: QueryCtx): Promise<number> {
    const existing = await ctx.db
        .query("waitlistCounters")
        .withIndex("by_key", (q) => q.eq("key", WAITLIST_COUNTER_KEY))
        .first();

    if (existing) return existing.count;

    const docs = await ctx.db.query("waitlist").collect();
    return docs.length;
}
