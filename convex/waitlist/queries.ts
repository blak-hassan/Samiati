import { v } from "convex/values";
import { query } from "../_generated/server";
import { getWaitlistCount } from "./utils";

export const getCount = query({
    args: {},
    handler: async (ctx) => {
        return { count: await getWaitlistCount(ctx) };
    },
});

export const getStatus = query({
    args: { visitorId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const visitorId = args.visitorId;
        const identity = await ctx.auth.getUserIdentity();

        const entry = identity
            ? await ctx.db
                  .query("waitlist")
                  .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
                  .first()
            : visitorId
              ? await ctx.db
                    .query("waitlist")
                    .withIndex("by_visitorId", (q) => q.eq("visitorId", visitorId))
                    .first()
              : null;

        return {
            joined: entry !== null,
            position: entry?.position ?? null,
        };
    },
});
