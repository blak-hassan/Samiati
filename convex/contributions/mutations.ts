import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";

// Submit a new contribution
export const submit = mutation({
    args: {
        type: v.string(), // Word, Story, etc
        title: v.string(),
        subtitle: v.string(),
        content: v.string(),
        icon: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const contributionId = await ctx.db.insert("contributions", {
            userId: user._id,
            type: args.type,
            title: args.title,
            subtitle: args.subtitle,
            content: args.content,
            status: "Under Review",
            statusColor: "text-warning",
            dotColor: "bg-warning",
            icon: args.icon,
            likes: 0,
            dislikes: 0,
            commentsCount: 0,
        });

        // Notify admins/moderators?

        return contributionId;
    },
});

// Moderate contribution (Approve/Reject)
export const moderate = mutation({
    args: {
        contributionId: v.id("contributions"),
        action: v.union(v.literal("approve"), v.literal("reject")),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
            throw new Error("Unauthorized");
        }

        const contribution = await ctx.db.get(args.contributionId);
        if (!contribution) throw new Error("Contribution not found");

        if (args.action === "approve") {
            await ctx.db.patch(args.contributionId, {
                status: "Live",
                statusColor: "text-success",
                dotColor: "bg-success",
            });
            // Notify user
            await ctx.db.insert("notifications", {
                userId: contribution.userId,
                type: "contribution",
                title: "Contribution Approved",
                message: `Your contribution "${contribution.title}" is now live!`,
                time: Date.now(),
                isRead: false,
                targetScreen: "CONTRIBUTIONS"
            });
        } else {
            await ctx.db.patch(args.contributionId, {
                status: "Declined",
                statusColor: "text-error", // assuming error color exists or use red-500
                dotColor: "bg-error",
            });
            // Notify user
            await ctx.db.insert("notifications", {
                userId: contribution.userId,
                type: "contribution",
                title: "Contribution Declined",
                message: `Your contribution "${contribution.title}" was declined. Reason: ${args.reason ?? "Guidelines"}`,
                time: Date.now(),
                isRead: false,
                targetScreen: "CONTRIBUTIONS"
            });
        }
    },
});
