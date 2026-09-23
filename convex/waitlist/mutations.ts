// convex/waitlist/mutations.ts
// Waitlist subscription mutations.
//
// `subscribe` is a public mutation — it does NOT call getCurrentUser, so
// unauthenticated visitors can join the waitlist. It enforces email
// uniqueness and a per-email rate limit to curb spam.
//
// The handler logic is exported as `subscribeHandler` so unit tests can
// exercise it directly without a live Convex backend.

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { checkRateLimit } from "../lib/rateLimit";
import type { MutationCtx } from "../_generated/server";

export interface SubscribeArgs {
    email: string;
    name?: string;
    source?: string;
}

export interface SubscribeResult {
    ok: boolean;
    alreadySubscribed: boolean;
}

export async function subscribeHandler(
    ctx: MutationCtx,
    args: SubscribeArgs,
): Promise<SubscribeResult> {
    const email = args.email.trim().toLowerCase();

    // Reject duplicates early — the by_email index makes this O(1).
    const existing = await ctx.db
        .query("waitlist")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();
    if (existing) {
        // Idempotent: returning ok avoids erroring on double-submits
        // from the same browser.
        return { ok: true, alreadySubscribed: true };
    }

    // Rate limit: 5 submissions per 60s per email.
    const limit = await checkRateLimit(ctx.db, `waitlist:${email}`, 60_000, 5);
    if (!limit.allowed) {
        throw new Error(
            "Too many submissions. Please wait a moment and try again.",
        );
    }

    await ctx.db.insert("waitlist", {
        email,
        name: args.name?.trim() || undefined,
        source: args.source || undefined,
        subscribedAt: Date.now(),
        isNotified: false,
        notifiedAt: undefined,
    });

    return { ok: true, alreadySubscribed: false };
}

export const subscribe = mutation({
    args: {
        email: v.string(),
        name: v.optional(v.string()),
        source: v.optional(v.string()),
    },
    handler: subscribeHandler,
});

// Admin-only: mark subscribers as notified after a launch/release.
export const markNotified = mutation({
    args: {
        email: v.string(),
    },
    handler: async (ctx, args) => {
        const { getCurrentUser } = await import("../users/utils");
        const user = await getCurrentUser(ctx);
        if (!user || user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        const email = args.email.trim().toLowerCase();
        const entry = await ctx.db
            .query("waitlist")
            .withIndex("by_email", (q) => q.eq("email", email))
            .first();
        if (!entry) return null;

        await ctx.db.patch(entry._id, {
            isNotified: true,
            notifiedAt: Date.now(),
        });
        return entry._id;
    },
});