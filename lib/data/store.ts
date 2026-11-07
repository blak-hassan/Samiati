import type {
  Community,
  Contribution,
  ContributionTask,
  Conversation,
  ConversationId,
  DiscoverItem,
  Message,
  MessageId,
  Review,
  SamiatiUser,
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

  /* ---------------------------- communities ---------------------------- */
  listCommunities(): Promise<Community[]>;
  joinCommunity(id: string): Promise<Community>;
  leaveCommunity(id: string): Promise<Community>;

  /* ----------------------------- discover ------------------------------ */
  listDiscoverItems(): Promise<DiscoverItem[]>;
  toggleDiscoverItemSaved(id: string): Promise<DiscoverItem>;
}
