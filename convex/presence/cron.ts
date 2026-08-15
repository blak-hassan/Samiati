import { internalMutation } from "../_generated/server";

// Mark users as offline if they haven't sent a heartbeat in 5 minutes
export const cleanupStalePresence = internalMutation({
    args: {},
    handler: async (ctx) => {
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

        // Indexed range over isOnline=true instead of a full users table scan.
        const onlineUsers = await ctx.db
            .query("users")
            .withIndex("by_isOnline", (q) => q.eq("isOnline", true))
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
