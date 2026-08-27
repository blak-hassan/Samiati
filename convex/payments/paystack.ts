import { v } from "convex/values";
import { action, internalAction, internalMutation, query } from "../_generated/server";
import { internal } from "../_generated/api";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

async function paystackHeaders() {
    return {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
    };
}

// ── Queries ──────────────────────────────────────────────────────────────────

export const getTransaction = query({
    args: { transactionId: v.id("billingEvents") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.transactionId);
    },
});

// ── Mutations ────────────────────────────────────────────────────────────────

export const saveCustomer = internalMutation({
    args: {
        userId: v.id("users"),
        paystackCustomerCode: v.string(),
    },
    handler: async (ctx, args) => {
        const sub = await ctx.db
            .query("subscriptions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();

        if (sub) {
            await ctx.db.patch(sub._id, {
                paystackCustomerCode: args.paystackCustomerCode,
                updatedAt: Date.now(),
            });
        }
    },
});

export const activateFromCard = internalMutation({
    args: {
        subscriptionId: v.id("subscriptions"),
        paystackReference: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const periodMs = 30 * 24 * 60 * 60 * 1000;

        await ctx.db.patch(args.subscriptionId, {
            status: "active",
            currentPeriodStart: now,
            currentPeriodEnd: now + periodMs,
            failedPaymentAttempts: 0,
            lastFailedPaymentAt: undefined,
            nextRetryAt: undefined,
            updatedAt: now,
        });
    },
});

export const recordBillingEvent = internalMutation({
    args: {
        userId: v.id("users"),
        subscriptionId: v.id("subscriptions"),
        amountCents: v.number(),
        currency: v.string(),
        paystackReference: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("billingEvents", {
            userId: args.userId,
            subscriptionId: args.subscriptionId,
            type: "payment.succeeded",
            amountCents: args.amountCents,
            currency: args.currency,
            paystackReference: args.paystackReference,
            description: "Card payment received via Paystack",
            createdAt: Date.now(),
        });
    },
});

// ── Actions ──────────────────────────────────────────────────────────────────

/**
 * Create a Paystack customer for a user.
 */
export const createCustomer = internalAction({
    args: {
        userId: v.id("users"),
        email: v.string(),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const res = await fetch(`${PAYSTACK_BASE_URL}/customer`, {
            method: "POST",
            headers: await paystackHeaders(),
            body: JSON.stringify({
                email: args.email,
                first_name: args.name.split(" ")[0],
                last_name: args.name.split(" ").slice(1).join(" ") || undefined,
                metadata: { userId: args.userId },
            }),
        });

        const data = await res.json();
        if (!data.status) throw new Error(`Paystack customer creation failed: ${data.message}`);

        await ctx.runMutation(internal.payments.paystack.saveCustomer, {
            userId: args.userId,
            paystackCustomerCode: data.data.customer_code,
        });

        return data.data;
    },
});

/**
 * Initialize a Paystack transaction (for card payments).
 */
export const initializeTransaction = internalAction({
    args: {
        userId: v.id("users"),
        subscriptionId: v.id("subscriptions"),
        email: v.string(),
        amountCents: v.number(),
        currency: v.string(),
    },
    handler: async (ctx, args) => {
        const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/paystack/callback`;

        const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
            method: "POST",
            headers: await paystackHeaders(),
            body: JSON.stringify({
                email: args.email,
                amount: args.amountCents,
                currency: args.currency,
                callback_url: callbackUrl,
                metadata: {
                    userId: args.userId,
                    subscriptionId: args.subscriptionId,
                    plan: "samiati",
                },
            }),
        });

        const data = await res.json();
        if (!data.status) throw new Error(`Paystack init failed: ${data.message}`);

        return {
            authorizationUrl: data.data.authorization_url,
            reference: data.data.reference,
            accessCode: data.data.access_code,
        };
    },
});

/**
 * Verify a Paystack transaction after callback.
 */
export const verifyTransaction = internalAction({
    args: {
        reference: v.string(),
    },
    handler: async (ctx, args) => {
        const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${args.reference}`, {
            headers: await paystackHeaders(),
        });

        const data = await res.json();
        if (!data.status) throw new Error(`Paystack verify failed: ${data.message}`);

        const { metadata, amount, id: paystackId } = data.data;
        const userId = metadata.userId;
        const subscriptionId = metadata.subscriptionId;

        if (data.data.status === "success") {
            await ctx.runMutation(internal.payments.paystack.activateFromCard, {
                subscriptionId,
                paystackReference: args.reference,
            });

            await ctx.runMutation(internal.payments.paystack.recordBillingEvent, {
                userId,
                subscriptionId,
                amountCents: amount,
                currency: data.data.currency,
                paystackReference: args.reference,
            });

            return { success: true };
        }

        return { success: false, status: data.data.status };
    },
});

/**
 * Create a Paystack subscription (for recurring card billing).
 */
export const createSubscription = internalAction({
    args: {
        planCode: v.string(),
        customerCode: v.string(),
        startDate: v.number(),
    },
    handler: async (ctx, args) => {
        const res = await fetch(`${PAYSTACK_BASE_URL}/subscription`, {
            method: "POST",
            headers: await paystackHeaders(),
            body: JSON.stringify({
                customer: args.customerCode,
                plan: args.planCode,
                start_date: new Date(args.startDate).toISOString().split("T")[0],
            }),
        });

        const data = await res.json();
        if (!data.status) throw new Error(`Paystack subscription failed: ${data.message}`);
        return data.data;
    },
});

/**
 * Cancel a Paystack subscription.
 */
export const cancelSubscription = internalAction({
    args: {
        subscriptionCode: v.string(),
    },
    handler: async (ctx, args) => {
        const res = await fetch(`${PAYSTACK_BASE_URL}/subscription/disable`, {
            method: "POST",
            headers: await paystackHeaders(),
            body: JSON.stringify({
                code: args.subscriptionCode,
                token: args.subscriptionCode,
            }),
        });

        const data = await res.json();
        return data;
    },
});

/**
 * Create a Paystack plan (for each tier).
 */
export const createPlan = internalAction({
    args: {
        name: v.string(),
        amount: v.number(),
        currency: v.string(),
        interval: v.union(v.literal("monthly"), v.literal("annually")),
    },
    handler: async (ctx, args) => {
        const res = await fetch(`${PAYSTACK_BASE_URL}/plan`, {
            method: "POST",
            headers: await paystackHeaders(),
            body: JSON.stringify({
                name: args.name,
                amount: args.amount,
                currency: args.currency,
                interval: args.interval,
            }),
        });

        const data = await res.json();
        if (!data.status) throw new Error(`Paystack plan creation failed: ${data.message}`);
        return data.data;
    },
});

// ── Public Actions (accessible from frontend) ────────────────────────────────

/**
 * Initialize a Paystack transaction (public action for frontend).
 */
export const initializePayment = action({
    args: {
        subscriptionId: v.id("subscriptions"),
        email: v.string(),
        amountCents: v.number(),
        currency: v.string(),
    },
    handler: async (ctx, args): Promise<{ authorizationUrl: string; reference: string; accessCode: string }> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        return await ctx.runAction(internal.payments.paystack.initializeTransaction, {
            userId: identity.subject as any,
            subscriptionId: args.subscriptionId,
            email: args.email,
            amountCents: args.amountCents,
            currency: args.currency,
        });
    },
});
