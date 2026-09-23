import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, isModerator } from "../users/utils";
import { internal } from "../_generated/api";
import { chokepoint } from "../lib/chokepoint";
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

export const listEndedCampaigns = query({
    args: {
        languageCode: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const completed = await ctx.db.query("changaCampaigns")
            .withIndex("by_status", (q) => q.eq("status", "completed"))
            .collect();
        const archived = await ctx.db.query("changaCampaigns")
            .withIndex("by_status", (q) => q.eq("status", "archived"))
            .collect();

        const all = [...completed, ...archived]
            .filter((campaign) => !args.languageCode || campaign.languageCode === args.languageCode)
            .sort((a, b) => (b.endAt ?? b.createdAt) - (a.endAt ?? a.createdAt));

        return all.slice(0, args.limit ?? 20);
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

        return chokepoint.insertCampaign(ctx, {
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

// Phase 2F: every changa* write goes through the dataset-write
// chokepoint (`convex/changa/datasetWrites.ts`). The chokepoint's
// internal mutations are referenced via `internal.changa.datasetWrites.*`,
// which TypeScript can't resolve until `npx convex dev` regenerates
// `_generated/api.d.ts` with the chokepoint module. Until then, this
// file's mutations will report TS7022/TS7023 (implicit any) — a known
// acceptable cost until the generated bindings are refreshed.
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

        return chokepoint.insertCampaignProposal(ctx, {
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

        await ctx.runMutation(internal.changa.datasetWrites.patchCampaignProposal, {
            id: args.proposalId,
            patch: {
                status: args.decision,
                reviewedBy: user._id,
                reviewedAt: Date.now(),
                reviewNote: args.reviewNote?.slice(0, 2000),
            },
        });

        // If approved, create a live campaign from the proposal.
        if (args.decision === "approved") {
            await ctx.runMutation(internal.changa.datasetWrites.insertCampaign, {
                doc: {
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
                },
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

        // Only count validated or curated submissions toward the leaderboard.
        // Drafts, rejected, and needs_fix entries should not earn recognition.
        const counted = submissions.filter(
            (s) => s.status === "validated" || s.status === "curated"
        );

        const userCounts = counted.reduce<Record<string, number>>((accumulator, submission) => {
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

export const getCampaignWithLeaderboard = query({
    args: {
        campaignId: v.id("changaCampaigns"),
    },
    handler: async (ctx, args) => {
        const campaign = await ctx.db.get(args.campaignId);
        if (!campaign) return null;

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

        const counted = submissions.filter(
            (s) => s.status === "validated" || s.status === "curated"
        );

        const userCounts: Record<string, number> = {};
        for (const submission of counted) {
            if (!submission.userId) continue;
            const userId = String(submission.userId);
            userCounts[userId] = (userCounts[userId] || 0) + 1;
        }

        const userIds = Object.keys(userCounts);
        const userDocs = await Promise.all(userIds.map((id) => ctx.db.get(id as Id<"users">)));
        const usersById = new Map(
            userDocs.filter(Boolean).map((u) => [String(u!._id), u!])
        );

        const leaderboard = Object.entries(userCounts)
            .map(([userId, submissionCount], index) => {
                const user = usersById.get(userId);
                return {
                    rank: index + 1,
                    userId,
                    name: user?.name ?? "Unknown",
                    avatar: user?.avatar ?? "",
                    submissionCount,
                };
            })
            .sort((a, b) => b.submissionCount - a.submissionCount)
            .map((entry, index) => ({ ...entry, rank: index + 1 }));

        return {
            campaign: {
                _id: campaign._id,
                title: campaign.title,
                description: campaign.description,
                languageCode: campaign.languageCode,
                goalCount: campaign.goalCount,
                currentCount: campaign.currentCount,
                status: campaign.status,
                startAt: campaign.startAt,
                endAt: campaign.endAt,
                taskTypes: campaign.taskTypes,
            },
            leaderboard,
        };
    },
});

export type CampaignId = Id<"changaCampaigns">;