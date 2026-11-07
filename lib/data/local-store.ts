import { DEFAULT_LANGUAGE_ID } from "@/lib/languages";

import {
  SEED_COMMUNITIES,
  SEED_CONTRIBUTION_TASKS,
  SEED_DISCOVER_ITEMS,
} from "./seed";
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

const STORAGE_KEY = "samiati:v1:state";
const LOCAL_USER_ID = "local-user";

interface LocalState {
  user: SamiatiUser;
  conversations: Conversation[];
  messages: Message[];
  tasks: ContributionTask[];
  contributions: Contribution[];
  reviews: Review[];
  communities: Community[];
  discover: DiscoverItem[];
}

function createId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${random}`;
}

function createDefaultUser(): SamiatiUser {
  return {
    id: LOCAL_USER_ID,
    username: "mwalimu",
    displayName: "Mwalimu",
    createdAt: Date.now(),
    defaultLanguageId: DEFAULT_LANGUAGE_ID,
    preferredLanguageIds: [DEFAULT_LANGUAGE_ID],
    favoriteLanguageIds: [DEFAULT_LANGUAGE_ID],
    recentLanguageIds: [DEFAULT_LANGUAGE_ID],
    contributionConsent: true,
    plan: "free",
  };
}

function createInitialState(): LocalState {
  return {
    user: createDefaultUser(),
    conversations: [],
    messages: [],
    tasks: SEED_CONTRIBUTION_TASKS.map((task) => ({ ...task })),
    contributions: [],
    reviews: [],
    communities: SEED_COMMUNITIES.map((community) => ({
      ...community,
      memberIds: [],
      moderatorIds: [],
    })),
    discover: SEED_DISCOVER_ITEMS.map((item) => ({ ...item })),
  };
}

/**
 * Browser-storage backend for Samiati.
 *
 * This is the default backend so that Samiati runs, end to end, with no
 * accounts, no server and no API keys. It is also the fastest way to explore
 * the product on a phone with poor connectivity — the data never leaves the
 * device.
 */
export class LocalStore implements SamiatiStore {
  readonly kind = "local" as const;
  readonly label = "Local mode (this browser only)";

  private state: LocalState | null = null;

  private isBrowser(): boolean {
    return (
      typeof window !== "undefined" && typeof window.localStorage !== "undefined"
    );
  }

  private read(): LocalState {
    if (this.state) return this.state;

    if (!this.isBrowser()) {
      this.state = createInitialState();
      return this.state;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LocalState;
        if (parsed && parsed.user) {
          this.state = parsed;
          return this.state;
        }
      }
    } catch {
      // Corrupt or unavailable storage must never break the app — fall back
      // to a clean in-memory state.
    }

    this.state = createInitialState();
    this.write();
    return this.state;
  }

  private write(): void {
    if (!this.state || !this.isBrowser()) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Quota exceeded or private-mode restrictions: keep the in-memory copy
      // working even though it will not survive a reload.
    }
  }

  private async commit<T>(fn: (state: LocalState) => T): Promise<T> {
    const state = this.read();
    const result = fn(state);
    this.write();
    return result;
  }

  /* ------------------------------- users ------------------------------- */

  async getCurrentUser(): Promise<SamiatiUser> {
    return { ...this.read().user };
  }

  async updateCurrentUser(
    patch: Partial<Omit<SamiatiUser, "id">>,
  ): Promise<SamiatiUser> {
    return this.commit((state) => {
      state.user = { ...state.user, ...patch, id: state.user.id };
      return { ...state.user };
    });
  }

  /* --------------------------- conversations --------------------------- */

  async listConversations(): Promise<Conversation[]> {
    const state = this.read();
    return [...state.conversations].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
  }

  async getConversation(id: ConversationId): Promise<Conversation | null> {
    const found = this.read().conversations.find((c) => c.id === id);
    return found ? { ...found } : null;
  }

  async createConversation(input: {
    title?: string;
    languageId: string;
  }): Promise<Conversation> {
    return this.commit((state) => {
      const timestamp = Date.now();
      const conversation: Conversation = {
        id: createId("conv"),
        ownerId: state.user.id,
        title: input.title?.trim() || "New conversation",
        languageId: input.languageId,
        createdAt: timestamp,
        updatedAt: timestamp,
        pinned: false,
        archived: false,
      };
      state.conversations.push(conversation);
      return { ...conversation };
    });
  }

  async updateConversation(
    id: ConversationId,
    patch: Partial<Omit<Conversation, "id" | "ownerId">>,
  ): Promise<Conversation> {
    return this.commit((state) => {
      const index = state.conversations.findIndex((c) => c.id === id);
      if (index === -1) throw new Error(`Conversation ${id} not found`);
      const existing = state.conversations[index]!;
      const updated: Conversation = {
        ...existing,
        ...patch,
        id: existing.id,
        ownerId: existing.ownerId,
        updatedAt: Date.now(),
      };
      state.conversations[index] = updated;
      return { ...updated };
    });
  }

  async deleteConversation(id: ConversationId): Promise<void> {
    await this.commit((state) => {
      state.conversations = state.conversations.filter((c) => c.id !== id);
      state.messages = state.messages.filter((m) => m.conversationId !== id);
    });
  }

  async searchConversations(query: string): Promise<Conversation[]> {
    const needle = query.trim().toLowerCase();
    const state = this.read();
    if (!needle) return this.listConversations();

    return state.conversations
      .filter((conversation) => {
        if (conversation.title.toLowerCase().includes(needle)) return true;
        return state.messages.some(
          (message) =>
            message.conversationId === conversation.id &&
            message.content.toLowerCase().includes(needle),
        );
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /* ------------------------------ messages ----------------------------- */

  async listMessages(conversationId: ConversationId): Promise<Message[]> {
    return this.read()
      .messages.filter((message) => message.conversationId === conversationId)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((message) => ({ ...message }));
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
    return this.commit((state) => {
      const timestamp = Date.now();
      const message: Message = {
        id: createId("msg"),
        conversationId: input.conversationId,
        role: input.role,
        content: input.content,
        languageId: input.languageId,
        status: input.status ?? "complete",
        createdAt: timestamp,
        updatedAt: timestamp,
        meta: input.meta,
        error: input.error,
      };
      state.messages.push(message);

      const conversation = state.conversations.find(
        (c) => c.id === input.conversationId,
      );
      if (conversation) {
        conversation.updatedAt = timestamp;
        // Give the conversation a meaningful title from the first user message.
        if (
          conversation.title === "New conversation" &&
          input.role === "user" &&
          input.content.trim()
        ) {
          conversation.title = input.content.trim().slice(0, 60);
        }
      }

      return { ...message };
    });
  }

  async updateMessage(
    id: MessageId,
    patch: Partial<Omit<Message, "id" | "conversationId">>,
  ): Promise<Message> {
    return this.commit((state) => {
      const index = state.messages.findIndex((m) => m.id === id);
      if (index === -1) throw new Error(`Message ${id} not found`);
      const existing = state.messages[index]!;
      const updated: Message = {
        ...existing,
        ...patch,
        id: existing.id,
        conversationId: existing.conversationId,
        updatedAt: Date.now(),
      };
      state.messages[index] = updated;
      return { ...updated };
    });
  }

  async deleteMessage(id: MessageId): Promise<void> {
    await this.commit((state) => {
      state.messages = state.messages.filter((m) => m.id !== id);
    });
  }

  /* ------------------------------ changa ------------------------------- */

  async listContributionTasks(options?: {
    languageId?: string;
    type?: ContributionTask["type"];
  }): Promise<ContributionTask[]> {
    let tasks = this.read().tasks;
    if (options?.languageId) {
      tasks = tasks.filter((task) => task.languageId === options.languageId);
    }
    if (options?.type) {
      tasks = tasks.filter((task) => task.type === options.type);
    }
    return tasks.map((task) => ({ ...task }));
  }

  async getContributionTask(id: string): Promise<ContributionTask | null> {
    const found = this.read().tasks.find((task) => task.id === id);
    return found ? { ...found } : null;
  }

  async listContributions(): Promise<Contribution[]> {
    return this.read().contributions.map((contribution) => ({ ...contribution }));
  }

  async submitContribution(input: {
    taskId: string;
    submittedText: string;
  }): Promise<Contribution> {
    return this.commit((state) => {
      const task = state.tasks.find((t) => t.id === input.taskId);
      if (!task) throw new Error(`Contribution task ${input.taskId} not found`);

      const timestamp = Date.now();
      const contribution: Contribution = {
        id: createId("contrib"),
        taskId: task.id,
        contributorId: state.user.id,
        submittedText: input.submittedText,
        languageId: task.languageId,
        status: "submitted",
        createdAt: timestamp,
      };
      state.contributions.push(contribution);

      task.status = "submitted";
      task.claimedBy = state.user.id;
      task.updatedAt = timestamp;

      return { ...contribution };
    });
  }

  async listReviews(): Promise<Review[]> {
    return this.read().reviews.map((review) => ({ ...review }));
  }

  async createReview(input: {
    contributionId: string;
    decision: Review["decision"];
    feedback?: string;
  }): Promise<Review> {
    return this.commit((state) => {
      const timestamp = Date.now();
      const review: Review = {
        id: createId("review"),
        contributionId: input.contributionId,
        reviewerId: state.user.id,
        decision: input.decision,
        feedback: input.feedback,
        createdAt: timestamp,
      };
      state.reviews.push(review);

      const contribution = state.contributions.find(
        (c) => c.id === input.contributionId,
      );
      if (contribution) {
        contribution.status =
          input.decision === "approve"
            ? "accepted"
            : input.decision === "reject"
              ? "rejected"
              : "validated";
        contribution.reviewedAt = timestamp;
        contribution.qualityScore =
          input.decision === "approve"
            ? 0.9
            : input.decision === "needs_revision"
              ? 0.5
              : 0.1;

        const task = state.tasks.find((t) => t.id === contribution.taskId);
        if (task) {
          task.status =
            input.decision === "approve"
              ? "accepted"
              : input.decision === "reject"
                ? "rejected"
                : "validated";
          task.updatedAt = timestamp;
        }
      }

      return { ...review };
    });
  }

  /* ---------------------------- communities ---------------------------- */

  async listCommunities(): Promise<Community[]> {
    return this.read().communities.map((community) => ({
      ...community,
      memberIds: [...community.memberIds],
      moderatorIds: [...community.moderatorIds],
    }));
  }

  async joinCommunity(id: string): Promise<Community> {
    return this.commit((state) => {
      const community = state.communities.find((c) => c.id === id);
      if (!community) throw new Error(`Community ${id} not found`);
      if (!community.memberIds.includes(state.user.id)) {
        community.memberIds.push(state.user.id);
      }
      return { ...community, memberIds: [...community.memberIds] };
    });
  }

  async leaveCommunity(id: string): Promise<Community> {
    return this.commit((state) => {
      const community = state.communities.find((c) => c.id === id);
      if (!community) throw new Error(`Community ${id} not found`);
      community.memberIds = community.memberIds.filter(
        (memberId) => memberId !== state.user.id,
      );
      return { ...community, memberIds: [...community.memberIds] };
    });
  }

  /* ----------------------------- discover ------------------------------ */

  async listDiscoverItems(): Promise<DiscoverItem[]> {
    return this.read().discover.map((item) => ({ ...item }));
  }

  async toggleDiscoverItemSaved(id: string): Promise<DiscoverItem> {
    return this.commit((state) => {
      const item = state.discover.find((entry) => entry.id === id);
      if (!item) throw new Error(`Discover item ${id} not found`);
      item.saved = !item.saved;
      return { ...item };
    });
  }
}
