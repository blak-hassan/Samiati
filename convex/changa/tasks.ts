import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, isModerator } from "../users/utils";
import { getLooseDb, LooseDoc } from "./db";
import {
    changaInputFieldValidator,
    changaPriorityValidator,
    changaRewardProfileValidator,
    changaSchemaFieldValidator,
    changaSourceModeValidator,
    changaTaskStatusValidator,
    changaTaskTypeValidator,
} from "./validators";

type TaskDoc = LooseDoc & {
    status?: string;
    languageCode?: string;
    campaignId?: string;
    taskType?: string;
    priority?: string;
    expiresAt?: number;
    createdAt?: number;
};

const priorityWeight: Record<string, number> = {
    critical: 4,
    high: 3,
    normal: 2,
    low: 1,
};

export const listTaskTemplates = query({
    args: {
        activeOnly: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const db = getLooseDb(ctx);
        const templates = await db.query("changaTaskTemplates").collect();

        if (args.activeOnly === false) {
            return templates;
        }

        return templates.filter((template) => template.isActive !== false);
    },
});

export const createTaskTemplate = mutation({
    args: {
        name: v.string(),
        taskType: changaTaskTypeValidator,
        instructions: v.string(),
        sourceMode: changaSourceModeValidator,
        inputSchema: v.array(changaSchemaFieldValidator),
        outputSchema: v.array(changaSchemaFieldValidator),
        requiresAudio: v.boolean(),
        requiresTranslation: v.boolean(),
        requiresValidationCount: v.number(),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized");
        }

        const db = getLooseDb(ctx);
        return db.insert("changaTaskTemplates", {
            ...args,
            isActive: args.isActive ?? true,
            createdBy: user._id,
            createdAt: Date.now(),
        });
    },
});

export const listAvailableTasks = query({
    args: {
        languageCode: v.optional(v.string()),
        campaignId: v.optional(v.id("changaCampaigns")),
        taskType: v.optional(changaTaskTypeValidator),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const db = getLooseDb(ctx);
        const now = Date.now();

        // Use index to filter by language + status instead of full table scan
        const tasksQuery = db.query("changaTasks")
            .withIndex("by_language_status", (q: any) =>
                args.languageCode
                    ? q.eq("languageCode", args.languageCode).eq("status", "open")
                    : q.eq("status", "open")
            );

        const tasks = (await tasksQuery.collect()) as TaskDoc[];

        return tasks
            .filter((task) => !args.campaignId || task.campaignId === args.campaignId)
            .filter((task) => !args.taskType || task.taskType === args.taskType)
            .filter((task) => !task.expiresAt || task.expiresAt > now)
            .sort((left, right) => {
                const priorityDelta =
                    (priorityWeight[right.priority || "normal"] || 0) -
                    (priorityWeight[left.priority || "normal"] || 0);

                if (priorityDelta !== 0) {
                    return priorityDelta;
                }

                return (right.createdAt || 0) - (left.createdAt || 0);
            })
            .slice(0, args.limit ?? 25);
    },
});

export const getTask = query({
    args: {
        taskId: v.id("changaTasks"),
    },
    handler: async (ctx, args) => {
        const db = getLooseDb(ctx);
        return db.get(args.taskId);
    },
});

export const createTask = mutation({
    args: {
        templateId: v.optional(v.id("changaTaskTemplates")),
        campaignId: v.optional(v.id("changaCampaigns")),
        challengeId: v.optional(v.id("challenges")),
        taskType: changaTaskTypeValidator,
        languageCode: v.string(),
        dialectCode: v.optional(v.string()),
        regionCode: v.optional(v.string()),
        domain: v.optional(v.string()),
        difficulty: v.optional(v.union(
            v.literal("beginner"),
            v.literal("intermediate"),
            v.literal("advanced"),
        )),
        promptSourceText: v.optional(v.string()),
        promptTargetText: v.optional(v.string()),
        promptAudioAssetId: v.optional(v.string()),
        promptFields: v.optional(v.array(changaInputFieldValidator)),
        priority: v.optional(changaPriorityValidator),
        rewardProfile: v.optional(changaRewardProfileValidator),
        status: v.optional(changaTaskStatusValidator),
        targetSubmissionCount: v.number(),
        targetValidationCount: v.number(),
        expiresAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized");
        }

        const db = getLooseDb(ctx);
        return db.insert("changaTasks", {
            ...args,
            priority: args.priority ?? "normal",
            status: args.status ?? "open",
            createdBy: user._id,
            createdAt: Date.now(),
        });
    },
});
