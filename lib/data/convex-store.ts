import { ConvexHttpClient } from "convex/browser";

import type { SamiatiStore } from "./store";
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
} from "./types";

/**
 * Convex-backed persistence for Samiati.
 *
 * The client talks to Convex over plain HTTP, so no React provider is
 * required and the same adapter works from the server and the browser.
 *
 * Function names are declared here explicitly rather than importing the
 * generated `api` object. That keeps the frontend type-checkable without a
 * Convex deployment, and `npx convex dev` regenerates the typed API in
 * `convex/_generated` for the backend itself.
 */
export class ConvexStore implements SamiatiStore {
  readonly kind = "convex" as const;
  readonly label = "Convex cloud";

  private readonly client: ConvexHttpClient;

  constructor(url: string) {
    this.client = new ConvexHttpClient(url);
  }

  private async query<T>(name: string, args: Record<string, unknown> = {}) {
    return (this.client as unknown as {
      query: (n: string, a: Record<string, unknown>) => Promise<T>;
    }).query(name, args);
  }

  private async mutate<T>(name: string, args: Record<string, unknown> = {}) {
    return (this.client as unknown as {
      mutation: (n: string, a: Record<string, unknown>) => Promise<T>;
    }).mutation(name, args);
  }

  /* ------------------------------- users ------------------------------- */

  async getCurrentUser(): Promise<SamiatiUser> {
    return this.query<SamiatiUser>("users/getCurrentUser");
  }

  async updateCurrentUser(
    patch: Partial<Omit<SamiatiUser, "id">>,
  ): Promise<SamiatiUser> {
    return this.mutate<SamiatiUser>("users/updateCurrentUser", { patch });
  }

  /* --------------------------- conversations --------------------------- */

  async listConversations(): Promise<Conversation[]> {
    return this.query<Conversation[]>("conversations/list");
  }

  async getConversation(id: ConversationId): Promise<Conversation | null> {
    return this.query<Conversation | null>("conversations/get", { id });
  }

  async createConversation(input: {
    title?: string;
    languageId: string;
  }): Promise<Conversation> {
    return this.mutate<Conversation>("conversations/create", input);
  }

  async updateConversation(
    id: ConversationId,
    patch: Partial<Omit<Conversation, "id" | "ownerId">>,
  ): Promise<Conversation> {
    return this.mutate<Conversation>("conversations/update", { id, patch });
  }

  async deleteConversation(id: ConversationId): Promise<void> {
    await this.mutate<boolean>("conversations/remove", { id });
  }

  async searchConversations(query: string): Promise<Conversation[]> {
    return this.query<Conversation[]>("conversations/search", { query });
  }

  /* ------------------------------ messages ----------------------------- */

  async listMessages(conversationId: ConversationId): Promise<Message[]> {
    return this.query<Message[]>("messages/list", { conversationId });
  }

  async addMessage(input: {
    conversationId: ConversationId;
    role: Message["role"];
    content: string;
    languageId: string;
    status?: Message["status"];
    meta?: Message["meta"];
    error?: string;
  }): Promise<Message> {
    return this.mutate<Message>("messages/create", input);
  }

  async updateMessage(
    id: MessageId,
    patch: Partial<Omit<Message, "id" | "conversationId">>,
  ): Promise<Message> {
    return this.mutate<Message>("messages/update", { id, patch });
  }

  async deleteMessage(id: MessageId): Promise<void> {
    await this.mutate<boolean>("messages/remove", { id });
  }

  /* ------------------------------ changa ------------------------------- */

  async listContributionTasks(options?: {
    languageId?: string;
    type?: ContributionTask["type"];
  }): Promise<ContributionTask[]> {
    return this.query<ContributionTask[]>("changa/listTasks", {
      languageId: options?.languageId,
      type: options?.type,
    });
  }

  async getContributionTask(id: string): Promise<ContributionTask | null> {
    return this.query<ContributionTask | null>("changa/getTask", { id });
  }

  async listContributions(): Promise<Contribution[]> {
    return this.query<Contribution[]>("changa/listContributions");
  }

  async submitContribution(input: {
    taskId: string;
    submittedText: string;
  }): Promise<Contribution> {
    return this.mutate<Contribution>("changa/submitContribution", input);
  }

  async listReviews(): Promise<Review[]> {
    return this.query<Review[]>("changa/listReviews");
  }

  async createReview(input: {
    contributionId: string;
    decision: Review["decision"];
    feedback?: string;
  }): Promise<Review> {
    return this.mutate<Review>("changa/createReview", input);
  }

  /* ---------------------------- communities ---------------------------- */

  async listCommunities(): Promise<Community[]> {
    return this.query<Community[]>("communities/list");
  }

  async joinCommunity(id: string): Promise<Community> {
    return this.mutate<Community>("communities/join", { id });
  }

  async leaveCommunity(id: string): Promise<Community> {
    return this.mutate<Community>("communities/leave", { id });
  }

  /* ----------------------------- discover ------------------------------ */

  async listDiscoverItems(): Promise<DiscoverItem[]> {
    return this.query<DiscoverItem[]>("discover/list");
  }

  async toggleDiscoverItemSaved(id: string): Promise<DiscoverItem> {
    return this.mutate<DiscoverItem>("discover/toggleSaved", { id });
  }
}
