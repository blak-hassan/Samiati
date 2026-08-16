import { ActionCtx, MutationCtx, QueryCtx, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { getCurrentUser, isGuestUser } from "../users/utils";
import { checkRateLimit } from "./rateLimit";
import { AI_SERVICE_LIMITS, type AiService } from "./aiQuota";

export { AI_SERVICE_LIMITS, estimateRemaining } from "./aiQuota";
export type { AiService } from "./aiQuota";

/**
 * Require a real authenticated user (never a guest) before an AI call.
 * For queries and mutations (direct DB access).
 */
export async function requireAiUser(ctx: QueryCtx | MutationCtx) {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");
    if (isGuestUser(user)) {
        throw new Error("Guests cannot use AI features. Please sign in.");
    }
    return user;
}

/**
 * Require a Clerk identity for actions (actions cannot touch the DB
 * directly). Guest sessions have no Clerk identity, so this excludes them.
 */
export async function requireAuthenticatedAction(ctx: ActionCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Unauthorized");
    }
    return identity;
}

/**
 * Enforce per-service quotas from inside an action. The counter lives in the
 * database, so the check runs as an internal mutation keyed by the caller's
 * Clerk subject (falling back to "anon" only when the action legitimately
 * runs without identity, e.g. an internal worker path).
 */
export async function enforceAiQuotaAction(
    ctx: ActionCtx,
    service: AiService,
    subjectOverride?: string,
): Promise<void> {
    const identity = await ctx.auth.getUserIdentity();
    const subject = subjectOverride ?? identity?.subject ?? "anon";
    const result = await ctx.runMutation(internal.lib.aiSecurity.enforceAiQuota, {
        service,
        subject,
    });
    if (!result.allowed) {
        throw new Error(result.message ?? "AI quota exceeded. Please try again later.");
    }
}

/** Internal mutation that applies the quota counters. */
export const enforceAiQuota = internalMutation({
    args: {
        service: v.union(
            v.literal("chat"),
            v.literal("search"),
            v.literal("translate"),
            v.literal("tts"),
            v.literal("asr"),
        ),
        subject: v.string(),
    },
    handler: async (ctx, args) => {
        const limits = AI_SERVICE_LIMITS[args.service as AiService];
        const now = Date.now();
        for (const [name, window] of [
            ["hourly", limits.hourly],
            ["daily", limits.daily],
        ] as const) {
            const result = await checkRateLimit(
                ctx.db,
                `ai:${args.service}:${name}:${args.subject}`,
                window.windowMs,
                window.max,
                now,
            );
            if (!result.allowed) {
                const minutes = Math.ceil(result.retryAfterMs / 60000);
                return {
                    allowed: false,
                    message: `You have reached the ${name === "daily" ? "daily" : "hourly"} limit for this AI feature. Please try again in ~${Math.max(1, minutes)} minute(s).`,
                };
            }
        }
        return { allowed: true, message: null };
    },
});