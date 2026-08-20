import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkRateLimit } from "./lib/rateLimit";

// Per-bucket counter for the public Wikipedia proxy route. The route passes
// a caller-derived bucket (client IP); counters live in the shared
// `rateLimits` table with the same sliding-window semantics used elsewhere.
export const check = mutation({
    args: {
        bucket: v.string(),
        windowMs: v.number(),
        maxRequests: v.number(),
    },
    handler: async (ctx, args) => {
        const key = `wiki:${args.bucket}`.slice(0, 120);
        return checkRateLimit(ctx.db, key, args.windowMs, args.maxRequests);
    },
});