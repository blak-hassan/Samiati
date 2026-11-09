import { DEFAULT_LANGUAGE_ID, getLanguageOrDefault } from "@/lib/languages";
import { runQualityChecks } from "@/lib/changa/quality";
import { computeStanding, isDecisiveReview, reviewDecisionScore } from "@/lib/changa/recognition";

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
  qualityReports: QualityReportRecord[];
  moderationActions: ModerationAction[];
  threads: Thread[];
  threadPosts: ThreadPost[];
  datasetVersions: DatasetVersion[];
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
    qualityReports: [],
    moderationActions: [],
    threads: [],
    threadPosts: [],
    datasetVersions: [],
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
        const parsed = JSON.parse(raw) as Partial<LocalState>;
        if (parsed && parsed.user) {
          // Merge in any collections added since this state was written, so a
          // schema addition never destroys a user's existing data.
          this.state = {
            ...createInitialState(),
            ...parsed,
            qualityReports: parsed.qualityReports ?? [],
            moderationActions: parsed.moderationActions ?? [],
            threads: parsed.threads ?? [],
            threadPosts: parsed.threadPosts ?? [],
            datasetVersions: parsed.datasetVersions ?? [],
          } as LocalState;
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

      // Run the automated checks. These can only flag the contribution for
      // human review - they never accept it.
      const script = getLanguageOrDefault(task.languageId).script;
      const report = runQualityChecks({
        sourceText: task.sourceText,
        submittedText: input.submittedText,
        languageId: task.languageId,
        script,
        existing: state.contributions
          .filter((entry) => entry.id !== contribution.id)
          .map((entry) => ({
            id: entry.id,
            submittedText: entry.submittedText,
            status: entry.status,
            languageId: entry.languageId,
          })),
      });

      state.qualityReports.push({
        contributionId: contribution.id,
        checks: report.checks,
        flagged: report.flagged,
        autoAccepted: false,
        score: report.score,
        createdAt: timestamp,
      });

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
    const mayApproveAlone = await this.canAcceptAlone();

    return this.commit((state) => {
      const timestamp = Date.now();

      // The automated checks can only flag a contribution. Accepting one is a
      // human decision, and it only decides the contribution when the
      // reviewer may approve alone.
      const decisive = isDecisiveReview(input.decision, mayApproveAlone);

      const review: Review = {
        id: createId("review"),
        contributionId: input.contributionId,
        reviewerId: state.user.id,
        decision: input.decision,
        feedback: input.feedback,
        createdAt: timestamp,
        decisive,
      };
      state.reviews.push(review);

      const contribution = state.contributions.find(
        (c) => c.id === input.contributionId,
      );
      if (contribution && decisive) {
        contribution.status =
          input.decision === "approve"
            ? "accepted"
            : input.decision === "reject"
              ? "rejected"
              : "validated";
        contribution.reviewedAt = timestamp;

        // The automated score is kept: a human decision does not overwrite
        // what the checks found. The decision score is only the fallback for
        // a contribution that was never screened.
        const report = state.qualityReports.find(
          (entry) => entry.contributionId === contribution.id,
        );
        contribution.qualityScore =
          report?.score ?? reviewDecisionScore(input.decision);

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

  /**
   * The local backend has exactly one member, so there is nobody whose
   * agreement an approval could be checked against. The single member is
   * therefore the established reviewer.
   *
   * The rule bites in the shared backend, where it is enforced on the server.
   */
  async canAcceptAlone(): Promise<boolean> {
    return true;
  }

  /* ------------------------- quality and standing ---------------------- */

  async listReviewQueue(): Promise<Contribution[]> {
    const state = this.read();
    const reportByContribution = new Map(
      state.qualityReports.map((report) => [report.contributionId, report]),
    );

    return state.contributions
      .filter((contribution) => contribution.status === "submitted")
      .sort((a, b) => {
        const aFlagged = reportByContribution.get(a.id)?.flagged ? 0 : 1;
        const bFlagged = reportByContribution.get(b.id)?.flagged ? 0 : 1;
        if (aFlagged !== bFlagged) return aFlagged - bFlagged;
        const aScore = reportByContribution.get(a.id)?.score ?? 1;
        const bScore = reportByContribution.get(b.id)?.score ?? 1;
        if (aScore !== bScore) return aScore - bScore;
        return a.createdAt - b.createdAt;
      })
      .map((contribution) => ({ ...contribution }));
  }

  async listQualityReports(): Promise<QualityReportRecord[]> {
    return this.read().qualityReports.map((report) => ({
      ...report,
      checks: report.checks.map((check) => ({ ...check })),
    }));
  }

  async getContributorStanding(userId?: string) {
    const state = this.read();
    const targetId = userId ?? state.user.id;

    const contributions = state.contributions.filter(
      (contribution) => contribution.contributorId === targetId,
    );
    const reviews = state.reviews.filter(
      (review) => review.reviewerId === targetId,
    );

    const accepted = contributions.filter(
      (contribution) => contribution.status === "accepted",
    );
    const rejected = contributions.filter(
      (contribution) => contribution.status === "rejected",
    );
    const needsRevision = contributions.filter(
      (contribution) => contribution.status === "validated",
    );

    const meanQuality =
      accepted.length === 0
        ? 0
        : accepted.reduce(
            (total, contribution) => total + (contribution.qualityScore ?? 0),
            0,
          ) / accepted.length;

    const agreement =
      reviews.length === 0
        ? 0
        : reviews.filter((review) => review.decision === "approve").length /
          reviews.length;

    const points = accepted.length * 10;

    const moderated = state.moderationActions.some(
      (action) => action.moderatorId === targetId,
    );

    return computeStanding({
      userId: targetId,
      accepted: accepted.length,
      rejected: rejected.length,
      needsRevision: needsRevision.length,
      reviews: reviews.length,
      agreement,
      meanQuality,
      points,
      hasModerated: moderated,
    });
  }

  async listModerationActions(): Promise<ModerationAction[]> {
    return this.read()
      .moderationActions.map((action) => ({ ...action }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async createModerationAction(input: {
    kind: ModerationAction["kind"];
    targetId: string;
    reason: string;
    communityId?: string;
  }): Promise<ModerationAction> {
    return this.commit((state) => {
      const timestamp = Date.now();
      const action: ModerationAction = {
        id: createId("mod"),
        kind: input.kind,
        targetId: input.targetId,
        reason: input.reason,
        moderatorId: state.user.id,
        communityId: input.communityId,
        createdAt: timestamp,
      };
      state.moderationActions.push(action);

      // Apply the action to the target where it makes sense.
      if (
        input.kind === "remove_contribution" ||
        input.kind === "restore_contribution"
      ) {
        const contribution = state.contributions.find(
          (entry) => entry.id === input.targetId,
        );
        if (contribution) {
          contribution.status =
            input.kind === "remove_contribution" ? "rejected" : "validated";
          contribution.reviewedAt = timestamp;
        }
      }

      return { ...action };
    });
  }

  /* ------------------------------ threads ------------------------------ */

  async listThreads(communityId: string): Promise<Thread[]> {
    return this.read()
      .threads.filter((thread) => thread.communityId === communityId)
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      })
      .map((thread) => ({ ...thread }));
  }

  async getThread(id: string): Promise<Thread | null> {
    const found = this.read().threads.find((thread) => thread.id === id);
    return found ? { ...found } : null;
  }

  async listThreadPosts(threadId: string): Promise<ThreadPost[]> {
    return this.read()
      .threadPosts.filter((post) => post.threadId === threadId && !post.hidden)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((post) => ({ ...post }));
  }

  async createThread(input: {
    communityId: string;
    title: string;
    topic: string;
    languageId: string;
  }): Promise<Thread> {
    return this.commit((state) => {
      const timestamp = Date.now();
      const thread: Thread = {
        id: createId("thread"),
        communityId: input.communityId,
        authorId: state.user.id,
        title: input.title.trim(),
        languageId: input.languageId,
        topic: input.topic,
        createdAt: timestamp,
        updatedAt: timestamp,
        pinned: false,
        locked: false,
        postCount: 0,
      };
      state.threads.push(thread);
      return { ...thread };
    });
  }

  async createThreadPost(input: {
    threadId: string;
    content: string;
    languageId: string;
  }): Promise<ThreadPost> {
    return this.commit((state) => {
      const thread = state.threads.find((entry) => entry.id === input.threadId);
      if (!thread) throw new Error(`Thread ${input.threadId} not found`);
      if (thread.locked) throw new Error("This thread is locked.");

      const timestamp = Date.now();
      const post: ThreadPost = {
        id: createId("post"),
        threadId: input.threadId,
        authorId: state.user.id,
        content: input.content.trim(),
        languageId: input.languageId,
        createdAt: timestamp,
        hidden: false,
      };
      state.threadPosts.push(post);
      thread.postCount += 1;
      thread.updatedAt = timestamp;

      return { ...post };
    });
  }

  async hideThreadPost(id: string): Promise<ThreadPost> {
    return this.commit((state) => {
      const post = state.threadPosts.find((entry) => entry.id === id);
      if (!post) throw new Error(`Post ${id} not found`);
      post.hidden = true;
      const thread = state.threads.find((entry) => entry.id === post.threadId);
      if (thread) thread.postCount = Math.max(0, thread.postCount - 1);
      return { ...post };
    });
  }

  /* ------------------------------ dataset ------------------------------ */

  async listDatasetVersions(): Promise<DatasetVersion[]> {
    return this.read()
      .datasetVersions.map((version) => ({ ...version }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async getDatasetVersion(id: string): Promise<DatasetVersion | null> {
    const found = this.read().datasetVersions.find((version) => version.id === id);
    return found ? { ...found } : null;
  }

  async createDatasetVersion(input: {
    version: string;
    languageIds: string[];
    contributionIds: string[];
    reviewIds: string[];
    metrics: DatasetVersion["metrics"];
    format: DatasetVersion["export"]["format"];
    checksum: string;
  }): Promise<DatasetVersion> {
    return this.commit((state) => {
      const version: DatasetVersion = {
        id: createId("dsv"),
        version: input.version,
        languageIds: input.languageIds,
        createdAt: Date.now(),
        provenance: {
          contributionIds: input.contributionIds,
          reviewIds: input.reviewIds,
        },
        metrics: input.metrics,
        export: {
          format: input.format,
          checksum: input.checksum,
          itemCount: input.contributionIds.length,
        },
        review: { status: "draft" },
      };
      state.datasetVersions.push(version);
      return { ...version };
    });
  }

  async updateDatasetVersion(
    id: string,
    patch: Partial<Omit<DatasetVersion, "id">>,
  ): Promise<DatasetVersion> {
    return this.commit((state) => {
      const index = state.datasetVersions.findIndex((version) => version.id === id);
      if (index === -1) throw new Error(`Dataset version ${id} not found`);
      const updated = { ...state.datasetVersions[index]!, ...patch, id };
      state.datasetVersions[index] = updated;
      return { ...updated };
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

  async ingestDiscoverItems(items: DiscoverItem[]): Promise<DiscoverItem[]> {
    return this.commit((state) => {
      const byId = new Map(state.discover.map((item) => [item.id, item]));

      for (const item of items) {
        const existing = byId.get(item.id);
        if (existing) {
          // Keep the reader's own state; refresh everything else.
          existing.title = item.title;
          existing.summary = item.summary;
          existing.topic = item.topic;
          existing.languages = item.languages;
          existing.source = item.source;
          existing.publishedAt = item.publishedAt;
          existing.readingMinutes = item.readingMinutes;
          existing.sourceUrl = item.sourceUrl;
        } else {
          const created = { ...item, saved: false };
          state.discover.push(created);
          byId.set(created.id, created);
        }
      }

      return state.discover.map((item) => ({ ...item }));
    });
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
