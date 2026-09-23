import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, isModerator } from "../users/utils";
import { changaSplitRecommendationValidator } from "./validators";
import { internal } from "../_generated/api";
import { chokepoint } from "../lib/chokepoint";
import type { Id } from "../_generated/dataModel";

// All writes to the dataset tables (changaEvaluationSets,
// changaEvaluationItems, changaReleaseMembers, changaDatasetReleases)
// go through `convex/changa/datasetWrites.ts` (the chokepoint). This
// file holds the public-facing mutations; they perform auth checks
// and then delegate to the chokepoint, which enforces the
// contamination guard and the count recomputation invariants.

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

        return await chokepoint.insertEvaluationSet(ctx, {
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

// Add a curated example to an evaluation set. The contamination guard
// lives in the chokepoint (addEvaluationItem).
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

        // Chokepoint enforces the contamination guard inline; the
        // `addedBy` attribution is passed directly so the schema
        // required field is set at insert time.
        const id = await chokepoint.addEvaluationItem(ctx, {
            evaluationSetId: args.evaluationSetId,
            exampleId: args.exampleId,
            addedBy: user._id,
            split: args.split,
        });
        return id;
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

        await chokepoint.patchEvaluationSet(ctx, args.evaluationSetId, {
            isFrozen: true,
        });
        return args.evaluationSetId;
    },
});

// Add a curated example to a dataset release with a split assignment.
// Contamination guard and count recomputation live in the chokepoint.
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

        // Chokepoint enforces the contamination guard and recomputes
        // the parent release's exampleCount.
        return await chokepoint.addReleaseMember(ctx, {
            releaseId: args.releaseId,
            exampleId: args.exampleId,
            split: args.split,
        });
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
