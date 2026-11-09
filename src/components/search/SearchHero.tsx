'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowUp, FileText, Loader2, Mic, PlusCircle, Square, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSelector, type Language } from '@/components/chat/LanguageSelector';
import { useSettings } from '@/hooks/useSettings';
import type { SearchAttachment } from '@/services/sunflowerService';
import { cn } from '@/lib/utils';

interface SearchHeroProps {
  onSubmit: (query: string) => void;
  onVoiceInput?: () => void;
  isSearching: boolean;
  isRecording?: boolean;
  isTranscribing?: boolean;
  compact?: boolean;
  selectedLanguage?: Language;
  onLanguageSelect?: (language: Language) => void;
  value?: string;
  onValueChange?: (value: string) => void;
  attachments?: SearchAttachment[];
  onAttachDocument?: () => void;
  onRemoveAttachment?: (id: string) => void;
  voiceDisabledReason?: string;
}

export default function SearchHero({
  onSubmit,
  onVoiceInput,
  isSearching,
  isRecording = false,
  isTranscribing = false,
  compact = false,
  selectedLanguage,
  onLanguageSelect,
  value,
  onValueChange,
  attachments = [],
  onAttachDocument,
  onRemoveAttachment,
  voiceDisabledReason,
}: SearchHeroProps) {
  const [internalQuery, setInternalQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const hintId = useId();
  const { settings } = useSettings();
  const query = value ?? internalQuery;
  const updateQuery = onValueChange ?? setInternalQuery;
  const busy = isSearching || isRecording || isTranscribing;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [query]);

  const submit = () => {
    if (query.trim() && !busy) onSubmit(query.trim());
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="w-full min-w-0"
      aria-label="Message Samiati"
    >
      <div
        className={cn(
          'rounded-[24px] border border-border/40 bg-background px-3 py-2 transition-shadow duration-200 focus-within:ring-1 focus-within:ring-primary/30',
          !compact && 'sm:px-3.5 sm:py-3'
        )}
      >
        <label htmlFor={inputId} className="sr-only">
          Your message{selectedLanguage ? ` in ${selectedLanguage.name}` : ''}
        </label>
        <textarea
          ref={textareaRef}
          id={inputId}
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          onKeyDown={(event) => {
            if (
              settings.sendOnEnter &&
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              submit();
            }
          }}
          aria-describedby={hintId}
          placeholder={selectedLanguage?.code === 'sw' ? 'Andika au ongea…' : 'Type or Speak…'}
          maxLength={5000}
          rows={1}
          className="max-h-[200px] min-h-8 w-full resize-none overflow-y-auto bg-transparent py-1 text-base leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/70 [overflow-wrap:anywhere]"
        />
        {attachments.length > 0 && (
          <ul className="mb-2 flex flex-wrap gap-2" aria-label="Attached documents">
            {attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex max-w-full items-center rounded-lg border border-border bg-secondary pl-3 text-xs"
              >
                <FileText className="mr-2 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="max-w-40 truncate">{attachment.name}</span>
                {onRemoveAttachment && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11"
                    aria-label={`Remove ${attachment.name}`}
                    onClick={() => onRemoveAttachment(attachment.id)}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-1 gap-y-2">
          <div className="min-w-0">
            {selectedLanguage && onLanguageSelect && (
              <LanguageSelector
                selectedLanguage={selectedLanguage}
                onSelect={onLanguageSelect}
                disabled={busy}
              />
            )}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            {onAttachDocument && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 rounded-full text-muted-foreground"
                aria-label="Attach a text document (up to 2 MB)"
                title="Attach a text document"
                onClick={onAttachDocument}
                disabled={busy}
              >
                <PlusCircle className="size-4" />
              </Button>
            )}
            {onVoiceInput && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  'size-9 rounded-full bg-muted/50 text-muted-foreground',
                  isRecording && 'text-destructive'
                )}
                disabled={Boolean(voiceDisabledReason) || isSearching || isTranscribing}
                onClick={onVoiceInput}
                aria-label={
                  voiceDisabledReason ?? (isRecording ? 'Stop recording' : 'Record a voice message')
                }
                title={voiceDisabledReason ?? 'Record a voice message'}
              >
                {isTranscribing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isRecording ? (
                  <Square className="size-4" />
                ) : (
                  <Mic className="size-4" />
                )}
              </Button>
            )}
            <Button
              type="submit"
              size="icon"
              className="size-9 rounded-full bg-primary text-white disabled:bg-muted disabled:text-muted-foreground"
              disabled={!query.trim() || busy}
              aria-label={isSearching ? 'Waiting for Samiati' : 'Send message'}
            >
              {isSearching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowUp className="size-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
      <p
        id={hintId}
        className={cn(
          'text-center text-xs leading-relaxed text-muted-foreground',
          isRecording || isTranscribing ? 'mt-2' : 'sr-only'
        )}
      >
        {isRecording
          ? 'Recording your microphone. Tap stop when you are ready.'
          : isTranscribing
            ? 'Transcribing your recording…'
            : (voiceDisabledReason ?? 'Voice input is experimental.')}
        <span className="hidden sm:inline">
          {' '}
          {settings.sendOnEnter
            ? 'Shift + Enter for a new line.'
            : 'Use the send button to submit.'}
        </span>
      </p>
    </form>
  );
}
