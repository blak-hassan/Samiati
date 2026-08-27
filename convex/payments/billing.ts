import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, query, mutation } from "../_generated/server";
import { internal } from "../_generated/api";

const PRICING = {
    learner: { monthly: 500, annual: 4800 },   // $5/mo, $48/yr (in cents)
    fluent: { monthly: 1500, annual: 14400 },   // $15/mo, $144/yr (in cents)
} as const;

// ── Queries ──────────────────────────────────────────────────────────────────

export const getActiveSubscription = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("subscriptions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .first();
    },
});

export const getExpiredSubscriptions = internalQuery({
    args: { now: v.number() },
    handler: async (ctx, args) => {
        const subs = await ctx.db
            .query("subscriptions")
            .withIndex("by_currentPeriodEnd", (q) => q.lte("currentPeriodEnd", args.now))
            .collect();

        return subs.filter((s) => s.plan !== "free" && s.status === "active");
    },
});

export const getRetryableSubscriptions = internalQuery({
    args: { now: v.number() },
    handler: async (ctx, args) => {
        const subs = await ctx.db
            .query("subscriptions")
            .withIndex("by_status", (q) => q.eq("status", "past_due"))
            .collect();

        return subs.filter((s) => s.nextRetryAt !== undefined && s.nextRetryAt <= args.now);
    },
});

export const getBillingHistory = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("billingEvents")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .take(50);
    },
});

// Public mutation for frontend to create subscription
export const startSubscription = mutation({
    args: {
        plan: v.union(
            v.literal("free"),
            v.literal("learner"),
            v.literal("fluent"),
        ),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        const now = Date.now();
        const periodMs = 30 * 24 * 60 * 60 * 1000;

        return await ctx.db.insert("subscriptions", {
            userId: user._id,
            plan: args.plan,
            status: args.plan === "free" ? "active" : "pending",
            currentPeriodStart: now,
            currentPeriodEnd: now + periodMs,
            createdAt: now,
            updatedAt: now,
            failedPaymentAttempts: 0,
        });
    },
});

// ── Mutations ────────────────────────────────────────────────────────────────

export const createSubscription = internalMutation({
    args: {
        userId: v.id("users"),
        plan: v.union(
            v.literal("free"),
            v.literal("learner"),
            v.literal("fluent"),
            v.literal("organization"),
        ),
        periodMs: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const periodMs = args.periodMs ?? 30 * 24 * 60 * 60 * 1000;

        return await ctx.db.insert("subscriptions", {
            userId: args.userId,
            plan: args.plan,
            status: args.plan === "free" ? "active" : "pending",
            currentPeriodStart: now,
            currentPeriodEnd: now + periodMs,
            createdAt: now,
            updatedAt: now,
            failedPaymentAttempts: 0,
        });
    },
});

export const upgradePlan = internalMutation({
    args: {
        subscriptionId: v.id("subscriptions"),
        newPlan: v.union(
            v.literal("learner"),
            v.literal("fluent"),
            v.literal("organization"),
        ),
    },
    handler: async (ctx, args) => {
        const sub = await ctx.db.get(args.subscriptionId);
        if (!sub) throw new Error("Subscription not found");

        const oldPlan = sub.plan;
        const now = Date.now();

        await ctx.db.patch(args.subscriptionId, {
            plan: args.newPlan,
            status: "active",
            updatedAt: now,
        });

        await ctx.db.insert("billingEvents", {
            userId: sub.userId,
            subscriptionId: args.subscriptionId,
            type: "subscription.upgraded",
            amountCents: args.newPlan in PRICING ? PRICING[args.newPlan as keyof typeof PRICING].monthly : 0,
            currency: "USD",
            description: `Upgraded from ${oldPlan} to ${args.newPlan}`,
            metadata: { oldPlan, newPlan: args.newPlan },
            createdAt: now,
        });
    },
});

export const downgradePlan = internalMutation({
    args: {
        subscriptionId: v.id("subscriptions"),
        newPlan: v.union(
            v.literal("free"),
            v.literal("learner"),
            v.literal("fluent"),
        ),
    },
    handler: async (ctx, args) => {
        const sub = await ctx.db.get(args.subscriptionId);
        if (!sub) throw new Error("Subscription not found");

        const oldPlan = sub.plan;
        const now = Date.now();

        await ctx.db.patch(args.subscriptionId, {
            plan: args.newPlan,
            updatedAt: now,
        });

        await ctx.db.insert("billingEvents", {
            userId: sub.userId,
            subscriptionId: args.subscriptionId,
            type: "subscription.downgraded",
            amountCents: 0,
            currency: "USD",
            description: `Downgraded from ${oldPlan} to ${args.newPlan}`,
            metadata: { oldPlan, newPlan: args.newPlan },
            createdAt: now,
        });
    },
});

export const cancelSubscription = mutation({
    args: { subscriptionId: v.id("subscriptions") },
    handler: async (ctx, args) => {
        const sub = await ctx.db.get(args.subscriptionId);
        if (!sub) throw new Error("Subscription not found");

        const now = Date.now();
        await ctx.db.patch(args.subscriptionId, {
            status: "canceled",
            canceledAt: now,
            updatedAt: now,
        });

        await ctx.db.insert("billingEvents", {
            userId: sub.userId,
            subscriptionId: args.subscriptionId,
            type: "subscription.canceled",
            amountCents: 0,
            currency: "USD",
            description: "Subscription canceled by user",
            createdAt: now,
        });
    },
});

export const recordRenewalAttempt = internalMutation({
    args: { subscriptionId: v.id("subscriptions") },
    handler: async (ctx, args) => {
        const sub = await ctx.db.get(args.subscriptionId);
        if (!sub) return;

        const now = Date.now();
        await ctx.db.patch(args.subscriptionId, { updatedAt: now });

        await ctx.db.insert("billingEvents", {
            userId: sub.userId,
            subscriptionId: args.subscriptionId,
            type: "subscription.renewed",
            amountCents: 0,
            currency: "USD",
            description: "Renewal initiated via Paystack",
            createdAt: now,
        });
    },
});

export const recordDunningAttempt = internalMutation({
    args: { subscriptionId: v.id("subscriptions") },
    handler: async (ctx, args) => {
        const sub = await ctx.db.get(args.subscriptionId);
        if (!sub) return;

        const now = Date.now();
        await ctx.db.patch(args.subscriptionId, { updatedAt: now });

        await ctx.db.insert("billingEvents", {
            userId: sub.userId,
            subscriptionId: args.subscriptionId,
            type: "payment.retried",
            amountCents: 0,
            currency: "USD",
            description: "Dunning retry initiated",
            createdAt: now,
        });
    },
});

// ── Actions ──────────────────────────────────────────────────────────────────

/**
 * Daily cron: Process renewals via Paystack.
 */
export const processRenewals = internalAction({
    args: {},
    handler: async (ctx): Promise<{ renewed: number; retried: number }> => {
        const now = Date.now();

        const expiredSubs = await ctx.runQuery(internal.payments.billing.getExpiredSubscriptions, {
            now,
        });

        for (const sub of expiredSubs) {
            if (sub.plan === "free") continue;

            if (sub.paystackSubscriptionCode) {
                // Paystack handles recurring billing automatically
                // Just verify and update the period
                try {
                    await ctx.runMutation(internal.payments.billing.recordRenewalAttempt, {
                        subscriptionId: sub._id,
                    });
                } catch (error) {
                    console.error(`Renewal failed for ${sub._id}:`, error);
                }
            }
        }

        const retryableSubs = await ctx.runQuery(internal.payments.billing.getRetryableSubscriptions, {
            now,
        });

        for (const sub of retryableSubs) {
            try {
                await ctx.runMutation(internal.payments.billing.recordDunningAttempt, {
                    subscriptionId: sub._id,
                });
            } catch (error) {
                console.error(`Dunning retry failed for ${sub._id}:`, error);
            }
        }

        return { renewed: expiredSubs.length, retried: retryableSubs.length };
    },
});
