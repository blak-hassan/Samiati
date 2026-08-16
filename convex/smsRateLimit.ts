import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { checkRateLimit } from "./lib/rateLimit";

/**
 * Internal mutation backing the SMS webhook rate limits. Defined outside
 * `sms.ts` so the SMS action never references its own module through the
 * generated `internal` API (which would create a circular type).
 */
export const checkSmsRateLimit = internalMutation({
    args: {
        key: v.string(),
        windowMs: v.number(),
        max: v.number(),
    },
    handler: async (ctx, args) => {
        return checkRateLimit(ctx.db, args.key, args.windowMs, args.max);
    },
});