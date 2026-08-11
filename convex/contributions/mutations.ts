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
        language: v.optional(v.string()),
        dialect: v.optional(v.string()),
        partOfSpeech: v.optional(v.string()),
        phoneticText: v.optional(v.string()),
        examples: v.optional(v.array(v.object({ local: v.string(), translation: v.string() }))),
        isDraft: v.optional(v.boolean()),
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
            language: args.language,
            dialect: args.dialect,
            partOfSpeech: args.partOfSpeech,
            phoneticText: args.phoneticText,
            examples: args.examples,
            status: args.isDraft ? "Draft" : "Under Review",
            statusColor: args.isDraft ? "text-stone-500" : "text-warning",
            dotColor: args.isDraft ? "bg-stone-500" : "bg-warning",
            icon: args.icon,
            likes: 0,
            dislikes: 0,
            commentsCount: 0,
            verificationScore: 0,
            verifiedBy: [],
        });

        if (!args.isDraft) {
            // Notify admins/moderators
            const admins = await ctx.db.query("users").withIndex("by_role", q => q.eq("role", "admin")).collect();
            const moderators = await ctx.db.query("users").withIndex("by_role", q => q.eq("role", "moderator")).collect();
            
            const reviewers = [...admins, ...moderators];
            for (const reviewer of reviewers) {
                if (reviewer._id === user._id) continue;
                
                await ctx.db.insert("notifications", {
                    userId: reviewer._id,
                    type: "contribution",
                    title: "New Contribution for Review",
                    message: `A new ${args.type} "${args.title}" was submitted and needs review.`,
                    time: Date.now(),
                    isRead: false,
                    targetScreen: "MODERATION_DASHBOARD",
                    metadata: { contributionId }
                });
            }
        }

        return contributionId;
    },
});

// Moderate contribution (Approve/Reject)
export const moderate = mutation({
    args: {
        contributionId: v.id("contributions"),
        action: v.union(v.literal("approve"), v.literal("reject"), v.literal("needs_revision")),
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
        } else if (args.action === "needs_revision") {
            await ctx.db.patch(args.contributionId, {
                status: "Needs Revision",
                statusColor: "text-amber-500",
                dotColor: "bg-amber-500",
                moderatorNotes: args.reason,
            });
            await ctx.db.insert("notifications", {
                userId: contribution.userId,
                type: "contribution",
                title: "Revision Requested",
                message: `Your contribution "${contribution.title}" needs some changes: ${args.reason}`,
                time: Date.now(),
                isRead: false,
                targetScreen: "CONTRIBUTIONS"
            });
        } else {
            await ctx.db.patch(args.contributionId, {
                status: "Declined",
                statusColor: "text-error", // assuming error color exists or use red-500
                dotColor: "bg-error",
                moderatorNotes: args.reason,
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
