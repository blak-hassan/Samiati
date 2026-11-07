import { v } from "convex/values";

import { runQualityChecks } from "../../lib/changa/quality";
import { computeStanding } from "../../lib/changa/recognition";
import { mutation, query } from "./_generated/server";
import { getOrCreateUser } from "./lib/currentUser";
import { scriptForLanguage } from "./lib/languages";

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

    // Run the automated checks. These can only flag the contribution for human
    // review - they never accept it.
    const existing = await ctx.db
      .query("contributions")
      .withIndex("by_status", (q) => q.eq("status", "submitted"))
      .collect();
    const accepted = await ctx.db
      .query("contributions")
      .withIndex("by_status", (q) => q.eq("status", "accepted"))
      .collect();

    const report = runQualityChecks({
      sourceText: task.sourceText,
      submittedText: args.submittedText,
      languageId: task.languageId,
      script: scriptForLanguage(task.languageId),
      existing: [...existing, ...accepted]
        .filter((entry) => entry._id !== id)
        .map((entry) => ({
          id: entry._id as string,
          submittedText: entry.submittedText,
          status: entry.status,
          languageId: entry.languageId,
        })),
    });

    await ctx.db.insert("qualityReports", {
      contributionId: id,
      checks: report.checks,
      flagged: report.flagged,
      autoAccepted: false,
      score: report.score,
      createdAt: timestamp,
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

/* -------------------------------------------------------------------------- */
/*                     Quality, review queue and moderation                    */
/* -------------------------------------------------------------------------- */

/**
 * The review queue.
 *
 * Ordered by the screening score, lowest first, so the contributions that
 * look most suspicious are the ones a reviewer sees first. Age breaks ties.
 */
export const listReviewQueue = query({
  args: {},
  handler: async (ctx) => {
    await getOrCreateUser(ctx);
    const contributions = await ctx.db
      .query("contributions")
      .withIndex("by_status", (q) => q.eq("status", "submitted"))
      .collect();

    const reports = await ctx.db.query("qualityReports").collect();
    const reportByContribution = new Map(
      reports.map((report) => [report.contributionId, report]),
    );

    return contributions
      .sort((a, b) => {
        const aReport = reportByContribution.get(a._id);
        const bReport = reportByContribution.get(b._id);
        const aFlagged = aReport?.flagged ? 0 : 1;
        const bFlagged = bReport?.flagged ? 0 : 1;
        if (aFlagged !== bFlagged) return aFlagged - bFlagged;
        const aScore = aReport?.score ?? 1;
        const bScore = bReport?.score ?? 1;
        if (aScore !== bScore) return aScore - bScore;
        return a.createdAt - b.createdAt;
      })
      .map((contribution) => ({ ...contribution, id: contribution._id }));
  },
});

export const listQualityReports = query({
  args: {},
  handler: async (ctx) => {
    await getOrCreateUser(ctx);
    const reports = await ctx.db.query("qualityReports").collect();
    return reports
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((report) => ({ ...report, id: report._id }));
  },
});

/**
 * A contributor's standing and recognition tier.
 *
 * When no user id is given, the standing of the current user is returned.
 */
export const getContributorStanding = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const current = await getOrCreateUser(ctx);
    const targetId = args.userId ?? (current._id as string);

    const contributions = await ctx.db
      .query("contributions")
      .withIndex("by_contributor", (q) => q.eq("contributorId", targetId as any))
      .collect();
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_reviewer", (q) => q.eq("reviewerId", targetId as any))
      .collect();

    const accepted = contributions.filter((c) => c.status === "accepted");
    const rejected = contributions.filter((c) => c.status === "rejected");
    const needsRevision = contributions.filter((c) => c.status === "validated");

    const meanQuality =
      accepted.length === 0
        ? 0
        : accepted.reduce((total, c) => total + (c.qualityScore ?? 0), 0) /
          accepted.length;

    const agreement =
      reviews.length === 0
        ? 0
        : reviews.filter((r) => r.decision === "approve").length / reviews.length;

    const moderated = await ctx.db
      .query("moderationActions")
      .withIndex("by_moderator", (q) => q.eq("moderatorId", targetId as any))
      .first();

    return computeStanding({
      userId: targetId,
      accepted: accepted.length,
      rejected: rejected.length,
      needsRevision: needsRevision.length,
      reviews: reviews.length,
      agreement,
      meanQuality,
      points: accepted.length * 10,
      hasModerated: Boolean(moderated),
    });
  },
});

export const listModerationActions = query({
  args: {},
  handler: async (ctx) => {
    await getOrCreateUser(ctx);
    const actions = await ctx.db.query("moderationActions").collect();
    return actions
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((action) => ({
        ...action,
        id: action._id,
        moderatorId: action.moderatorId as string,
        communityId: action.communityId as string | undefined,
      }));
  },
});

/**
 * Records a moderation action and applies it.
 *
 * The action is written to the audit log first, so an action can never happen
 * without a record of why.
 */
export const createModerationAction = mutation({
  args: {
    kind: v.union(
      v.literal("remove_contribution"),
      v.literal("restore_contribution"),
      v.literal("suspend_contributor"),
      v.literal("reinstate_contributor"),
      v.literal("edit_task"),
      v.literal("promote_reviewer"),
    ),
    targetId: v.string(),
    reason: v.string(),
    communityId: v.optional(v.id("communities")),
  },
  handler: async (ctx, args) => {
    const moderator = await getOrCreateUser(ctx);

    const timestamp = Date.now();
    const id = await ctx.db.insert("moderationActions", {
      kind: args.kind,
      targetId: args.targetId,
      reason: args.reason,
      moderatorId: moderator._id,
      communityId: args.communityId,
      createdAt: timestamp,
    });

    if (
      args.kind === "remove_contribution" ||
      args.kind === "restore_contribution"
    ) {
      const contribution = await ctx.db.get(args.targetId as any);
      if (contribution) {
        await ctx.db.patch(contribution._id, {
          status:
            args.kind === "remove_contribution" ? "rejected" : "validated",
          reviewedAt: timestamp,
        });
      }
    }

    const action = await ctx.db.get(id);
    return {
      ...action!,
      id: action!._id,
      moderatorId: action!.moderatorId as string,
      communityId: action!.communityId as string | undefined,
    };
  },
});
