import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * The Samiati Convex schema.
 *
 * The shape mirrors `lib/data/types.ts` exactly, so the `ConvexStore` adapter
 * and the `LocalStore` adapter return identical objects to the UI.
 *
 * Indexes are chosen around the queries the application actually runs:
 *  - conversations are always read "for this user, newest first"
 *  - messages are always read "for this conversation, in order"
 *  - contributions are read "for this contributor" and "for this task"
 */
export default defineSchema({
  users: defineTable({
    clerkId: v.optional(v.string()),
    username: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),

    defaultLanguageId: v.string(),
    preferredLanguageIds: v.array(v.string()),
    favoriteLanguageIds: v.array(v.string()),
    recentLanguageIds: v.array(v.string()),
    contributionConsent: v.boolean(),
    plan: v.union(v.literal("free"), v.literal("supporter")),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_username", ["username"]),

  conversations: defineTable({
    ownerId: v.id("users"),
    title: v.string(),
    languageId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    pinned: v.boolean(),
    archived: v.boolean(),
    branchedFromId: v.optional(v.id("conversations")),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_updated", ["ownerId", "updatedAt"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    languageId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("streaming"),
      v.literal("complete"),
      v.literal("error"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    error: v.optional(v.string()),
    feedback: v.optional(v.union(v.literal("up"), v.literal("down"), v.null())),
    meta: v.optional(
      v.object({
        pipeline: v.union(
          v.literal("direct"),
          v.literal("translated"),
          v.literal("mock"),
        ),
        reasoningModel: v.optional(v.string()),
        translationModel: v.optional(v.string()),
        reasoningLanguageId: v.optional(v.string()),
        translated: v.boolean(),
        inputTranslated: v.optional(v.boolean()),
        translationConfidence: v.optional(v.number()),
        tokensUsed: v.optional(v.number()),
        latencyMs: v.optional(v.number()),
      }),
    ),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_conversation_created", ["conversationId", "createdAt"]),

  contributionTasks: defineTable({
    type: v.union(
      v.literal("translate"),
      v.literal("validate"),
      v.literal("correct"),
      v.literal("compare"),
      v.literal("terminology"),
    ),
    languageId: v.string(),
    sourceText: v.string(),
    targetText: v.optional(v.string()),
    context: v.optional(v.string()),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("submitted"),
      v.literal("validated"),
      v.literal("rejected"),
      v.literal("accepted"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    claimedBy: v.optional(v.id("users")),
    rewardPoints: v.number(),
  })
    .index("by_language", ["languageId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"]),

  contributions: defineTable({
    taskId: v.id("contributionTasks"),
    contributorId: v.id("users"),
    submittedText: v.string(),
    languageId: v.string(),
    status: v.union(
      v.literal("submitted"),
      v.literal("validated"),
      v.literal("accepted"),
      v.literal("rejected"),
    ),
    qualityScore: v.optional(v.number()),
    createdAt: v.number(),
    reviewedAt: v.optional(v.number()),
  })
    .index("by_contributor", ["contributorId"])
    .index("by_task", ["taskId"])
    .index("by_status", ["status"]),

  reviews: defineTable({
    contributionId: v.id("contributions"),
    reviewerId: v.id("users"),
    decision: v.union(
      v.literal("approve"),
      v.literal("reject"),
      v.literal("needs_revision"),
    ),
    feedback: v.optional(v.string()),
    /**
     * Whether this review decided the contribution on its own. Optional, so
     * reviews recorded before the field existed keep their original meaning.
     */
    decisive: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_contribution", ["contributionId"])
    .index("by_reviewer", ["reviewerId"]),

  communities: defineTable({
    name: v.string(),
    languageId: v.string(),
    description: v.string(),
    memberIds: v.array(v.id("users")),
    moderatorIds: v.array(v.id("users")),
    topics: v.array(v.string()),
    createdAt: v.number(),
  })
    .index("by_language", ["languageId"]),

  discoverItems: defineTable({
    title: v.string(),
    summary: v.string(),
    topic: v.union(
      v.literal("trending"),
      v.literal("news"),
      v.literal("technology"),
      v.literal("culture"),
      v.literal("history"),
      v.literal("education"),
      v.literal("community"),
    ),
    languages: v.array(v.string()),
    source: v.string(),
    /**
     * Set when the item came from an ingested feed rather than the seed set.
     * Optional, so the rows that predate the ingestion pipeline stay valid.
     */
    sourceUrl: v.optional(v.string()),
    publishedAt: v.number(),
    readingMinutes: v.number(),
    savedBy: v.array(v.id("users")),
  })
    .index("by_topic", ["topic"])
    .index("by_published", ["publishedAt"]),

  /* -------------------------------------------------------------------- */
  /*                        Changa: quality and audit                      */
  /* -------------------------------------------------------------------- */

  qualityReports: defineTable({
    contributionId: v.id("contributions"),
    checks: v.array(
      v.object({
        id: v.union(
          v.literal("empty_or_trivial"),
          v.literal("duplicate"),
          v.literal("copy_of_accepted"),
          v.literal("register_mismatch"),
          v.literal("length_outlier"),
          v.literal("script_mismatch"),
        ),
        severity: v.union(v.literal("info"), v.literal("warn"), v.literal("block")),
        passed: v.boolean(),
        message: v.string(),
      }),
    ),
    flagged: v.boolean(),
    // Always false. Automation may flag a contribution; it may never accept one.
    autoAccepted: v.boolean(),
    score: v.number(),
    createdAt: v.number(),
  })
    .index("by_contribution", ["contributionId"])
    .index("by_flagged", ["flagged"]),

  moderationActions: defineTable({
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
    moderatorId: v.id("users"),
    communityId: v.optional(v.id("communities")),
    createdAt: v.number(),
  })
    .index("by_moderator", ["moderatorId"])
    .index("by_target", ["targetId"])
    .index("by_created", ["createdAt"]),

  /* -------------------------------------------------------------------- */
  /*                          Communities: threads                         */
  /* -------------------------------------------------------------------- */

  threads: defineTable({
    communityId: v.id("communities"),
    authorId: v.id("users"),
    title: v.string(),
    languageId: v.string(),
    topic: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    pinned: v.boolean(),
    locked: v.boolean(),
    postCount: v.number(),
  })
    .index("by_community", ["communityId"])
    .index("by_community_updated", ["communityId", "updatedAt"]),

  threadPosts: defineTable({
    threadId: v.id("threads"),
    authorId: v.id("users"),
    content: v.string(),
    languageId: v.string(),
    createdAt: v.number(),
    hidden: v.boolean(),
  })
    .index("by_thread", ["threadId"]),

  /* -------------------------------------------------------------------- */
  /*                            Dataset versions                           */
  /* -------------------------------------------------------------------- */

  datasetVersions: defineTable({
    version: v.string(),
    languageIds: v.array(v.string()),
    createdAt: v.number(),
    provenance: v.object({
      contributionIds: v.array(v.id("contributions")),
      reviewIds: v.array(v.id("reviews")),
      cleaningReportId: v.optional(v.string()),
      qualityReportId: v.optional(v.string()),
    }),
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
    review: v.object({
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
  }).index("by_version", ["version"]),
});
