import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getOrCreateUser } from "./lib/currentUser";

/**
 * Community discussion threads.
 *
 * Threads are scoped to one language community, so a discussion in Kiswahili
 * never bleeds into a Sheng one.
 */

export const list = query({
  args: { communityId: v.id("communities") },
  handler: async (ctx, args) => {
    await getOrCreateUser(ctx);
    const threads = await ctx.db
      .query("threads")
      .withIndex("by_community", (q) => q.eq("communityId", args.communityId))
      .collect();

    return threads
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      })
      .map((thread) => ({ ...thread, id: thread._id }));
  },
});

export const get = query({
  args: { id: v.id("threads") },
  handler: async (ctx, args) => {
    await getOrCreateUser(ctx);
    const thread = await ctx.db.get(args.id);
    return thread ? { ...thread, id: thread._id } : null;
  },
});

export const listPosts = query({
  args: { threadId: v.id("threads") },
  handler: async (ctx, args) => {
    await getOrCreateUser(ctx);
    const posts = await ctx.db
      .query("threadPosts")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();

    return posts
      .filter((post) => !post.hidden)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((post) => ({ ...post, id: post._id, authorId: post.authorId as string }));
  },
});

export const create = mutation({
  args: {
    communityId: v.id("communities"),
    title: v.string(),
    topic: v.string(),
    languageId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const timestamp = Date.now();

    const id = await ctx.db.insert("threads", {
      communityId: args.communityId,
      authorId: user._id,
      title: args.title.trim(),
      languageId: args.languageId,
      topic: args.topic,
      createdAt: timestamp,
      updatedAt: timestamp,
      pinned: false,
      locked: false,
      postCount: 0,
    });

    const thread = await ctx.db.get(id);
    return { ...thread!, id: thread!._id, authorId: thread!.authorId as string };
  },
});

export const createPost = mutation({
  args: {
    threadId: v.id("threads"),
    content: v.string(),
    languageId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const thread = await ctx.db.get(args.threadId);
    if (!thread) throw new Error("Thread not found");
    if (thread.locked) throw new Error("This thread is locked.");

    const timestamp = Date.now();
    const id = await ctx.db.insert("threadPosts", {
      threadId: args.threadId,
      authorId: user._id,
      content: args.content.trim(),
      languageId: args.languageId,
      createdAt: timestamp,
      hidden: false,
    });

    await ctx.db.patch(args.threadId, {
      postCount: thread.postCount + 1,
      updatedAt: timestamp,
    });

    const post = await ctx.db.get(id);
    return { ...post!, id: post!._id, authorId: post!.authorId as string };
  },
});

/**
 * Hides a post.
 *
 * The post is kept in the database for the audit trail; it is simply not
 * rendered in the thread.
 */
export const hidePost = mutation({
  args: { id: v.id("threadPosts") },
  handler: async (ctx, args) => {
    await getOrCreateUser(ctx);
    const post = await ctx.db.get(args.id);
    if (!post) throw new Error("Post not found");

    await ctx.db.patch(args.id, { hidden: true });
    const thread = await ctx.db.get(post.threadId);
    if (thread) {
      await ctx.db.patch(thread._id, {
        postCount: Math.max(0, thread.postCount - 1),
      });
    }

    const updated = await ctx.db.get(args.id);
    return {
      ...updated!,
      id: updated!._id,
      authorId: updated!.authorId as string,
    };
  },
});
