import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getOrCreateUser } from "./lib/currentUser";

/** Lists the current user's conversations, newest first. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateUser(ctx);
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    return conversations
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      })
      .map((conversation) => ({ ...conversation, id: conversation._id }));
  },
});

export const get = query({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const conversation = await ctx.db.get(args.id);
    if (!conversation || conversation.ownerId !== user._id) return null;
    return { ...conversation, id: conversation._id };
  },
});

export const create = mutation({
  args: {
    title: v.optional(v.string()),
    languageId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const timestamp = Date.now();
    const id = await ctx.db.insert("conversations", {
      ownerId: user._id,
      title: args.title?.trim() || "New conversation",
      languageId: args.languageId,
      createdAt: timestamp,
      updatedAt: timestamp,
      pinned: false,
      archived: false,
    });
    const conversation = await ctx.db.get(id);
    return { ...conversation!, id: conversation!._id };
  },
});

export const update = mutation({
  args: {
    id: v.id("conversations"),
    patch: v.object({
      title: v.optional(v.string()),
      languageId: v.optional(v.string()),
      pinned: v.optional(v.boolean()),
      archived: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const conversation = await ctx.db.get(args.id);
    if (!conversation || conversation.ownerId !== user._id) {
      throw new Error("Conversation not found");
    }
    await ctx.db.patch(args.id, { ...args.patch, updatedAt: Date.now() });
    const updated = await ctx.db.get(args.id);
    return { ...updated!, id: updated!._id };
  },
});

export const remove = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const conversation = await ctx.db.get(args.id);
    if (!conversation || conversation.ownerId !== user._id) {
      throw new Error("Conversation not found");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.id))
      .collect();
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    await ctx.db.delete(args.id);
    return true;
  },
});

/** Searches conversation titles and message content for the current user. */
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const needle = args.query.trim().toLowerCase();
    if (!needle) {
      return ctx.db
        .query("conversations")
        .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
        .collect();
    }

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    const matches = [];
    for (const conversation of conversations) {
      if (conversation.title.toLowerCase().includes(needle)) {
        matches.push(conversation);
        continue;
      }
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", conversation._id),
        )
        .collect();
      if (
        messages.some((message) =>
          message.content.toLowerCase().includes(needle),
        )
      ) {
        matches.push(conversation);
      }
    }

    return matches.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});
