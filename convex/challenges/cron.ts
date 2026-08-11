import { internalMutation } from "../_generated/server";

// Archive challenges that have passed their deadline
export const archiveExpiredChallenges = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();

        const activeChallenges = await ctx.db
            .query("challenges")
            .withIndex("by_status", (q) => q.eq("status", "active"))
            .collect();

        let archivedCount = 0;
        for (const challenge of activeChallenges) {
            if (challenge.deadline < now) {
                await ctx.db.patch(challenge._id, {
                    status: "ended",
                });
                archivedCount++;
            }
        }

        return { archivedCount };
    },
});
