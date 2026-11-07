"use client";

import { ArrowUp, Mic, Square } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  BrowserDictation,
  isSpeechRecognitionSupported,
  voiceLocale,
} from "@/lib/ai/browser-voice";
import { getLanguageOrDefault } from "@/lib/languages";
import { usePreferences } from "@/lib/preferences/provider";
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
 * It is deliberately simple: one field, one send button, and a microphone when
 * the browser can dictate the user's language. The language the assistant
 * will answer in is shown below the field so the user is never guessing.
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
  const dictationRef = React.useRef<BrowserDictation | null>(null);
  const [listening, setListening] = React.useState(false);
  const { voiceEnabled } = usePreferences();

  const language = getLanguageOrDefault(languageId);

  // Grow the textarea with its content, up to a sensible ceiling.
  React.useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 200)}px`;
  }, [value]);

  React.useEffect(() => {
    return () => {
      dictationRef.current?.abort();
    };
  }, []);

  const canSend = value.trim().length > 0 && !disabled && !isStreaming;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (canSend) onSend();
    }
  };

  const canDictate =
    voiceEnabled &&
    !isStreaming &&
    !disabled &&
    isSpeechRecognitionSupported() &&
    voiceLocale(language.id) !== null;

  const toggleDictation = React.useCallback(() => {
    if (listening) {
      dictationRef.current?.stop();
      setListening(false);
      return;
    }

    const dictation = dictationRef.current ?? new BrowserDictation();
    dictationRef.current = dictation;

    const started = dictation.start(language.id, {
      onPartial: (text) => onChange(text),
      onFinal: (text) => {
        onChange(text);
        setListening(false);
      },
      onError: (message) => {
        setListening(false);
        toast.info(message);
      },
    });

    setListening(started);
  }, [language.id, listening, onChange]);

  return (
    <div className={cn("w-full", className)}>
      <div className="samiati-surface flex items-end gap-2 rounded-2xl p-2 transition-shadow focus-within:shadow-md">
        {canDictate ? (
          <Button
            type="button"
            size="icon"
            variant={listening ? "default" : "ghost"}
            onClick={toggleDictation}
            aria-label={listening ? "Stop dictating" : "Dictate your message"}
            aria-pressed={listening}
            className="shrink-0"
          >
            {listening ? (
              <Square className="h-4 w-4 fill-current" aria-hidden />
            ) : (
              <Mic className="h-4 w-4" aria-hidden />
            )}
          </Button>
        ) : null}

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
