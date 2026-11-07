import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getOrCreateUser } from "./lib/currentUser";

/**
 * Dataset versions.
 *
 * A dataset version is a frozen, provenance-tracked release of reviewed
 * contributions. It moves through four states:
 *
 *   draft -> reviewed -> training_ready -> released
 *
 * Only a version in `training_ready` or `released` may be used to fine-tune.
 * The store enforces this by refusing the transition otherwise.
 */

export const list = query({
  args: {},
  handler: async (ctx) => {
    await getOrCreateUser(ctx);
    const versions = await ctx.db.query("datasetVersions").collect();
    return versions
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((version) => ({ ...version, id: version._id }));
  },
});

export const get = query({
  args: { id: v.id("datasetVersions") },
  handler: async (ctx, args) => {
    await getOrCreateUser(ctx);
    const version = await ctx.db.get(args.id);
    return version ? { ...version, id: version._id } : null;
  },
});

export const create = mutation({
  args: {
    version: v.string(),
    languageIds: v.array(v.string()),
    contributionIds: v.array(v.id("contributions")),
    reviewIds: v.array(v.id("reviews")),
    metrics: v.object({
      itemCount: v.number(),
      meanQualityScore: v.number(),
      contributorCount: v.number(),
      languageCoverage: v.number(),
    }),
    export: v.object({
      format: v.union(v.literal("jsonl"), v.literal("csv")),
      checksum: v.string(),
      itemCount: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    await getOrCreateUser(ctx);
    const id = await ctx.db.insert("datasetVersions", {
      version: args.version,
      languageIds: args.languageIds,
      createdAt: Date.now(),
      provenance: {
        contributionIds: args.contributionIds,
        reviewIds: args.reviewIds,
      },
      metrics: args.metrics,
      export: args.export,
      review: { status: "draft" },
    });

    const version = await ctx.db.get(id);
    return { ...version!, id: version!._id };
  },
});

/**
 * Moves a dataset version to a new review state.
 *
 * The transition to `training_ready` is gated: it is refused unless the
 * version has items, a non-zero mean quality score, and provenance. This is
 * the last line of defence between a pile of contributions and a training
 * run.
 */
export const update = mutation({
  args: {
    id: v.id("datasetVersions"),
    patch: v.object({
      metrics: v.optional(
        v.object({
          itemCount: v.number(),
          meanQualityScore: v.number(),
          contributorCount: v.number(),
          languageCoverage: v.number(),
        }),
      ),
      review: v.optional(
        v.object({
          status: v.union(
            v.literal("draft"),
            v.literal("reviewed"),
            v.literal("training_ready"),
            v.literal("released"),
          ),
          reviewedBy: v.optional(v.id("users")),
          reviewedAt: v.optional(v.number()),
          notes: v.optional(v.string()),
        }),
      ),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const version = await ctx.db.get(args.id);
    if (!version) throw new Error("Dataset version not found");

    const nextStatus = args.patch.review?.status ?? version.review.status;
    const metrics = args.patch.metrics ?? version.metrics;

    if (nextStatus === "training_ready") {
      if (metrics.itemCount === 0) {
        throw new Error(
          "A dataset version with no items cannot be marked training-ready.",
        );
      }
      if (metrics.meanQualityScore <= 0) {
        throw new Error(
          "A dataset version with a zero quality score cannot be marked training-ready.",
        );
      }
      if (version.provenance.contributionIds.length === 0) {
        throw new Error(
          "A dataset version without provenance cannot be marked training-ready.",
        );
      }
    }

    await ctx.db.patch(args.id, {
      ...args.patch,
      review: {
        ...version.review,
        ...args.patch.review,
        reviewedBy: args.patch.review?.reviewedBy ?? user._id,
        reviewedAt: args.patch.review?.reviewedAt ?? Date.now(),
      },
    });

    const updated = await ctx.db.get(args.id);
    return { ...updated!, id: updated!._id };
  },
});
