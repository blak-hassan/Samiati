import { beforeEach, describe, expect, it } from "vitest";

import { LocalStore } from "@/lib/data/local-store";

describe("LocalStore", () => {
  let store: LocalStore;

  beforeEach(() => {
    store = new LocalStore();
  });

  it("identifies itself honestly", () => {
    expect(store.kind).toBe("local");
    expect(store.label.length).toBeGreaterThan(0);
  });

  it("creates a user with a default language", async () => {
    const user = await store.getCurrentUser();
    expect(user.id).toBeTruthy();
    expect(user.defaultLanguageId).toBe("kiswahili");
    expect(user.preferredLanguageIds).toContain("kiswahili");
  });

  it("updates the current user without changing its id", async () => {
    const before = await store.getCurrentUser();
    const after = await store.updateCurrentUser({
      defaultLanguageId: "kikuyu",
      contributionConsent: false,
    });
    expect(after.id).toBe(before.id);
    expect(after.defaultLanguageId).toBe("kikuyu");
    expect(after.contributionConsent).toBe(false);
  });

  it("creates a conversation and titles it from the first user message", async () => {
    const conversation = await store.createConversation({
      languageId: "kiswahili",
    });
    expect(conversation.title).toBe("New conversation");

    await store.addMessage({
      conversationId: conversation.id,
      role: "user",
      content: "Habari za asubuhi",
      languageId: "kiswahili",
    });

    const reloaded = await store.getConversation(conversation.id);
    expect(reloaded?.title).toBe("Habari za asubuhi");
  });

  it("keeps message order stable", async () => {
    const conversation = await store.createConversation({
      languageId: "kiswahili",
    });

    for (const content of ["one", "two", "three"]) {
      await store.addMessage({
        conversationId: conversation.id,
        role: "user",
        content,
        languageId: "kiswahili",
      });
    }

    const messages = await store.listMessages(conversation.id);
    expect(messages.map((message) => message.content)).toEqual([
      "one",
      "two",
      "three",
    ]);
  });

  it("deletes a conversation and its messages together", async () => {
    const conversation = await store.createConversation({
      languageId: "kiswahili",
    });
    await store.addMessage({
      conversationId: conversation.id,
      role: "user",
      content: "hello",
      languageId: "kiswahili",
    });

    await store.deleteConversation(conversation.id);

    expect(await store.getConversation(conversation.id)).toBeNull();
    expect(await store.listMessages(conversation.id)).toHaveLength(0);
  });

  it("searches conversations by title and by message content", async () => {
    const conversation = await store.createConversation({
      title: "Maziwa ya kuku",
      languageId: "kiswahili",
    });
    await store.addMessage({
      conversationId: conversation.id,
      role: "user",
      content: "Ninapenda vijana vya mchizi",
      languageId: "kiswahili",
    });

    expect(await store.searchConversations("kuku")).toHaveLength(1);
    expect(await store.searchConversations("mchizi")).toHaveLength(1);
    expect(await store.searchConversations("nothing here")).toHaveLength(0);
  });

  it("records a contribution and moves the task to submitted", async () => {
    const tasks = await store.listContributionTasks();
    expect(tasks.length).toBeGreaterThan(0);
    const task = tasks[0]!;

    const contribution = await store.submitContribution({
      taskId: task.id,
      submittedText: "A translation",
    });
    expect(contribution.taskId).toBe(task.id);
    expect(contribution.status).toBe("submitted");

    const updated = await store.getContributionTask(task.id);
    expect(updated?.status).toBe("submitted");
  });

  it("accepts a contribution through a review", async () => {
    const tasks = await store.listContributionTasks();
    const task = tasks[0]!;
    const contribution = await store.submitContribution({
      taskId: task.id,
      submittedText: "A translation",
    });

    await store.createReview({
      contributionId: contribution.id,
      decision: "approve",
    });

    const contributions = await store.listContributions();
    const reviewed = contributions.find((c) => c.id === contribution.id);
    expect(reviewed?.status).toBe("accepted");
    expect(reviewed?.qualityScore).toBeGreaterThan(0.5);
  });

  it("keeps the automated quality score when a person accepts", async () => {
    const tasks = await store.listContributionTasks();
    const task = tasks[0]!;
    const contribution = await store.submitContribution({
      taskId: task.id,
      submittedText: "A translation",
    });

    const report = (await store.listQualityReports()).find(
      (entry) => entry.contributionId === contribution.id,
    );
    expect(report).toBeDefined();

    await store.createReview({
      contributionId: contribution.id,
      decision: "approve",
    });

    const contributions = await store.listContributions();
    const reviewed = contributions.find((c) => c.id === contribution.id);

    // A human decision does not overwrite what the automated checks found.
    expect(reviewed?.qualityScore).toBe(report?.score);
  });

  it("records who decided the contribution", async () => {
    const tasks = await store.listContributionTasks();
    const task = tasks[0]!;
    const contribution = await store.submitContribution({
      taskId: task.id,
      submittedText: "A translation",
    });

    const review = await store.createReview({
      contributionId: contribution.id,
      decision: "approve",
    });

    // The local backend has one member, so that member is the established
    // reviewer and the approval is decisive.
    expect(review.decisive).toBe(true);
    expect(await store.canAcceptAlone()).toBe(true);
  });

  it("joins and leaves a community", async () => {
    const communities = await store.listCommunities();
    expect(communities.length).toBeGreaterThan(0);
    const community = communities[0]!;

    const joined = await store.joinCommunity(community.id);
    expect(joined.memberIds.length).toBe(1);

    const left = await store.leaveCommunity(community.id);
    expect(left.memberIds.length).toBe(0);
  });

  it("toggles a saved discover item", async () => {
    const items = await store.listDiscoverItems();
    expect(items.length).toBeGreaterThan(0);
    const item = items[0]!;

    const saved = await store.toggleDiscoverItemSaved(item.id);
    expect(saved.saved).toBe(!item.saved);

    const restored = await store.toggleDiscoverItemSaved(item.id);
    expect(restored.saved).toBe(item.saved);
  });

  it("throws a helpful error for an unknown conversation", async () => {
    await expect(
      store.updateConversation("does-not-exist", { title: "x" }),
    ).rejects.toThrow(/not found/i);
  });
});
