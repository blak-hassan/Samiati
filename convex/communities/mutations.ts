import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";
import { isValidAvatarUrl } from "../lib/validation";

const MAX_COMMUNITY_NAME = 100;
const MAX_COMMUNITY_DESCRIPTION = 1000;

// Create community
export const create = mutation({
    args: {
        name: v.string(),
        description: v.string(),
        category: v.string(),
        avatar: v.optional(v.string()),
        coverImage: v.optional(v.string()),
        isPrivate: v.boolean(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        if (!args.name.trim()) {
            throw new Error("Community name cannot be empty");
        }
        if (args.name.length > MAX_COMMUNITY_NAME) {
            throw new Error(`Name exceeds maximum length of ${MAX_COMMUNITY_NAME}`);
        }
        if (args.description.length > MAX_COMMUNITY_DESCRIPTION) {
            throw new Error(`Description exceeds maximum length of ${MAX_COMMUNITY_DESCRIPTION}`);
        }
        if (args.avatar && !isValidAvatarUrl(args.avatar)) {
            throw new Error("Avatar must be a valid http(s) URL");
        }
        if (args.coverImage && !isValidAvatarUrl(args.coverImage)) {
            throw new Error("Cover image must be a valid http(s) URL");
        }

        const communityId = await ctx.db.insert("communities", {
            name: args.name.trim().slice(0, MAX_COMMUNITY_NAME),
            description: args.description.trim().slice(0, MAX_COMMUNITY_DESCRIPTION),
            category: args.category,
            avatar: args.avatar,
            coverImage: args.coverImage,
            isPrivate: args.isPrivate,
            memberCount: 1,
            createdBy: user._id,
            createdAt: Date.now(),
        });

        // Add creator as admin
        await ctx.db.insert("communityMembers", {
            communityId,
            userId: user._id,
            role: 'admin',
            joinedAt: Date.now(),
        });

        return communityId;
    },
});

// Join community
export const join = mutation({
    args: {
        communityId: v.id("communities"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const existing = await ctx.db
            .query("communityMembers")
            .withIndex("by_community", (q) => q.eq("communityId", args.communityId))
            .filter(q => q.eq(q.field("userId"), user._id))
            .first();

        if (existing) return; // Already linked

        await ctx.db.insert("communityMembers", {
            communityId: args.communityId,
            userId: user._id,
            role: 'member',
            joinedAt: Date.now(),
        });

        const community = await ctx.db.get(args.communityId);
        if (community) {
            await ctx.db.patch(args.communityId, {
                memberCount: community.memberCount + 1
            });

            // Notify community admins
            const admins = await ctx.db
                .query("communityMembers")
                .withIndex("by_community", (q) => q.eq("communityId", args.communityId))
                .filter(q => q.eq(q.field("role"), "admin"))
                .collect();

            for (const admin of admins) {
                if (admin.userId !== user._id) {
                    await ctx.db.insert("notifications", {
                        userId: admin.userId,
                        type: "community_join",
                        title: "New Member",
                        message: `${user.name} joined ${community.name}`,
                        time: Date.now(),
                        isRead: false,
                        targetScreen: "COMMUNITY",
                        metadata: { communityId: args.communityId }
                    });
                }
            }
        }
    },
});

// Leave community
export const leave = mutation({
    args: {
        communityId: v.id("communities"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const membership = await ctx.db
            .query("communityMembers")
            .withIndex("by_community", (q) => q.eq("communityId", args.communityId))
            .filter(q => q.eq(q.field("userId"), user._id))
            .first();

        if (!membership) return;

        await ctx.db.delete(membership._id);

        const community = await ctx.db.get(args.communityId);
        if (community) {
            await ctx.db.patch(args.communityId, {
                memberCount: Math.max(0, community.memberCount - 1)
            });
        }
    },
});
