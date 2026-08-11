import { internalMutation } from "../_generated/server";

// Mark users as offline if they haven't sent a heartbeat in 5 minutes
export const cleanupStalePresence = internalMutation({
    args: {},
    handler: async (ctx) => {
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

        // Use index if available, otherwise filter in memory
        // Note: This runs infrequently (every 2 min) so full scan is acceptable
        // but we limit to only patch stale users
        const onlineUsers = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("isOnline"), true))
            .collect();

        let cleanedCount = 0;
        const staleUsers = onlineUsers.filter(user => 
            user.lastSeen && user.lastSeen < fiveMinutesAgo
        );

        // Batch the updates (Convex doesn't support true batching, but we minimize overhead)
        for (const user of staleUsers) {
            await ctx.db.patch(user._id, {
                isOnline: false,
            });
            cleanedCount++;
        }

        return { cleanedCount };
    },
});
