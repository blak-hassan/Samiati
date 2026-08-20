import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

const MAX_QUERY_LENGTH = 5000;
const MAX_LANGUAGE_LENGTH = 50;
const SMS_PER_NUMBER_HOUR = 5;
const SMS_PER_NUMBER_DAY = 20;

// True when a webhook secret has been configured in the deployment.
export function smsWebhookConfigured(): boolean {
    return Boolean(process.env.SMS_WEBHOOK_SECRET);
}

// Public entry point for the SMS pipeline. This is the ONLY action reachable
// from the Next.js route without a user session; it is gated by a shared
// secret (server-to-server only, never shipped to browsers) plus per-number
// rate limits, and it delegates to the internal search core.
export const processSmsSearch = action({
    args: {
        secret: v.string(),
        phoneNumber: v.string(),
        query: v.string(),
        language: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<{ answer: string; followUps: string[] }> => {
        const configured = process.env.SMS_WEBHOOK_SECRET;
        if (!configured) {
            throw new Error("SMS webhook secret is not configured on the server.");
        }
        if (!args.secret || args.secret !== configured) {
            throw new Error("Unauthorized");
        }

        if (!args.query.trim() || args.query.length > MAX_QUERY_LENGTH) {
            return {
                answer: "ERROR: Please send a question under 5,000 characters.",
                followUps: [],
            };
        }
        if (!/^\+?[0-9]{6,15}$/.test(args.phoneNumber)) {
            throw new Error("Invalid phone number");
        }

        const language = (args.language ?? "English").slice(0, MAX_LANGUAGE_LENGTH);

        // Per-number rate limit. The phone number is the caller's only stable
        // identifier, so the limit is keyed on it.
        const limitKey = `sms:number:${args.phoneNumber}`;
        const hourly = await ctx.runMutation(internal.smsRateLimit.checkSmsRateLimit, {
            key: limitKey,
            windowMs: 60 * 60 * 1000,
            max: SMS_PER_NUMBER_HOUR,
        });
        if (!hourly.allowed) {
            return {
                answer: "ERROR: Too many requests. Please try again later.",
                followUps: [],
            };
        }
        const daily = await ctx.runMutation(internal.smsRateLimit.checkSmsRateLimit, {
            key: limitKey,
            windowMs: 24 * 60 * 60 * 1000,
            max: SMS_PER_NUMBER_DAY,
        });
        if (!daily.allowed) {
            return {
                answer: "ERROR: Daily request limit reached. Please try again tomorrow.",
                followUps: [],
            };
        }

        const result: { answer: string; followUps: string[] } = await ctx.runAction(
            internal.sunflower.searchInternal,
            {
                query: args.query,
                language,
                links: [],
                document: "",
            },
        );

        return {
            answer: result.answer,
            followUps: result.followUps.slice(0, 2),
        };
    },
});