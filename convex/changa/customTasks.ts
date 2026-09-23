import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { getCurrentUser } from "../users/utils";
import { chokepoint } from "../lib/chokepoint";
import { changaInputFieldValidator, changaTaskTypeValidator } from "./validators";
import type { Id } from "../_generated/dataModel";

export const createCustomTemplate = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        taskType: changaTaskTypeValidator,
        languageCode: v.optional(v.string()),
        campaignId: v.optional(v.id("changaCampaigns")),
        inputSchema: v.array(changaInputFieldValidator),
        successCriteria: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");
        if (args.inputSchema.length === 0) {
            throw new Error("Custom templates need at least one input field");
        }
        return chokepoint.insertCustomTaskTemplate(ctx, {
            creatorId: user._id,
            campaignId: args.campaignId,
            title: args.title.slice(0, 200),
            description: args.description.slice(0, 2000),
            taskType: args.taskType,
            languageCode: args.languageCode,
            inputSchema: args.inputSchema,
            successCriteria: args.successCriteria?.slice(0, 2000),
            createdAt: Date.now(),
        });
    },
});

export const getCustomTemplate = query({
    args: {
        templateId: v.id("changaCustomTaskTemplates"),
    },
    handler: async (ctx, args) => {
        return ctx.db.get(args.templateId);
    },
});

export const listCustomTemplatesForCampaign = query({
    args: {
        campaignId: v.id("changaCampaigns"),
    },
    handler: async (ctx, args) => {
        return ctx.db.query("changaCustomTaskTemplates")
            .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
            .order("desc")
            .collect();
    },
});

// Submit a custom-template submission. Reuses the standard claim →
// start → submit pipeline so XP + badges + processing all work
// unchanged. Field-level validation is done server-side from the
// template's `inputSchema`.
export const submitCustomSubmission: ReturnType<typeof mutation> = mutation({
    args: {
        taskId: v.id("changaTasks"),
        templateId: v.id("changaCustomTaskTemplates"),
        responses: v.record(v.string(), v.string()),
        audioStorageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args): Promise<{ submissionId: Id<"changaSubmissions">; xp: unknown }> => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");
        const task = await ctx.db.get(args.taskId);
        if (!task) throw new Error("Task not found");
        const template = await ctx.db.get(args.templateId);
        if (!template) throw new Error("Custom template not found");

        for (const field of template.inputSchema) {
            if (field.required && !args.responses[field.id]?.trim()) {
                throw new Error(`Missing required field: ${field.label}`);
            }
        }

        const targetText = Object.entries(args.responses)
            .map(([fieldId, value]) => `${fieldId}: ${value}`)
            .join("\n");

        const claim = (await ctx.runMutation(api.changa.tasks.claimTask, {
            taskId: args.taskId,
        })) as { claimId: Id<"changaTaskClaims"> };
        const submissionId = (await ctx.runMutation(api.changa.submissions.startClaimedSubmission, {
            claimId: claim.claimId,
            consent: {
                isGranted: true,
                allowTraining: true,
                allowResearch: false,
                allowPublicAttribution: true,
                grantedAt: Date.now(),
            },
            consentPolicyVersion: "changa-pilot-v1",
        })) as Id<"changaSubmissions">;
        const xp = await ctx.runMutation(api.changa.submissions.submitSubmission, {
            submissionId,
            targetText,
            contextNote: `custom:${args.templateId}`,
        });
        return { submissionId, xp };
    },
});
