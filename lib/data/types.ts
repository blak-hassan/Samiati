/**
 * Samiati domain model.
 *
 * These types are backend-agnostic: the same shapes are produced by the
 * Convex backend and by the local (browser) backend, so the UI never needs to
 * know where a record came from.
 */

export type UserId = string;
export type ConversationId = string;
export type MessageId = string;

export type SubscriptionPlan = "free" | "supporter";

export interface SamiatiUser {
  id: UserId;
  username: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: number;
  /** Language used when a conversation does not specify one. */
  defaultLanguageId: string;
  /** Languages the user can switch between quickly. */
  preferredLanguageIds: string[];
  /** Pinned to the top of the language selector. */
  favoriteLanguageIds: string[];
  /** Most recently used languages, newest first. */
  recentLanguageIds: string[];
  /** Whether the user consents to their contributions being used for training. */
  contributionConsent: boolean;
  plan: SubscriptionPlan;
}

export interface Conversation {
  id: ConversationId;
  ownerId: UserId;
  title: string;
  /** The language this conversation is conducted in. */
  languageId: string;
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
  archived: boolean;
  /** Set when this conversation was branched off another one. */
  branchedFromId?: ConversationId;
}

export type MessageRole = "user" | "assistant" | "system";
export type MessageStatus = "pending" | "streaming" | "complete" | "error";

/** How a message was produced by the AI pipeline. */
export type PipelineRoute = "direct" | "translated" | "mock";

/**
 * Provenance metadata for every AI-produced message.
 *
 * Recording this is what makes the "translation transparency" setting in
 * Samiati possible: users can always see which model reasoned, which model
 * translated, and whether a translation step was involved at all.
 */
export interface MessageMeta {
  pipeline: PipelineRoute;
  reasoningModel?: string;
  translationModel?: string;
  /** Language the reasoning model produced its answer in (usually "en"). */
  reasoningLanguageId?: string;
  /** True when the reply was translated from English into the user's language. */
  translated: boolean;
  /**
   * True when the user's message was translated into English before reasoning.
   * `translated` can be true while this is false: the reply may have been
   * translated successfully even though the request was not.
   */
  inputTranslated?: boolean;
  translationConfidence?: number;
  tokensUsed?: number;
  latencyMs?: number;
}

export interface Message {
  id: MessageId;
  conversationId: ConversationId;
  role: MessageRole;
  content: string;
  /** The language this message is written in. */
  languageId: string;
  status: MessageStatus;
  createdAt: number;
  updatedAt: number;
  error?: string;
  meta?: MessageMeta;
  feedback?: "up" | "down" | null;
}

/* -------------------------------------------------------------------------- */
/*                              Changa contributions                          */
/* -------------------------------------------------------------------------- */

export type ContributionTaskType =
  | "translate"
  | "validate"
  | "correct"
  | "compare"
  | "terminology";

export type ContributionTaskStatus =
  | "open"
  | "in_progress"
  | "submitted"
  | "validated"
  | "rejected"
  | "accepted";

export type Difficulty = "easy" | "medium" | "hard";

export interface ContributionTask {
  id: string;
  type: ContributionTaskType;
  languageId: string;
  /** The English (or source-language) text to work from. */
  sourceText: string;
  /** Existing translation — present for validate/correct tasks. */
  targetText?: string;
  /** Extra context shown to the contributor. */
  context?: string;
  difficulty: Difficulty;
  status: ContributionTaskStatus;
  createdAt: number;
  updatedAt: number;
  /** The contributor currently working on it, if any. */
  claimedBy?: UserId;
  rewardPoints: number;
}

export type ContributionStatus =
  | "submitted"
  | "validated"
  | "accepted"
  | "rejected";

export interface Contribution {
  id: string;
  taskId: string;
  contributorId: UserId;
  submittedText: string;
  languageId: string;
  status: ContributionStatus;
  /** 0–1 quality score assigned by the review pipeline. */
  qualityScore?: number;
  createdAt: number;
  reviewedAt?: number;
}

export type ReviewDecision = "approve" | "reject" | "needs_revision";

export interface Review {
  id: string;
  contributionId: string;
  reviewerId: UserId;
  decision: ReviewDecision;
  feedback?: string;
  createdAt: number;
}

/* -------------------------------------------------------------------------- */
/*                                  Communities                                */
/* -------------------------------------------------------------------------- */

export interface Community {
  id: string;
  name: string;
  languageId: string;
  description: string;
  memberIds: UserId[];
  moderatorIds: UserId[];
  topics: string[];
  createdAt: number;
}

/* -------------------------------------------------------------------------- */
/*                                   Discover                                  */
/* -------------------------------------------------------------------------- */

export type DiscoverTopic =
  | "trending"
  | "news"
  | "technology"
  | "culture"
  | "history"
  | "education"
  | "community";

export interface DiscoverItem {
  id: string;
  title: string;
  summary: string;
  topic: DiscoverTopic;
  languages: string[];
  source: string;
  publishedAt: number;
  readingMinutes: number;
  saved: boolean;
  /** Set when the item came from an ingested feed rather than the seed set. */
  sourceUrl?: string;
}

/* -------------------------------------------------------------------------- */
/*                             Changa: quality                                */
/* -------------------------------------------------------------------------- */

export type QualityCheckId =
  | "empty_or_trivial"
  | "duplicate"
  | "copy_of_accepted"
  | "register_mismatch"
  | "length_outlier"
  | "script_mismatch";

export type QualitySeverity = "info" | "warn" | "block";

export interface QualityCheckResult {
  id: QualityCheckId;
  severity: QualitySeverity;
  passed: boolean;
  message: string;
}

/**
 * The result of the automated checks for one contribution.
 *
 * `autoAccepted` is always false. Automation may flag a contribution for
 * human review; it may never accept one.
 */
export interface QualityReportRecord {
  contributionId: string;
  checks: QualityCheckResult[];
  flagged: boolean;
  autoAccepted: false;
  score: number;
  createdAt: number;
}

export type ModerationActionKind =
  | "remove_contribution"
  | "restore_contribution"
  | "suspend_contributor"
  | "reinstate_contributor"
  | "edit_task"
  | "promote_reviewer";

/** An audit-log entry for a moderation action. */
export interface ModerationAction {
  id: string;
  kind: ModerationActionKind;
  /** The contribution, contributor or task the action applies to. */
  targetId: string;
  reason: string;
  moderatorId: string;
  /** The language community the action was taken in. */
  communityId?: string;
  createdAt: number;
}

/* -------------------------------------------------------------------------- */
/*                            Communities: threads                             */
/* -------------------------------------------------------------------------- */

export interface Thread {
  id: string;
  communityId: string;
  authorId: string;
  title: string;
  languageId: string;
  topic: string;
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
  locked: boolean;
  postCount: number;
}

export interface ThreadPost {
  id: string;
  threadId: string;
  authorId: string;
  content: string;
  languageId: string;
  createdAt: number;
  /** Moderated posts are hidden from the thread but kept for the audit trail. */
  hidden: boolean;
}

/* -------------------------------------------------------------------------- */
/*                            Dataset versions                                 */
/* -------------------------------------------------------------------------- */

export type DatasetReviewStatus =
  | "draft"
  | "reviewed"
  | "training_ready"
  | "released";

export interface DatasetVersion {
  id: string;
  /** e.g. "kiswahili-2026.03.1" */
  version: string;
  languageIds: string[];
  createdAt: number;
  provenance: {
    contributionIds: string[];
    reviewIds: string[];
    cleaningReportId?: string;
    qualityReportId?: string;
  };
  metrics: {
    itemCount: number;
    meanQualityScore: number;
    contributorCount: number;
    /** Distinct terms per 1,000 words. */
    languageCoverage: number;
  };
  export: {
    format: "jsonl" | "csv";
    checksum: string;
    /** The exported rows, held in the store for the local backend. */
    itemCount: number;
  };
  review: {
    status: DatasetReviewStatus;
    reviewedBy?: string;
    reviewedAt?: number;
    notes?: string;
  };
}
