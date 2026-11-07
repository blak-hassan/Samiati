import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getOrCreateUser } from "./lib/currentUser";

/* ------------------------------- tasks -------------------------------- */

export const listTasks = query({
  args: {
    languageId: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("translate"),
        v.literal("validate"),
        v.literal("correct"),
        v.literal("compare"),
        v.literal("terminology"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    let tasks = await ctx.db.query("contributionTasks").collect();

    if (args.languageId) {
      tasks = tasks.filter((task) => task.languageId === args.languageId);
    }
    if (args.type) {
      tasks = tasks.filter((task) => task.type === args.type);
    }

    return tasks
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((task) => ({ ...task, id: task._id }));
  },
});

export const getTask = query({
  args: { id: v.id("contributionTasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    return task ? { ...task, id: task._id } : null;
  },
});

/* --------------------------- contributions ---------------------------- */

export const listContributions = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateUser(ctx);
    const contributions = await ctx.db
      .query("contributions")
      .withIndex("by_contributor", (q) => q.eq("contributorId", user._id))
      .collect();
    return contributions.map((contribution) => ({
      ...contribution,
      id: contribution._id,
    }));
  },
});

export const submitContribution = mutation({
  args: {
    taskId: v.id("contributionTasks"),
    submittedText: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Contribution task not found");

    const timestamp = Date.now();
    const id = await ctx.db.insert("contributions", {
      taskId: args.taskId,
      contributorId: user._id,
      submittedText: args.submittedText,
      languageId: task.languageId,
      status: "submitted",
      createdAt: timestamp,
    });

    await ctx.db.patch(args.taskId, {
      status: "submitted",
      claimedBy: user._id,
      updatedAt: timestamp,
    });

    const contribution = await ctx.db.get(id);
    return { ...contribution!, id: contribution!._id };
  },
});

/* ------------------------------- reviews ------------------------------ */

export const listReviews = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateUser(ctx);
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_reviewer", (q) => q.eq("reviewerId", user._id))
      .collect();
    return reviews.map((review) => ({ ...review, id: review._id }));
  },
});

export const createReview = mutation({
  args: {
    contributionId: v.id("contributions"),
    decision: v.union(
      v.literal("approve"),
      v.literal("reject"),
      v.literal("needs_revision"),
    ),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const contribution = await ctx.db.get(args.contributionId);
    if (!contribution) throw new Error("Contribution not found");

    const timestamp = Date.now();
    const id = await ctx.db.insert("reviews", {
      contributionId: args.contributionId,
      reviewerId: user._id,
      decision: args.decision,
      feedback: args.feedback,
      createdAt: timestamp,
    });

    const status =
      args.decision === "approve"
        ? "accepted"
        : args.decision === "reject"
          ? "rejected"
          : "validated";
    const qualityScore =
      args.decision === "approve"
        ? 0.9
        : args.decision === "needs_revision"
          ? 0.5
          : 0.1;

    await ctx.db.patch(args.contributionId, {
      status,
      qualityScore,
      reviewedAt: timestamp,
    });
    await ctx.db.patch(contribution.taskId, {
      status,
      updatedAt: timestamp,
    });

    const review = await ctx.db.get(id);
    return { ...review!, id: review!._id };
  },
});
