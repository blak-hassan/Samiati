import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, isModerator } from "../users/utils";
import { changaCampaignStatusValidator, changaRewardProfileValidator, changaTaskTypeValidator } from "./validators";
import type { Id } from "../_generated/dataModel";

export const listActiveCampaigns = query({
    args: {
        languageCode: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const campaigns = await ctx.db.query("changaCampaigns")
            .withIndex("by_status", (q) => q.eq("status", "active"))
            .collect();

        return campaigns
            .filter((campaign) => !args.languageCode || campaign.languageCode === args.languageCode)
            .slice(0, args.limit ?? 20);
    },
});

export const createCampaign = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        languageCode: v.optional(v.string()),
        taskTypes: v.array(changaTaskTypeValidator),
        goalCount: v.number(),
        rewardProfile: v.optional(changaRewardProfileValidator),
        startAt: v.optional(v.number()),
        endAt: v.optional(v.number()),
        status: v.optional(changaCampaignStatusValidator),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        if (!isModerator(user)) {
            throw new Error("Unauthorized: Only moderators and admins can create campaigns");
        }

        return ctx.db.insert("changaCampaigns", {
            title: args.title.slice(0, 200),
            description: args.description.slice(0, 2000),
            languageCode: args.languageCode,
            taskTypes: args.taskTypes,
            goalCount: args.goalCount,
            currentCount: 0,
            rewardProfile: args.rewardProfile,
            startAt: args.startAt ?? Date.now(),
            endAt: args.endAt,
            status: args.status ?? "draft",
            createdBy: user._id,
            createdAt: Date.now(),
        });
    },
});

// Phase 5: Trusted contributors can submit campaign proposals — not create
// live collection work. A moderator/data steward approves, adapts or rejects.
export const submitCampaignProposal = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        languageCode: v.optional(v.string()),
        taskTypes: v.array(changaTaskTypeValidator),
        goalCount: v.number(),
        rationale: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        return ctx.db.insert("changaCampaignProposals", {
            title: args.title.slice(0, 200),
            description: args.description.slice(0, 2000),
            languageCode: args.languageCode,
            taskTypes: args.taskTypes,
            goalCount: args.goalCount,
            rationale: args.rationale?.slice(0, 2000),
            status: "pending",
            proposedBy: user._id,
            createdAt: Date.now(),
        });
    },
});

export const listCampaignProposals = query({
    args: {
        status: v.optional(v.union(
            v.literal("pending"),
            v.literal("approved"),
            v.literal("adapted"),
            v.literal("rejected"),
        )),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        const proposals = await ctx.db.query("changaCampaignProposals")
            .withIndex("by_status", (q) => q.eq("status", args.status ?? "pending"))
            .collect();

        // Non-moderators can only see their own proposals.
        if (!isModerator(user)) {
            return proposals
                .filter((proposal) => proposal.proposedBy === user._id)
                .slice(0, args.limit ?? 20);
        }

        return proposals.slice(0, args.limit ?? 50);
    },
});

export const reviewCampaignProposal = mutation({
    args: {
        proposalId: v.id("changaCampaignProposals"),
        decision: v.union(
            v.literal("approved"),
            v.literal("adapted"),
            v.literal("rejected"),
        ),
        reviewNote: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized: Only moderators can review campaign proposals");
        }

        const proposal = await ctx.db.get(args.proposalId);
        if (!proposal) throw new Error("Campaign proposal not found");
        if (proposal.status !== "pending") {
            throw new Error("This proposal has already been reviewed");
        }

        await ctx.db.patch(args.proposalId, {
            status: args.decision,
            reviewedBy: user._id,
            reviewedAt: Date.now(),
            reviewNote: args.reviewNote?.slice(0, 2000),
        });

        // If approved, create a live campaign from the proposal.
        if (args.decision === "approved") {
            await ctx.db.insert("changaCampaigns", {
                title: proposal.title,
                description: proposal.description,
                languageCode: proposal.languageCode,
                taskTypes: proposal.taskTypes,
                goalCount: proposal.goalCount,
                currentCount: 0,
                startAt: Date.now(),
                status: "active",
                createdBy: user._id,
                createdAt: Date.now(),
            });
        }

        return args.proposalId;
    },
});

export const getCampaignLeaderboard = query({
    args: {
        campaignId: v.id("changaCampaigns"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const tasks = await ctx.db.query("changaTasks")
            .withIndex("by_campaign_status", (q) => q.eq("campaignId", args.campaignId))
            .collect();

        const submissionsArrays = await Promise.all(
            tasks.map((task) =>
                ctx.db.query("changaSubmissions")
                    .withIndex("by_task_status", (q) => q.eq("taskId", task._id))
                    .collect()
            ),
        );
        const submissions = submissionsArrays.flat();

        const userCounts = submissions.reduce<Record<string, number>>((accumulator, submission) => {
            if (submission.userId) {
                const userId = String(submission.userId);
                accumulator[userId] = (accumulator[userId] || 0) + 1;
            }
            return accumulator;
        }, {});

        return Object.entries(userCounts)
            .map(([userId, submissionCount]) => ({ userId, submissionCount }))
            .sort((left, right) => right.submissionCount - left.submissionCount)
            .slice(0, args.limit ?? 10);
    },
});

export type CampaignId = Id<"changaCampaigns">;