"use client";

import {
  Check,
  Copy,
  Languages,
  Pencil,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
  Volume2,
} from "lucide-react";
import * as React from "react";

import { Markdown } from "@/components/chat/markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Message } from "@/lib/data/types";
import { speakText, voiceLocale } from "@/lib/ai/browser-voice";
import { getLanguageOrDefault } from "@/lib/languages";
import { usePreferences } from "@/lib/preferences/provider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  isBusy?: boolean;
  onCopy?: (message: Message) => void;
  onRegenerate?: (message: Message) => void;
  onEdit?: (message: Message, nextContent: string) => void;
  onFeedback?: (message: Message, value: "up" | "down") => void;
}

function PipelineBadge({ message }: { message: Message }) {
  const { showTranslationProvenance } = usePreferences();
  const meta = message.meta;
  if (!meta) return null;

  if (meta.pipeline === "mock") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
        Demo placeholder — no model connected
      </span>
    );
  }

  if (meta.translated && showTranslationProvenance) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
        title={`Reasoned in English by ${meta.reasoningModel ?? "a reasoning model"}, then translated.`}
      >
        <Languages className="h-3 w-3" aria-hidden />
        Translated from English
      </span>
    );
  }

  return null;
}

export function MessageItem({
  message,
  isStreaming,
  isBusy,
  onCopy,
  onRegenerate,
  onEdit,
  onFeedback,
}: MessageItemProps) {
  const [copied, setCopied] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(message.content);

  const language = getLanguageOrDefault(message.languageId);
  const isUser = message.role === "user";
  const { voiceEnabled } = usePreferences();
  const voiceAvailable = voiceLocale(language.id) !== null;

  const speak = React.useCallback(async (text: string, languageId: string) => {
    const spoken = await speakText(text, languageId);
    if (!spoken) {
      toast.info("Your browser cannot speak this language yet.");
    }
  }, []);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard permission can be denied; nothing to do.
    }
    onCopy?.(message);
  }, [message, onCopy]);

  const commitEdit = () => {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === message.content) return;
    onEdit?.(message, next);
  };

  if (isUser) {
    return (
      <div className="group flex justify-end gap-3">
        <div className="flex max-w-[85%] flex-col items-end gap-1 sm:max-w-[75%]">
          {editing ? (
            <div className="w-full space-y-2">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={3}
                className="bg-background"
                aria-label="Edit your message"
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setDraft(message.content);
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={commitEdit} disabled={isBusy}>
                  Save &amp; resend
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-primary-foreground">
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                {message.content}
              </p>
            </div>
          )}

          {!editing ? (
            <div className="flex items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCopy}
                aria-label="Copy message"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                )}
              </Button>
              {onEdit ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setDraft(message.content);
                    setEditing(true);
                  }}
                  disabled={isBusy}
                  aria-label="Edit message"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                </Button>
              ) : null}
              {onRegenerate ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onRegenerate(message)}
                  disabled={isBusy}
                  aria-label="Try again"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Samiati</span>
        <span aria-hidden>·</span>
        <span>{language.name}</span>
        {isStreaming ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            writing…
          </span>
        ) : null}
      </div>

      <div className="min-w-0">
        {message.content ? (
          <Markdown content={message.content} />
        ) : isStreaming ? (
          <div
            className="flex items-center gap-2 text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
            <span className="sr-only">Writing a reply</span>
          </div>
        ) : null}
      </div>

      {message.status === "error" && message.error ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {message.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <PipelineBadge message={message} />

        <div className="flex items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleCopy}
            aria-label="Copy response"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden />
            )}
          </Button>
          {onRegenerate ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onRegenerate(message)}
              disabled={isBusy}
              aria-label="Regenerate response"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            </Button>
          ) : null}
          {voiceEnabled && voiceAvailable ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => void speak(message.content, language.id)}
              aria-label="Listen to this reply"
            >
              <Volume2 className="h-3.5 w-3.5" aria-hidden />
            </Button>
          ) : null}
          {onFeedback ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7",
                  message.feedback === "up" &&
                    "text-emerald-600 dark:text-emerald-400",
                )}
                onClick={() => onFeedback(message, "up")}
                aria-label="Good response"
                aria-pressed={message.feedback === "up"}
              >
                <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7",
                  message.feedback === "down" && "text-destructive",
                )}
                onClick={() => onFeedback(message, "down")}
                aria-label="Poor response"
                aria-pressed={message.feedback === "down"}
              >
                <ThumbsDown className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
