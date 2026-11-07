import type { ContributorStanding } from "@/lib/changa/recognition";

import type {
  Community,
  Contribution,
  ContributionTask,
  Conversation,
  ConversationId,
  DatasetVersion,
  DiscoverItem,
  Message,
  MessageId,
  ModerationAction,
  QualityReportRecord,
  Review,
  SamiatiUser,
  Thread,
  ThreadPost,
  UserId,
} from "./types";

/**
 * The persistence contract for Samiati.
 *
 * Two implementations exist:
 *  - {@link LocalStore}   — browser storage, no server required (default).
 *  - {@link ConvexStore}  — Convex deployment, used when configured.
 *
 * Keeping this narrow means the React layer never branches on backend, and a
 * future backend (e.g. a self-hosted API) only needs a new implementation.
 */
export interface SamiatiStore {
  /** Identifies the active backend so the UI can surface its state honestly. */
  readonly kind: "local" | "convex";
  /** Human-readable backend label for the status UI. */
  readonly label: string;

  /* ------------------------------- users ------------------------------- */
  getCurrentUser(): Promise<SamiatiUser>;
  updateCurrentUser(patch: Partial<Omit<SamiatiUser, "id">>): Promise<SamiatiUser>;

  /* --------------------------- conversations --------------------------- */
  listConversations(): Promise<Conversation[]>;
  getConversation(id: ConversationId): Promise<Conversation | null>;
  createConversation(input: {
    title?: string;
    languageId: string;
  }): Promise<Conversation>;
  updateConversation(
    id: ConversationId,
    patch: Partial<Omit<Conversation, "id" | "ownerId">>,
  ): Promise<Conversation>;
  deleteConversation(id: ConversationId): Promise<void>;
  /** Full-text-ish search across conversation titles and message content. */
  searchConversations(query: string): Promise<Conversation[]>;

  /* ------------------------------ messages ----------------------------- */
  listMessages(conversationId: ConversationId): Promise<Message[]>;
  addMessage(input: {
    conversationId: ConversationId;
    role: Message["role"];
    content: string;
    languageId: string;
    status?: Message["status"];
    meta?: Message["meta"];
    error?: string;
  }): Promise<Message>;
  updateMessage(
    id: MessageId,
    patch: Partial<Omit<Message, "id" | "conversationId">>,
  ): Promise<Message>;
  deleteMessage(id: MessageId): Promise<void>;

  /* ------------------------------ changa ------------------------------- */
  listContributionTasks(options?: {
    languageId?: string;
    type?: ContributionTask["type"];
  }): Promise<ContributionTask[]>;
  getContributionTask(id: string): Promise<ContributionTask | null>;
  listContributions(): Promise<Contribution[]>;
  /**
   * Contributions awaiting a human decision, most-suspicious first.
   *
   * This is the review queue. It is ordered by the composite quality score
   * rather than by age, because the interesting work is the work that looks
   * wrong.
   */
  listReviewQueue(): Promise<Contribution[]>;
  submitContribution(input: {
    taskId: string;
    submittedText: string;
  }): Promise<Contribution>;
  listReviews(): Promise<Review[]>;
  createReview(input: {
    contributionId: string;
    decision: Review["decision"];
    feedback?: string;
  }): Promise<Review>;
  /** The automated quality checks recorded for each contribution. */
  listQualityReports(): Promise<QualityReportRecord[]>;
  /** A contributor's standing and recognition tier. */
  getContributorStanding(userId?: string): Promise<ContributorStanding>;
  /** The moderation audit log. */
  listModerationActions(): Promise<ModerationAction[]>;
  createModerationAction(input: {
    kind: ModerationAction["kind"];
    targetId: string;
    reason: string;
    communityId?: string;
  }): Promise<ModerationAction>;

  /* ---------------------------- communities ---------------------------- */
  listCommunities(): Promise<Community[]>;
  joinCommunity(id: string): Promise<Community>;
  leaveCommunity(id: string): Promise<Community>;
  listThreads(communityId: string): Promise<Thread[]>;
  getThread(id: string): Promise<Thread | null>;
  listThreadPosts(threadId: string): Promise<ThreadPost[]>;
  createThread(input: {
    communityId: string;
    title: string;
    topic: string;
    languageId: string;
  }): Promise<Thread>;
  createThreadPost(input: {
    threadId: string;
    content: string;
    languageId: string;
  }): Promise<ThreadPost>;
  hideThreadPost(id: string): Promise<ThreadPost>;

  /* ----------------------------- discover ------------------------------ */
  listDiscoverItems(): Promise<DiscoverItem[]>;
  toggleDiscoverItemSaved(id: string): Promise<DiscoverItem>;
  /**
   * Merges items from an ingested feed into the catalogue.
   *
   * Items are matched by id, so re-running the ingestion updates the
   * existing record rather than creating a duplicate. A saved item keeps
   * its saved state.
   */
  ingestDiscoverItems(items: DiscoverItem[]): Promise<DiscoverItem[]>;

  /* ----------------------------- dataset ------------------------------- */
  listDatasetVersions(): Promise<DatasetVersion[]>;
  getDatasetVersion(id: string): Promise<DatasetVersion | null>;
  createDatasetVersion(input: {
    version: string;
    languageIds: string[];
    contributionIds: string[];
    reviewIds: string[];
    metrics: DatasetVersion["metrics"];
    format: DatasetVersion["export"]["format"];
    checksum: string;
  }): Promise<DatasetVersion>;
  updateDatasetVersion(
    id: string,
    patch: Partial<Omit<DatasetVersion, "id">>,
  ): Promise<DatasetVersion>;
}
