import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, isModerator } from "../users/utils";
import { getLooseDb } from "./db";
import { changaCampaignStatusValidator, changaRewardProfileValidator, changaTaskTypeValidator } from "./validators";

export const listActiveCampaigns = query({
    args: {
        languageCode: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const db = getLooseDb(ctx);
        
        // Use indexed query for active campaigns
        const campaigns = await db.query("changaCampaigns")
            .withIndex("by_status", (q: any) => q.eq("status", "active"))
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

        const db = getLooseDb(ctx);
        return db.insert("changaCampaigns", {
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

export const getCampaignLeaderboard = query({
    args: {
        campaignId: v.id("changaCampaigns"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const db = getLooseDb(ctx);
        
        // Use indexed query for tasks by campaign
        const tasks = await db.query("changaTasks")
            .withIndex("by_campaign_status", (q: any) => q.eq("campaignId", args.campaignId))
            .collect();
        
        const campaignTaskIds = new Set(tasks.map((task) => task._id));

        // Use indexed queries for submissions per task (batch)
        const submissionsPromises = tasks.map(task => 
            db.query("changaSubmissions")
                .withIndex("by_task_status", (q: any) => q.eq("taskId", task._id))
                .collect()
        );
        const submissionsArrays = await Promise.all(submissionsPromises);
        const submissions = submissionsArrays.flat();

        const userCounts = submissions.reduce<Record<string, number>>((accumulator, submission) => {
            const userId = submission.userId;

            if (typeof userId === "string") {
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
