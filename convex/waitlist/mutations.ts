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
import type { Id } from "../_generated/dataModel";
import { incrementWaitlistCount } from "./counter";

/**
 * The subset of the `users` document the waitlist needs. Narrower than the
 * full schema type so unit tests can pass a plain object literal.
 */
export interface WaitlistUser {
    _id: Id<"users">;
    name: string;
    email?: string;
}

export interface SubscribeArgs {
    email: string;
    name?: string;
    source?: string;
    /**
     * Convex document id of the signed-in user, resolved server-side from the
     * auth token (never accepted from the client) by the `subscribe` mutation.
     * The exported handler takes it directly so unit tests can exercise the
     * linking path without a live auth context.
     */
    userId?: Id<"users">;
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
        //
        // Backfill the account link when an anonymous visitor who already
        // entered their email later signs in and joins. The row already exists,
        // so the counter must NOT move — only the link is new.
        if (args.userId && existing.userId !== args.userId) {
            await ctx.db.patch(existing._id, { userId: args.userId });
        }
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
        userId: args.userId,
        subscribedAt: Date.now(),
        isNotified: false,
        notifiedAt: undefined,
    });

    // Same transaction as the insert, so the public counter can never drift
    // from the actual subscriber count.
    await incrementWaitlistCount(ctx, 1);

    return { ok: true, alreadySubscribed: false };
}

export const subscribe = mutation({
    args: {
        email: v.string(),
        name: v.optional(v.string()),
        source: v.optional(v.string()),
    },
    // Inline arrow that delegates to `subscribeHandler`.
    //
    // Passing the named `subscribeHandler` directly made Convex pick its
    // "handler defines the args" overload, and because the handler is annotated
    // with the hand-written `SubscribeArgs` interface (rather than being
    // inferred from the validators above) that overload failed to resolve and
    // `_args` collapsed to `never`. That surfaced in the client as
    // "Type 'string' is not assignable to type 'never'" on every field of the
    // subscribe({...}) call in src/components/WaitlistForm.tsx.
    //
    // An inline handler makes `args` infer from the validators, so the client
    // sees the real shape. `subscribeHandler` stays exported for unit tests.
    handler: async (ctx, args) => {
        // Resolve the signed-in user server-side. `getCurrentUser` returns null
        // for anonymous visitors, so the public email path keeps working. The
        // client never sends a userId — it would be trivially forgeable.
        const { getCurrentUser } = await import("../users/utils");
        const user = await getCurrentUser(ctx);
        return subscribeHandler(ctx, {
            ...args,
            userId: user?._id,
        });
    },
});

export interface JoinAuthenticatedArgs {
    source?: string;
}

/**
 * One-click join for an already-authenticated visitor.
 *
 * The email is never taken from the client: it comes from the synced `users`
 * document, so a signed-in visitor cannot subscribe (or silently re-target the
 * notification email of) somebody else's address. The userId is stored on the
 * row so the subscription is attributable to an account.
 */
export async function joinAuthenticatedHandler(
    ctx: MutationCtx,
    args: JoinAuthenticatedArgs & { user: WaitlistUser },
): Promise<SubscribeResult> {
    const { user } = args;
    const email = user.email?.trim().toLowerCase();

    if (!email) {
        // Clerk identities without a primary email (e.g. OAuth-only or
        // phone-first accounts) have nothing to notify. Fall back to the
        // anonymous form rather than inserting an unnotifiable row.
        throw new Error(
            "Your account has no email address on file. Please use the email form instead.",
        );
    }

    // One subscription per account, regardless of which email it was made
    // with. by_user is O(1) and is the stronger invariant: it also catches the
    // case where the user changed their email after subscribing anonymously.
    const existingByUser = await ctx.db
        .query("waitlist")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();
    if (existingByUser) {
        return { ok: true, alreadySubscribed: true };
    }

    return subscribeHandler(ctx, {
        email,
        name: user.name,
        source: args.source,
        userId: user._id,
    });
}

export const joinAuthenticated = mutation({
    args: {
        source: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { getCurrentUser } = await import("../users/utils");
        const user = await getCurrentUser(ctx);
        if (!user) {
            throw new Error("You must be signed in to join the waitlist.");
        }
        return joinAuthenticatedHandler(ctx, {
            source: args.source,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    },
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