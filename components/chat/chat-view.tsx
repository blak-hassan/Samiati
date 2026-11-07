"use client";

import * as React from "react";
import { toast } from "sonner";

import { ChatInput } from "@/components/chat/chat-input";
import { MessageItem } from "@/components/chat/message-item";
import { useStore } from "@/lib/data/provider";
import type { Conversation, Message } from "@/lib/data/types";
import { getLanguageOrDefault } from "@/lib/languages";

export interface ChatViewProps {
  conversation: Conversation;
  initialMessages: Message[];
  /** A first message to send as soon as the view mounts. */
  initialPrompt?: string;
}

interface StreamEvent {
  type: "stage" | "delta" | "final" | "error";
  stage?: string;
  message?: string;
  text?: string;
  languageId?: string;
  meta?: Message["meta"];
}

type HistoryEntry = { role: "user" | "assistant" | "system"; content: string };

/**
 * The Samiati conversation view.
 *
 * Owns the streaming lifecycle: the user message is persisted first, the
 * reply is streamed from `/api/chat`, and only the completed reply is written
 * to the store. Interrupting the stream keeps the partial reply.
 */
export function ChatView({
  conversation,
  initialMessages,
  initialPrompt,
}: ChatViewProps) {
  const store = useStore();

  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [input, setInput] = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [streamingText, setStreamingText] = React.useState("");
  const [translatedText, setTranslatedText] = React.useState<string | null>(null);

  const abortRef = React.useRef<AbortController | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const language = getLanguageOrDefault(conversation.languageId);

  React.useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streamingText, translatedText]);

  const refresh = React.useCallback(async () => {
    setMessages(await store.listMessages(conversation.id));
  }, [store, conversation.id]);

  const runAssistant = React.useCallback(
    async (userMessageContent: string, history: HistoryEntry[]) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsStreaming(true);
      setStatusMessage("Preparing…");
      setStreamingText("");
      setTranslatedText(null);

      let reasoningText = "";
      let translated = "";
      let finalText = "";
      let finalMeta: Message["meta"] | undefined;
      let streamError: string | null = null;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessageContent,
            languageId: conversation.languageId,
            history,
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(
            `The assistant could not be reached (${response.status}). Check your connection and try again.`,
          );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            let event: StreamEvent;
            try {
              event = JSON.parse(line) as StreamEvent;
            } catch {
              // A malformed line must not kill the whole reply.
              continue;
            }

            if (event.type === "stage") {
              setStatusMessage(event.message ?? null);
            } else if (event.type === "delta") {
              if (event.stage === "translation") {
                // Translations arrive sentence by sentence, so they are
                // appended rather than replaced.
                translated += event.text ?? "";
                setTranslatedText(translated);
              } else {
                reasoningText += event.text ?? "";
                setStreamingText(reasoningText);
              }
            } else if (event.type === "final") {
              finalText = event.text ?? "";
              finalMeta = event.meta;
            } else if (event.type === "error") {
              streamError = event.message ?? "The assistant could not finish.";
            }
          }
        }

        if (streamError) throw new Error(streamError);

        const persisted = await store.addMessage({
          conversationId: conversation.id,
          role: "assistant",
          content: finalText,
          languageId: conversation.languageId,
          status: "complete",
          meta: finalMeta,
        });
        setMessages((current) => [...current, persisted]);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          // The user pressed stop — keep whatever was produced so far.
          const partial = translated || reasoningText;
          if (partial.trim()) {
            const persisted = await store.addMessage({
              conversationId: conversation.id,
              role: "assistant",
              content: partial,
              languageId: conversation.languageId,
              status: "complete",
            });
            setMessages((current) => [...current, persisted]);
          }
        } else {
          const message =
            caught instanceof Error
              ? caught.message
              : "Something went wrong while answering.";
          toast.error(message);
          await store.addMessage({
            conversationId: conversation.id,
            role: "assistant",
            content: "",
            languageId: conversation.languageId,
            status: "error",
            error: message,
          });
          await refresh();
        }
      } finally {
        setIsStreaming(false);
        setStatusMessage(null);
        setStreamingText("");
        setTranslatedText(null);
        abortRef.current = null;
      }
    },
    [conversation.id, conversation.languageId, refresh, store],
  );

  // Send the opening message exactly once, when the view first mounts.
  const promptSentRef = React.useRef(false);
  React.useEffect(() => {
    if (promptSentRef.current) return;
    const content = initialPrompt?.trim();
    if (!content) return;
    promptSentRef.current = true;

    void (async () => {
      const userMessage = await store.addMessage({
        conversationId: conversation.id,
        role: "user",
        content,
        languageId: conversation.languageId,
      });
      setMessages((current) => [...current, userMessage]);
      await runAssistant(content, []);
    })();
  }, [
    initialPrompt,
    conversation.id,
    conversation.languageId,
    runAssistant,
    store,
  ]);

  const toHistory = (entries: Message[]): HistoryEntry[] =>
    entries
      .filter((entry) => entry.content.trim().length > 0)
      .map((entry) => ({ role: entry.role, content: entry.content }));

  const sendMessage = React.useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput("");
    const history = toHistory(messages);
    const userMessage = await store.addMessage({
      conversationId: conversation.id,
      role: "user",
      content: text,
      languageId: conversation.languageId,
    });
    setMessages((current) => [...current, userMessage]);
    await runAssistant(text, history);
  }, [conversation.id, conversation.languageId, input, isStreaming, messages, runAssistant, store]);

  const regenerate = React.useCallback(
    async (assistantMessage: Message) => {
      const index = messages.findIndex((m) => m.id === assistantMessage.id);
      if (index === -1) return;

      let userIndex = -1;
      for (let i = index - 1; i >= 0; i -= 1) {
        if (messages[i]!.role === "user") {
          userIndex = i;
          break;
        }
      }
      if (userIndex === -1) return;

      const userMessage = messages[userIndex]!;
      for (const stale of messages.slice(index)) {
        await store.deleteMessage(stale.id);
      }

      const history = toHistory(messages.slice(0, userIndex));
      setMessages(messages.slice(0, index));
      await runAssistant(userMessage.content, history);
    },
    [messages, runAssistant, store],
  );

  const editUserMessage = React.useCallback(
    async (message: Message, nextContent: string) => {
      const index = messages.findIndex((m) => m.id === message.id);
      if (index === -1) return;

      await store.updateMessage(message.id, { content: nextContent });
      for (const stale of messages.slice(index + 1)) {
        await store.deleteMessage(stale.id);
      }

      const history = toHistory(messages.slice(0, index));
      setMessages([
        ...messages.slice(0, index),
        { ...message, content: nextContent },
      ]);
      await runAssistant(nextContent, history);
    },
    [messages, runAssistant, store],
  );

  /** Re-asks the assistant after a user message, dropping the old reply. */
  const retryUserMessage = React.useCallback(
    async (userMessage: Message) => {
      const index = messages.findIndex((m) => m.id === userMessage.id);
      if (index === -1) return;

      for (const stale of messages.slice(index + 1)) {
        await store.deleteMessage(stale.id);
      }

      const history = toHistory(messages.slice(0, index));
      setMessages(messages.slice(0, index + 1));
      await runAssistant(userMessage.content, history);
    },
    [messages, runAssistant, store],
  );

  const handleFeedback = React.useCallback(
    async (message: Message, value: "up" | "down") => {
      const next = message.feedback === value ? null : value;
      await store.updateMessage(message.id, { feedback: next });
      setMessages((current) =>
        current.map((entry) =>
          entry.id === message.id ? { ...entry, feedback: next } : entry,
        ),
      );
    },
    [store],
  );

  const streamingMessage: Message = {
    id: "streaming",
    conversationId: conversation.id,
    role: "assistant",
    // The translated text is the reply. The English is only shown
    // while the first sentence is still being translated.
    content: translatedText || streamingText,
    languageId: conversation.languageId,
    status: "streaming",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8 sm:px-6">
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isBusy={isStreaming}
              onRegenerate={
                message.role === "assistant"
                  ? regenerate
                  : (userMessage) => retryUserMessage(userMessage)
              }
              onEdit={message.role === "user" ? editUserMessage : undefined}
              onFeedback={message.role === "assistant" ? handleFeedback : undefined}
            />
          ))}

          {isStreaming ? (
            <div className="space-y-2">
              <MessageItem message={streamingMessage} isStreaming />
              {translatedText && streamingText ? (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer select-none">
                    Show the English the model wrote
                  </summary>
                  <div className="mt-2 whitespace-pre-wrap rounded-md border bg-muted/30 p-2">
                    {streamingText}
                  </div>
                </details>
              ) : null}
              {statusMessage ? (
                <p
                  role="status"
                  aria-live="polite"
                  className="pl-1 text-xs text-muted-foreground"
                >
                  {statusMessage}
                </p>
              ) : null}
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t bg-background/85 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={sendMessage}
            onStop={() => abortRef.current?.abort()}
            isStreaming={isStreaming}
            languageId={conversation.languageId}
          />
          <p className="sr-only" aria-live="polite">
            {language.name} conversation
          </p>
        </div>
      </div>
    </div>
  );
}
