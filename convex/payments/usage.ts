import { v } from "convex/values";
import { internalMutation, query } from "../_generated/server";
import type { GenericDatabaseReader, GenericDatabaseWriter } from "convex/server";
import type { DataModel, Doc, Id } from "../_generated/dataModel";

export type PlanTier = "free" | "learner" | "fluent" | "organization";

type UsageTrackingDoc = Doc<"usageTracking">;

// Usage counters for the current billing period.
type UsageCounts = {
    chatMessages: number;
    translateRequests: number;
    voiceMessages: number;
    voiceMinutes: number;
};

const ZERO_USAGE: UsageCounts = {
    chatMessages: 0,
    translateRequests: 0,
    voiceMessages: 0,
    voiceMinutes: 0,
};

export const PLAN_LIMITS: Record<PlanTier, {
    monthlyMessages: number;
    monthlyTranslations: number;
    monthlyVoiceMessages: number;
    voiceMinutes: number;
}> = {
    free: {
        monthlyMessages: 300,
        monthlyTranslations: 150,
        monthlyVoiceMessages: 60,
        voiceMinutes: 6,
    },
    learner: {
        monthlyMessages: 400,
        monthlyTranslations: 200,
        monthlyVoiceMessages: 100,
        voiceMinutes: 20,
    },
    fluent: {
        monthlyMessages: 1500,
        monthlyTranslations: 750,
        monthlyVoiceMessages: 400,
        voiceMinutes: 80,
    },
    organization: {
        monthlyMessages: 10000,
        monthlyTranslations: 5000,
        monthlyVoiceMessages: 2000,
        voiceMinutes: 400,
    },
};

function getCurrentPeriod(): { periodStart: number; periodEnd: number } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    return { periodStart: start, periodEnd: end };
}

// Read-only lookup for the current period.
//
// Convex queries cannot write, so the usage record is only ever created by
// `recordUsage` (a mutation). A user who has not used the service yet simply
// has no record, and every counter reads as zero.
async function readUsagePeriod(
    db: GenericDatabaseReader<DataModel>,
    userId: Id<"users">,
): Promise<{ periodStart: number; periodEnd: number; counts: UsageCounts }> {
    const { periodStart, periodEnd } = getCurrentPeriod();

    const doc = await db
        .query("usageTracking")
        .withIndex("by_user_period", (q) =>
            q.eq("userId", userId).eq("periodStart", periodStart)
        )
        .first();

    if (!doc) {
        return { periodStart, periodEnd, counts: { ...ZERO_USAGE } };
    }

    return {
        periodStart,
        periodEnd,
        counts: {
            chatMessages: doc.chatMessages,
            translateRequests: doc.translateRequests,
            voiceMessages: doc.voiceMessages,
            voiceMinutes: doc.voiceMinutes,
        },
    };
}

// Write path — only ever called from a mutation.
async function getOrCreateUsagePeriod(
    db: GenericDatabaseWriter<DataModel>,
    userId: Id<"users">,
): Promise<{ periodStart: number; periodEnd: number; doc: UsageTrackingDoc }> {
    const { periodStart, periodEnd } = getCurrentPeriod();

    const existing = await db
        .query("usageTracking")
        .withIndex("by_user_period", (q) =>
            q.eq("userId", userId).eq("periodStart", periodStart)
        )
        .first();

    if (existing) {
        return { periodStart, periodEnd, doc: existing };
    }

    const docId = await db.insert("usageTracking", {
        userId,
        periodStart,
        periodEnd,
        ...ZERO_USAGE,
    });

    const doc = await db.get(docId);
    if (!doc) {
        throw new Error("Failed to create the usage tracking record");
    }

    return { periodStart, periodEnd, doc };
}

export const recordUsage = internalMutation({
    args: {
        userId: v.id("users"),
        service: v.union(
            v.literal("chat"),
            v.literal("search"),
            v.literal("translate"),
            v.literal("tts"),
            v.literal("asr"),
        ),
    },
    handler: async (ctx, args) => {
        const { doc } = await getOrCreateUsagePeriod(ctx.db, args.userId);

        const updates: {
            chatMessages?: number;
            translateRequests?: number;
            voiceMessages?: number;
            voiceMinutes?: number;
        } = {};
        if (args.service === "chat" || args.service === "search") {
            updates.chatMessages = doc.chatMessages + 1;
        } else if (args.service === "translate") {
            updates.translateRequests = doc.translateRequests + 1;
        } else if (args.service === "tts" || args.service === "asr") {
            updates.voiceMessages = doc.voiceMessages + 1;
            updates.voiceMinutes = doc.voiceMinutes + (args.service === "tts" ? 0.167 : 0.5);
        }

        await ctx.db.patch(doc._id, updates);
    },
});

export const checkUsageLimit = query({
    args: {
        userId: v.id("users"),
        service: v.union(
            v.literal("chat"),
            v.literal("search"),
            v.literal("translate"),
            v.literal("tts"),
            v.literal("asr"),
        ),
        tier: v.union(
            v.literal("free"),
            v.literal("learner"),
            v.literal("fluent"),
            v.literal("organization"),
        ),
    },
    handler: async (ctx, args) => {
        const limits = PLAN_LIMITS[args.tier];
        const { counts } = await readUsagePeriod(ctx.db, args.userId);

        let current = 0;
        let limit = 0;

        if (args.service === "chat" || args.service === "search") {
            current = counts.chatMessages;
            limit = limits.monthlyMessages;
        } else if (args.service === "translate") {
            current = counts.translateRequests;
            limit = limits.monthlyTranslations;
        } else if (args.service === "tts" || args.service === "asr") {
            current = counts.voiceMessages;
            limit = limits.monthlyVoiceMessages;
        }

        return {
            current,
            limit,
            remaining: Math.max(0, limit - current),
            percentUsed: Math.round((current / limit) * 100),
            allowed: current < limit,
        };
    },
});

export const getUsageStats = query({
    args: {
        userId: v.id("users"),
        tier: v.union(
            v.literal("free"),
            v.literal("learner"),
            v.literal("fluent"),
            v.literal("organization"),
        ),
    },
    handler: async (ctx, args) => {
        const limits = PLAN_LIMITS[args.tier];
        const { counts, periodStart, periodEnd } = await readUsagePeriod(ctx.db, args.userId);

        return {
            chat: {
                current: counts.chatMessages,
                limit: limits.monthlyMessages,
                percentUsed: Math.round((counts.chatMessages / limits.monthlyMessages) * 100),
            },
            translate: {
                current: counts.translateRequests,
                limit: limits.monthlyTranslations,
                percentUsed: Math.round((counts.translateRequests / limits.monthlyTranslations) * 100),
            },
            voice: {
                current: counts.voiceMessages,
                limit: limits.monthlyVoiceMessages,
                minutes: counts.voiceMinutes,
                maxMinutes: limits.voiceMinutes,
                percentUsed: Math.round((counts.voiceMessages / limits.monthlyVoiceMessages) * 100),
            },
            periodStart,
            periodEnd,
        };
    },
});
