"use client";

import { ArrowUp, Square } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getLanguageOrDefault } from "@/lib/languages";
import { cn } from "@/lib/utils";

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  languageId: string;
  className?: string;
}

/**
 * The chat composer.
 *
 * It is deliberately simple: one field, one send button. The language the
 * assistant will answer in is shown above the field so the user is never
 * guessing which language they are about to use.
 */
export function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  isStreaming,
  disabled,
  languageId,
  className,
}: ChatInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const language = getLanguageOrDefault(languageId);

  // Grow the textarea with its content, up to a sensible ceiling.
  React.useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 200)}px`;
  }, [value]);

  const canSend = value.trim().length > 0 && !disabled && !isStreaming;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (canSend) onSend();
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="samiati-surface flex items-end gap-2 rounded-2xl p-2 transition-shadow focus-within:shadow-md">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          placeholder={`Ask anything in ${language.name}…`}
          aria-label={`Message in ${language.name}`}
          className="max-h-[200px] min-h-[2.5rem] resize-none border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
        />
        {isStreaming && onStop ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={onStop}
            aria-label="Stop generating"
            className="shrink-0"
          >
            <Square className="h-4 w-4 fill-current" aria-hidden />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            onClick={onSend}
            disabled={!canSend}
            aria-label="Send message"
            className="shrink-0"
          >
            <ArrowUp className="h-4 w-4" aria-hidden />
          </Button>
        )}
      </div>
      <p className="mt-2 px-1 text-center text-xs text-muted-foreground">
        Samiati will answer in{" "}
        <span className="font-medium text-foreground">{language.name}</span>.
        Press <kbd className="rounded border px-1 font-mono text-[10px]">Enter</kbd>{" "}
        to send,{" "}
        <kbd className="rounded border px-1 font-mono text-[10px]">Shift</kbd>+
        <kbd className="rounded border px-1 font-mono text-[10px]">Enter</kbd> for
        a new line.
      </p>
    </div>
  );
}
