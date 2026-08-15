import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, isModerator } from "../users/utils";
import {
    changaConsentScopeValidator,
    changaInputFieldValidator,
    changaPriorityValidator,
    changaRewardProfileValidator,
    changaSchemaFieldValidator,
    changaSourceModeValidator,
    changaTaskClaimStatusValidator,
    changaTaskStatusValidator,
    changaTaskTypeValidator,
} from "./validators";

const TASK_CLAIM_DURATION_MS = 20 * 60 * 1000;

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
        const templates = await ctx.db.query("changaTaskTemplates").collect();

        if (args.activeOnly === false) {
            return templates;
        }

        return templates.filter((template) => template.isActive !== false);
    },
});

// Create a versioned task template. The version is explicit so tasks and
// submissions can be traced to the contract that produced them; changing the
// contract means creating a new template version, never mutating history.
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
        templateVersion: v.optional(v.number()),
        rubricVersion: v.optional(v.string()),
        riskTier: v.optional(v.union(
            v.literal("low"),
            v.literal("medium"),
            v.literal("high"),
        )),
        destinationDataProduct: v.optional(v.string()),
        requiredConsentScopes: v.optional(v.array(changaConsentScopeValidator)),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized");
        }

        return ctx.db.insert("changaTaskTemplates", {
            ...args,
            templateVersion: args.templateVersion ?? 1,
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
        const now = Date.now();

        // Use the status-only index when no language is given, otherwise the
        // language+status composite.
        const tasks = await ctx.db.query("changaTasks")
            .withIndex(args.languageCode ? "by_language_status" : "by_status", (q) =>
                args.languageCode
                    ? q.eq("languageCode", args.languageCode).eq("status", "open")
                    : q.eq("status", "open")
            )
            .collect();

        return tasks
            .filter((task) => !args.campaignId || task.campaignId === args.campaignId)
            .filter((task) => !args.taskType || task.taskType === args.taskType)
            .filter((task) => !task.expiresAt || task.expiresAt > now)
            .sort((left, right) => {
                const priorityDelta =
                    (priorityWeight[right.priority] || 0) -
                    (priorityWeight[left.priority] || 0);

                if (priorityDelta !== 0) {
                    return priorityDelta;
                }

                return right.createdAt - left.createdAt;
            })
            .slice(0, args.limit ?? 25);
    },
});

export const getTask = query({
    args: {
        taskId: v.id("changaTasks"),
    },
    handler: async (ctx, args) => {
        return ctx.db.get(args.taskId);
    },
});

export const getActiveTaskClaim = query({
    args: {
        taskId: v.id("changaTasks"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return null;

        const claims = await ctx.db.query("changaTaskClaims")
            .withIndex("by_user_task", (q) =>
                q.eq("userId", user._id).eq("taskId", args.taskId),
            )
            .collect();
        const now = Date.now();

        return claims.find(
            (claim) => claim.status === "active" && claim.expiresAt > now,
        ) ?? null;
    },
});

export const claimTask = mutation({
    args: {
        taskId: v.id("changaTasks"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const task = await ctx.db.get(args.taskId);
        const now = Date.now();
        if (!task || task.status !== "open" || (task.expiresAt && task.expiresAt <= now)) {
            throw new Error("This task is no longer available");
        }

        const existingClaims = await ctx.db.query("changaTaskClaims")
            .withIndex("by_user_task", (q) =>
                q.eq("userId", user._id).eq("taskId", args.taskId),
            )
            .collect();

        const activeClaim = existingClaims.find(
            (claim) => claim.status === "active" && claim.expiresAt > now,
        );
        if (activeClaim) {
            return { claimId: activeClaim._id, expiresAt: activeClaim.expiresAt };
        }

        if (existingClaims.some((claim) => claim.status === "submitted")) {
            throw new Error("You have already submitted this task");
        }

        await Promise.all(existingClaims
            .filter((claim) => claim.status === "active")
            .map((claim) => ctx.db.patch(claim._id, { status: "expired" })));

        const claimId = await ctx.db.insert("changaTaskClaims", {
            taskId: args.taskId,
            userId: user._id,
            status: "active",
            claimedAt: now,
            expiresAt: now + TASK_CLAIM_DURATION_MS,
        });

        return { claimId, expiresAt: now + TASK_CLAIM_DURATION_MS };
    },
});

export const releaseTaskClaim = mutation({
    args: {
        claimId: v.id("changaTaskClaims"),
        status: v.optional(changaTaskClaimStatusValidator),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const claim = await ctx.db.get(args.claimId);
        if (!claim || claim.userId !== user._id) {
            throw new Error("Task claim not found");
        }
        if (claim.status !== "active") return args.claimId;

        await ctx.db.patch(args.claimId, { status: args.status ?? "released" });
        return args.claimId;
    },
});

// Skip a claimed task. The claim is released so the task becomes available to
// other contributors, and the skip reason is kept for allocation analytics.
export const skipTask = mutation({
    args: {
        claimId: v.id("changaTaskClaims"),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const claim = await ctx.db.get(args.claimId);
        if (!claim || claim.userId !== user._id) {
            throw new Error("Task claim not found");
        }
        if (claim.status !== "active") return args.claimId;

        await ctx.db.patch(args.claimId, {
            status: "released",
            skipReason: args.reason?.slice(0, 300) ?? "user_skipped",
        });
        return args.claimId;
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
        promptAudioAssetId: v.optional(v.id("_storage")),
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

        // Snapshot the template version onto the task so submissions are
        // traceable to the contract even if a newer template is published.
        let templateVersion: number | undefined;
        if (args.templateId) {
            const template = await ctx.db.get(args.templateId);
            templateVersion = template?.templateVersion;
        }

        return ctx.db.insert("changaTasks", {
            ...args,
            templateVersion,
            priority: args.priority ?? "normal",
            status: args.status ?? "open",
            createdBy: user._id,
            createdAt: Date.now(),
        });
    },
});