"use client";

import { Check, MessageSquare, Plus, Send, ShieldAlert } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/data/provider";
import type { Community, Thread, ThreadPost } from "@/lib/data/types";
import { getLanguageOrDefault } from "@/lib/languages";

export interface CommunityViewProps {
  communityId: string;
}

/**
 * A language community: its threads, its posts, and its moderation tools.
 *
 * Threads are scoped to one language, so a conversation about Sheng never
 * bleeds into a Kiswahili one.
 */
export function CommunityView({ communityId }: CommunityViewProps) {
  const store = useStore();

  const [community, setCommunity] = React.useState<Community | null>(null);
  const [threads, setThreads] = React.useState<Thread[]>([]);
  const [activeThread, setActiveThread] = React.useState<Thread | null>(null);
  const [posts, setPosts] = React.useState<ThreadPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newTopic, setNewTopic] = React.useState("");
  const [reply, setReply] = React.useState("");

  const loadCommunity = React.useCallback(async () => {
    const all = await store.listCommunities();
    const found = all.find((entry) => entry.id === communityId) ?? null;
    setCommunity(found);
    return found;
  }, [communityId, store]);

  const loadThreads = React.useCallback(async () => {
    setThreads(await store.listThreads(communityId));
  }, [communityId, store]);

  const loadPosts = React.useCallback(
    async (threadId: string) => {
      setPosts(await store.listThreadPosts(threadId));
    },
    [store],
  );

  React.useEffect(() => {
    void (async () => {
      try {
        await loadCommunity();
        await loadThreads();
      } finally {
        setLoading(false);
      }
    })();
  }, [loadCommunity, loadThreads]);

  const openThread = React.useCallback(
    async (thread: Thread) => {
      setActiveThread(thread);
      await loadPosts(thread.id);
    },
    [loadPosts],
  );

  const toggleMembership = React.useCallback(async () => {
    if (!community) return;
    const isMember = community.memberIds.length > 0;
    const updated = isMember
      ? await store.leaveCommunity(community.id)
      : await store.joinCommunity(community.id);
    setCommunity(updated);
    toast.success(
      isMember ? `You left ${community.name}.` : `You joined ${community.name}.`,
    );
  }, [community, store]);

  const createThread = React.useCallback(async () => {
    if (!community || !newTitle.trim()) return;
    try {
      const thread = await store.createThread({
        communityId: community.id,
        title: newTitle.trim(),
        topic: newTopic.trim() || "General",
        languageId: community.languageId,
      });
      setNewTitle("");
      setNewTopic("");
      setCreating(false);
      await loadThreads();
      await openThread(thread);
      toast.success("Thread created.");
    } catch {
      toast.error("Could not create the thread.");
    }
  }, [community, loadThreads, newTitle, newTopic, openThread, store]);

  const postReply = React.useCallback(async () => {
    if (!activeThread || !reply.trim()) return;
    try {
      await store.createThreadPost({
        threadId: activeThread.id,
        content: reply.trim(),
        languageId: activeThread.languageId,
      });
      setReply("");
      await loadPosts(activeThread.id);
      await loadThreads();
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "Could not post the reply.",
      );
    }
  }, [activeThread, loadPosts, loadThreads, reply, store]);

  const hidePost = React.useCallback(
    async (post: ThreadPost) => {
      await store.hideThreadPost(post.id);
      await loadPosts(post.threadId);
      toast.success("Post hidden from the thread.");
    },
    [loadPosts, store],
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading community…
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-2xl font-semibold">Community not found</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          It may have been removed, or the link is out of date.
        </p>
        <Button asChild>
          <Link href="/communities">All communities</Link>
        </Button>
      </div>
    );
  }

  const language = getLanguageOrDefault(community.languageId);
  const isMember = community.memberIds.length > 0;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <Link
          href="/communities"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← All communities
        </Link>

        <header className="mt-4 mb-6">
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-semibold tracking-tight">
                {community.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {language.name} · {language.region}
              </p>
            </div>
            <Button
              size="sm"
              variant={isMember ? "outline" : "default"}
              className="ml-auto gap-1.5"
              onClick={() => void toggleMembership()}
            >
              {isMember ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden />
                  Joined
                </>
              ) : (
                "Join"
              )}
            </Button>
          </div>
          <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">
            {community.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {community.topics.map((topic) => (
              <Badge key={topic} variant="secondary">
                {topic}
              </Badge>
            ))}
          </div>
        </header>

        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">Threads</h2>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setCreating((value) => !value)}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New thread
          </Button>
        </div>

        {creating ? (
          <div className="mb-4 space-y-3 rounded-xl border bg-card p-4">
            <Input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="What do you want to discuss?"
              aria-label="Thread title"
            />
            <Input
              value={newTopic}
              onChange={(event) => setNewTopic(event.target.value)}
              placeholder="Topic (for example: Proverbs)"
              aria-label="Thread topic"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCreating(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={() => void createThread()}>
                Create thread
              </Button>
            </div>
          </div>
        ) : null}

        {threads.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="font-medium">No threads yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start the first discussion in {language.name}.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {threads.map((thread) => (
              <li key={thread.id}>
                <button
                  type="button"
                  onClick={() => void openThread(thread)}
                  className={`w-full rounded-xl border bg-card p-4 text-left transition-colors hover:bg-accent/40 ${
                    activeThread?.id === thread.id ? "border-primary/50" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{thread.title}</span>
                    {thread.pinned ? (
                      <Badge variant="secondary">Pinned</Badge>
                    ) : null}
                    <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" aria-hidden />
                      {thread.postCount}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {thread.topic}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}

        {activeThread ? (
          <section className="mt-8 rounded-xl border bg-card p-5">
            <h3 className="font-display text-lg font-semibold">
              {activeThread.title}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {activeThread.topic} · {language.name}
            </p>

            <ul className="mt-4 space-y-3">
              {posts.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  No replies yet. Be the first.
                </li>
              ) : (
                posts.map((post) => (
                  <li
                    key={post.id}
                    className="group flex items-start justify-between gap-3 rounded-lg border bg-muted/30 p-3"
                  >
                    <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm">
                      {post.content}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                      onClick={() => void hidePost(post)}
                      aria-label="Hide this post"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </li>
                ))
              )}
            </ul>

            {activeThread.locked ? (
              <p className="mt-4 text-sm text-muted-foreground">
                This thread is locked.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                <Textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  rows={3}
                  placeholder={`Reply in ${language.name}…`}
                  aria-label="Reply"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => void postReply()}
                    disabled={!reply.trim()}
                  >
                    <Send className="h-3.5 w-3.5" aria-hidden />
                    Post reply
                  </Button>
                </div>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
