import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, isModerator } from "../users/utils";
import { changaSplitRecommendationValidator } from "./validators";
import type { Id } from "../_generated/dataModel";

// Create an evaluation set. Evaluation items are authored/selected under a
// different workflow and held separately from the normal task/review feed.
export const createEvaluationSet = mutation({
    args: {
        name: v.string(),
        languageCode: v.string(),
        description: v.optional(v.string()),
        accessRole: v.union(
            v.literal("admin"),
            v.literal("moderator"),
            v.literal("expert"),
        ),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized: Only moderators can create evaluation sets");
        }

        return ctx.db.insert("changaEvaluationSets", {
            name: args.name.trim().slice(0, 200),
            languageCode: args.languageCode,
            description: args.description?.trim().slice(0, 2000),
            accessRole: args.accessRole,
            isFrozen: false,
            createdAt: Date.now(),
            createdBy: user._id,
        });
    },
});

// Add a curated example to an evaluation set. Prevents contamination by
// refusing to add an example that is already in a training release.
export const addEvaluationItem = mutation({
    args: {
        evaluationSetId: v.id("changaEvaluationSets"),
        exampleId: v.id("changaCuratedExamples"),
        split: changaSplitRecommendationValidator,
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized: Only moderators can add evaluation items");
        }

        const evaluationSet = await ctx.db.get(args.evaluationSetId);
        if (!evaluationSet) throw new Error("Evaluation set not found");
        if (evaluationSet.isFrozen) {
            throw new Error("This evaluation set is frozen and cannot be modified");
        }

        const example = await ctx.db.get(args.exampleId);
        if (!example) throw new Error("Curated example not found");

        // Contamination guard: an example already in a training release
        // (split "train") must not be added to an evaluation set.
        const inTrainingRelease = await ctx.db.query("changaReleaseMembers")
            .withIndex("by_example", (q) => q.eq("exampleId", args.exampleId))
            .filter((q) => q.eq(q.field("split"), "train"))
            .first();
        if (inTrainingRelease) {
            throw new Error("This example is already in a training release and cannot be used for evaluation");
        }

        // Prevent duplicate membership.
        const existing = await ctx.db.query("changaEvaluationItems")
            .withIndex("by_evaluationSet", (q) => q.eq("evaluationSetId", args.evaluationSetId))
            .filter((q) => q.eq(q.field("exampleId"), args.exampleId))
            .first();
        if (existing) return existing._id;

        return ctx.db.insert("changaEvaluationItems", {
            evaluationSetId: args.evaluationSetId,
            exampleId: args.exampleId,
            split: args.split,
            addedAt: Date.now(),
            addedBy: user._id,
        });
    },
});

// Freeze an evaluation set so it can no longer be modified. This is the
// "no-training guardrail" — frozen sets are the only ones used for evaluation.
export const freezeEvaluationSet = mutation({
    args: {
        evaluationSetId: v.id("changaEvaluationSets"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized: Only moderators can freeze evaluation sets");
        }

        const evaluationSet = await ctx.db.get(args.evaluationSetId);
        if (!evaluationSet) throw new Error("Evaluation set not found");

        await ctx.db.patch(args.evaluationSetId, { isFrozen: true });
        return args.evaluationSetId;
    },
});

// Add a curated example to a dataset release with a split assignment.
// A release may reference an example, not mutate it.
export const addReleaseMember = mutation({
    args: {
        releaseId: v.id("changaDatasetReleases"),
        exampleId: v.id("changaCuratedExamples"),
        split: changaSplitRecommendationValidator,
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized: Only moderators can add release members");
        }

        const release = await ctx.db.get(args.releaseId);
        if (!release) throw new Error("Dataset release not found");

        const example = await ctx.db.get(args.exampleId);
        if (!example) throw new Error("Curated example not found");
        if (example.releaseStatus !== "approved" && example.releaseStatus !== "exported") {
            throw new Error("Example must be approved before it can be added to a release");
        }

        // Contamination guard: an example already in an evaluation set must
        // not be assigned to a training split.
        if (args.split === "train") {
            const inEvaluation = await ctx.db.query("changaEvaluationItems")
                .withIndex("by_example", (q) => q.eq("exampleId", args.exampleId))
                .first();
            if (inEvaluation) {
                throw new Error("This example is in an evaluation set and cannot be used for training");
            }
        }

        // Prevent duplicate membership.
        const existing = await ctx.db.query("changaReleaseMembers")
            .withIndex("by_release", (q) => q.eq("releaseId", args.releaseId))
            .filter((q) => q.eq(q.field("exampleId"), args.exampleId))
            .first();
        if (existing) return existing._id;

        const memberId = await ctx.db.insert("changaReleaseMembers", {
            releaseId: args.releaseId,
            exampleId: args.exampleId,
            split: args.split,
            addedAt: Date.now(),
        });

        // Update the release's example count.
        const members = await ctx.db.query("changaReleaseMembers")
            .withIndex("by_release", (q) => q.eq("releaseId", args.releaseId))
            .collect();
        await ctx.db.patch(args.releaseId, { exampleCount: members.length });

        return memberId;
    },
});

// List evaluation sets (moderator/expert only).
export const listEvaluationSets = query({
    args: {
        languageCode: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized: Only moderators can view evaluation sets");
        }

        const sets = await ctx.db.query("changaEvaluationSets")
            .withIndex("by_language", (q) => q.eq("languageCode", args.languageCode ?? ""))
            .collect();

        return sets.slice(0, args.limit ?? 50);
    },
});

// List release members for a dataset release.
export const listReleaseMembers = query({
    args: {
        releaseId: v.id("changaDatasetReleases"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized: Only moderators can view release members");
        }

        const members = await ctx.db.query("changaReleaseMembers")
            .withIndex("by_release", (q) => q.eq("releaseId", args.releaseId))
            .collect();

        return members.slice(0, args.limit ?? 100);
    },
});

export type EvaluationSetId = Id<"changaEvaluationSets">;