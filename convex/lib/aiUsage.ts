/**
 * AI usage capture and read-side aggregation.
 *
 * Every router call (success and failure) carries a `UsageEstimate`.
 * The action layer is responsible for persisting it via `recordUsage`
 * after each call so dashboards and free-tier cost analysis can be
 * built without instrumenting every call site.
 *
 * This module deliberately lives outside the router: the router is
 * a pure dispatch layer (no side effects beyond the HTTP call), and
 * usage capture is a cross-cutting concern that should be opt-in per
 * action. New action handlers should call `recordUsage` once per
 * router invocation.
 */
import { internalMutation, query } from "../_generated/server";
import { v } from "convex/values";
import type { UsageEstimate } from "./aiRouter";

/**
 * Persist one usage record. Internal — call sites should use
 * `ctx.runMutation(internal.lib.aiUsage.recordUsage, ...)` rather
 * than import this directly (the call site is the action, not a
 * mutation, so it must run through the action boundary).
 */
export const recordUsage = internalMutation({
    args: {
        service: v.union(
            v.literal("chat"),
            v.literal("search"),
            v.literal("translate"),
            v.literal("tts"),
            v.literal("asr"),
            v.literal("embed"),
            v.literal("moderate"),
        ),
        model: v.string(),
        provider: v.string(),
        inputTokens: v.number(),
        outputTokens: v.number(),
        costCents: v.number(),
        usageSource: v.union(v.literal("reported"), v.literal("estimated")),
        ok: v.boolean(),
        errorCode: v.optional(v.string()),
        userId: v.optional(v.id("users")),
        subject: v.optional(v.string()),
        tier: v.optional(v.union(
            v.literal("free"),
            v.literal("learner"),
            v.literal("fluent"),
            v.literal("organization"),
        )),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("aiUsage", {
            ...args,
            createdAt: Date.now(),
        });
    },
});

/**
 * Convert a `UsageEstimate` from the router into a `recordUsage` call.
 * Returns the function so callers can `await ctx.runMutation(...)` it.
 */
export function usageToRecordArgs(usage: UsageEstimate, provider: string, ctx: {
    ok: boolean;
    errorCode?: string;
    userId?: import("../_generated/dataModel").Id<"users">;
    subject?: string;
    tier?: "free" | "learner" | "fluent" | "organization";
}) {
    return {
        service: usage.service,
        model: usage.model,
        provider,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        costCents: usage.costCents,
        usageSource: usage.source,
        ok: ctx.ok,
        errorCode: ctx.errorCode,
        userId: ctx.userId,
        subject: ctx.subject,
        tier: ctx.tier,
    };
}

// ── Read-side queries ──────────────────────────────────────────────────────

interface DailyUsageRow {
    service: string;
    day: string; // YYYY-MM-DD UTC
    calls: number;
    failedCalls: number;
    inputTokens: number;
    outputTokens: number;
    costCents: number;
    byUsageSource: { reported: number; estimated: number };
}

/**
 * Aggregate AI usage by service × day for the last N days. Used by
 * the (future) cost dashboard and by ad-hoc operator queries.
 *
 * NOTE: This is intentionally a small, bounded query. For longer
 * ranges, page through `by_createdAt` directly.
 */
export const getDailyUsage = query({
    args: {
        days: v.optional(v.number()),
    },
    handler: async (ctx, args): Promise<DailyUsageRow[]> => {
        const days = Math.max(1, Math.min(90, args.days ?? 7));
        const sinceMs = Date.now() - days * 24 * 60 * 60 * 1000;

        // Bounded scan: read at most 1000 rows in the window. For a
        // production dashboard this should be replaced with a cron
        // that rolls up daily totals into a separate table.
        const rows = await ctx.db
            .query("aiUsage")
            .withIndex("by_createdAt", (q) => q.gt("createdAt", sinceMs))
            .take(1000);

        const buckets = new Map<string, DailyUsageRow>();
        for (const r of rows) {
            const day = new Date(r.createdAt).toISOString().slice(0, 10);
            const key = `${r.service}|${day}`;
            let b = buckets.get(key);
            if (!b) {
                b = {
                    service: r.service,
                    day,
                    calls: 0,
                    failedCalls: 0,
                    inputTokens: 0,
                    outputTokens: 0,
                    costCents: 0,
                    byUsageSource: { reported: 0, estimated: 0 },
                };
                buckets.set(key, b);
            }
            b.calls++;
            if (!r.ok) b.failedCalls++;
            b.inputTokens += r.inputTokens;
            b.outputTokens += r.outputTokens;
            b.costCents += r.costCents;
            b.byUsageSource[r.usageSource]++;
        }
        return Array.from(buckets.values()).sort((a, b) =>
            a.day === b.day ? a.service.localeCompare(b.service) : a.day.localeCompare(b.day),
        );
    },
});
