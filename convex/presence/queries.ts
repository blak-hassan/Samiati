import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";

// Check if specific users are online
export const getOnlineStatus = query({
    args: {
        userIds: v.array(v.id("users")),
    },
    handler: async (ctx, args) => {
        const ONLINE_THRESHOLD = 2 * 60 * 1000; // 2 minutes
        const now = Date.now();

        const statuses = await Promise.all(
            args.userIds.map(async (userId) => {
                const user = await ctx.db.get(userId);
                if (!user) {
                    return { userId, isOnline: false, lastSeen: null };
                }

                // User is online if isOnline flag is true AND lastSeen is within threshold
                const isRecentlyActive = user.lastSeen
                    ? (now - user.lastSeen) < ONLINE_THRESHOLD
                    : false;

                return {
                    userId,
                    isOnline: user.isOnline && isRecentlyActive,
                    lastSeen: user.lastSeen || null,
                };
            })
        );

        return statuses;
    },
});

// Get single user's presence status
export const getUserPresence = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const ONLINE_THRESHOLD = 2 * 60 * 1000; // 2 minutes
        const now = Date.now();

        const user = await ctx.db.get(args.userId);
        if (!user) {
            return { isOnline: false, lastSeen: null, lastSeenFormatted: "Never" };
        }

        const isRecentlyActive = user.lastSeen
            ? (now - user.lastSeen) < ONLINE_THRESHOLD
            : false;

        // Format last seen time
        let lastSeenFormatted = "Never";
        if (user.lastSeen) {
            const diff = now - user.lastSeen;
            if (diff < 60000) {
                lastSeenFormatted = "Just now";
            } else if (diff < 3600000) {
                lastSeenFormatted = `${Math.floor(diff / 60000)}m ago`;
            } else if (diff < 86400000) {
                lastSeenFormatted = `${Math.floor(diff / 3600000)}h ago`;
            } else {
                lastSeenFormatted = new Date(user.lastSeen).toLocaleDateString();
            }
        }

        return {
            isOnline: user.isOnline && isRecentlyActive,
            lastSeen: user.lastSeen || null,
            lastSeenFormatted,
        };
    },
});
