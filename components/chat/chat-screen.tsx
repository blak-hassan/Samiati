"use client";

import {
  ChevronLeft,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { ChatView } from "@/components/chat/chat-view";
import { LanguageSelector } from "@/components/language/language-selector";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStore } from "@/lib/data/provider";
import type { Conversation, Message } from "@/lib/data/types";

export interface ChatScreenProps {
  conversationId: string;
}

/**
 * The conversation screen: header, title editing, language switching and the
 * chat itself.
 */
export function ChatScreen({ conversationId }: ChatScreenProps) {
  const store = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [conversation, setConversation] = React.useState<Conversation | null>(
    null,
  );
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [missing, setMissing] = React.useState(false);

  const firstMessage = searchParams.get("first") ?? undefined;

  const load = React.useCallback(async () => {
    const found = await store.getConversation(conversationId);
    if (!found) {
      setMissing(true);
      setLoading(false);
      return;
    }
    setConversation(found);
    setMessages(await store.listMessages(conversationId));
    setLoading(false);
  }, [conversationId, store]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const rename = React.useCallback(async () => {
    if (!conversation) return;
    const next = window.prompt("Rename conversation", conversation.title);
    if (!next || !next.trim()) return;
    const updated = await store.updateConversation(conversation.id, {
      title: next.trim(),
    });
    setConversation(updated);
    toast.success("Conversation renamed.");
  }, [conversation, store]);

  const remove = React.useCallback(async () => {
    if (!conversation) return;
    const ok = window.confirm(
      `Delete “${conversation.title}”? This cannot be undone.`,
    );
    if (!ok) return;
    await store.deleteConversation(conversation.id);
    toast.success("Conversation deleted.");
    router.push("/");
  }, [conversation, router, store]);

  const changeLanguage = React.useCallback(
    async (languageId: string) => {
      if (!conversation) return;
      const updated = await store.updateConversation(conversation.id, {
        languageId,
      });
      setConversation(updated);
    },
    [conversation, store],
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          Loading conversation…
        </div>
      </div>
    );
  }

  if (missing || !conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-2xl font-semibold">
          Conversation not found
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This conversation may have been deleted, or it belongs to another
          account.
        </p>
        <Button asChild>
          <Link href="/">Start a new chat</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-2 border-b px-3 py-2.5 sm:px-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="lg:hidden"
          aria-label="Back to conversations"
        >
          <Link href="/">
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </Link>
        </Button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-medium">
            {conversation.title}
          </h1>
        </div>

        <LanguageSelector
          value={conversation.languageId}
          onChange={(languageId) => void changeLanguage(languageId)}
          variant="compact"
          align="end"
          className="max-w-[11rem]"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Conversation actions">
              <MoreHorizontal className="h-5 w-5" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={() => void rename()}>
              <Pencil className="mr-2 h-4 w-4" aria-hidden />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => void remove()}
            >
              <Trash2 className="mr-2 h-4 w-4" aria-hidden />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="min-h-0 flex-1">
        <ChatView
          conversation={conversation}
          initialMessages={messages}
          initialPrompt={firstMessage}
        />
      </div>
    </div>
  );
}
