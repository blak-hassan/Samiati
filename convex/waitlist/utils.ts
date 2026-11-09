import { MutationCtx, QueryCtx } from "../_generated/server";

export const WAITLIST_STATS_KEY = "global";

export type JoinResult = {
    alreadyJoined: boolean;
    position: number | null;
};

type Joiner =
    | { kind: "clerk"; clerkId: string }
    | { kind: "guest"; visitorId: string };

export async function getWaitlistStats(ctx: QueryCtx) {
    return await ctx.db
        .query("waitlistStats")
        .withIndex("by_key", (q) => q.eq("key", WAITLIST_STATS_KEY))
        .unique();
}

export async function getWaitlistCount(ctx: QueryCtx): Promise<number> {
    const stats = await getWaitlistStats(ctx);
    return stats?.count ?? 0;
}

function requireJoiner(
    identity: { subject: string } | null,
    visitorId: string | undefined,
): Joiner {
    if (identity) {
        return { kind: "clerk", clerkId: identity.subject };
    }
    if (visitorId && visitorId.length >= 8) {
        return { kind: "guest", visitorId };
    }
    throw new Error("Missing visitor identity");
}

export async function joinWaitlist(
    ctx: MutationCtx,
    args: { visitorId?: string },
): Promise<JoinResult> {
    const identity = await ctx.auth.getUserIdentity();
    const joiner = requireJoiner(identity, args.visitorId);

    let existing;
    if (joiner.kind === "clerk") {
        existing = await ctx.db
            .query("waitlist")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", joiner.clerkId))
            .first();
    } else {
        existing = await ctx.db
            .query("waitlist")
            .withIndex("by_visitorId", (q) => q.eq("visitorId", joiner.visitorId))
            .first();
    }

    if (existing) {
        return { alreadyJoined: true, position: existing.position ?? null };
    }

    const stats = await getWaitlistStats(ctx);
    const count = stats?.count ?? 0;
    const position = count + 1;

    await ctx.db.insert("waitlist", {
        joinedVia: joiner.kind === "clerk" ? "clerk" : "guest",
        clerkId: joiner.kind === "clerk" ? joiner.clerkId : undefined,
        visitorId: joiner.kind === "guest" ? joiner.visitorId : undefined,
        position,
        joinedAt: Date.now(),
    });

    if (stats) {
        await ctx.db.patch(stats._id, { count: position });
    } else {
        await ctx.db.insert("waitlistStats", {
            key: WAITLIST_STATS_KEY,
            count: position,
        });
    }

    return { alreadyJoined: false, position };
}
