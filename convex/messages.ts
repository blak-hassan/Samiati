import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getOrCreateUser } from "./lib/currentUser";

/** Lists every message in a conversation, oldest first. */
export const list = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.ownerId !== user._id) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    return messages
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((message) => ({ ...message, id: message._id }));
  },
});

export const create = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    languageId: v.string(),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("streaming"),
        v.literal("complete"),
        v.literal("error"),
      ),
    ),
    error: v.optional(v.string()),
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
        translationConfidence: v.optional(v.number()),
        tokensUsed: v.optional(v.number()),
        latencyMs: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.ownerId !== user._id) {
      throw new Error("Conversation not found");
    }

    const timestamp = Date.now();
    const id = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      languageId: args.languageId,
      status: args.status ?? "complete",
      createdAt: timestamp,
      updatedAt: timestamp,
      error: args.error,
      meta: args.meta,
    });

    await ctx.db.patch(args.conversationId, { updatedAt: timestamp });

    // Give the conversation a meaningful title from the first user message.
    if (
      args.role === "user" &&
      conversation.title === "New conversation" &&
      args.content.trim()
    ) {
      await ctx.db.patch(args.conversationId, {
        title: args.content.trim().slice(0, 60),
      });
    }

    const message = await ctx.db.get(id);
    return { ...message!, id: message!._id };
  },
});

export const update = mutation({
  args: {
    id: v.id("messages"),
    patch: v.object({
      content: v.optional(v.string()),
      status: v.optional(
        v.union(
          v.literal("pending"),
          v.literal("streaming"),
          v.literal("complete"),
          v.literal("error"),
        ),
      ),
      error: v.optional(v.string()),
      feedback: v.optional(
        v.union(v.literal("up"), v.literal("down"), v.null()),
      ),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const message = await ctx.db.get(args.id);
    if (!message) throw new Error("Message not found");

    const conversation = await ctx.db.get(message.conversationId);
    if (!conversation || conversation.ownerId !== user._id) {
      throw new Error("Message not found");
    }

    await ctx.db.patch(args.id, { ...args.patch, updatedAt: Date.now() });
    const updated = await ctx.db.get(args.id);
    return { ...updated!, id: updated!._id };
  },
});

export const remove = mutation({
  args: { id: v.id("messages") },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const message = await ctx.db.get(args.id);
    if (!message) return true;

    const conversation = await ctx.db.get(message.conversationId);
    if (!conversation || conversation.ownerId !== user._id) {
      throw new Error("Message not found");
    }

    await ctx.db.delete(args.id);
    return true;
  },
});
