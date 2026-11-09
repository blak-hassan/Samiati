'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  AlertTriangle,
  BookOpen,
  Check,
  Copy,
  Image as ImageIcon,
  ImageOff,
  RotateCcw,
  Share2,
  Volume2,
  Square,
} from 'lucide-react';
import SourceCard, { type Source, getSourceDomain } from './SourceCard';
import FollowUpChips from './FollowUpChips';
import type { SearchImage } from '@/services/sunflowerService';
import { Button } from '@/components/ui/button';
import FeedbackBar, { type FeedbackContext } from '@/components/feedback/FeedbackBar';
import { cn } from '@/lib/utils';

interface SearchResultsProps {
  answer: string;
  error?: string | null;
  sources: Source[];
  followUps: string[];
  images?: SearchImage[];
  onFollowUpSelect: (query: string) => void;
  onRetry?: () => void;
  isPlaying?: boolean;
  onPlayAudio?: () => void;
  audioDisabledReason?: string;
  contextType?: FeedbackContext;
  messageId?: string;
  conversationId?: string;
  language?: string;
}

export default function SearchResults({
  answer,
  error,
  sources,
  followUps,
  images = [],
  onFollowUpSelect,
  onRetry,
  isPlaying = false,
  onPlayAudio,
  audioDisabledReason,
  contextType = 'search',
  messageId,
  conversationId,
  language,
}: SearchResultsProps) {
  const [view, setView] = useState<'answer' | 'reading' | 'images'>('answer');
  const [actionStatus, setActionStatus] = useState('');
  const [copied, setCopied] = useState<'answer' | 'share' | null>(null);

  const copy = async (kind: 'answer' | 'share') => {
    try {
      await navigator.clipboard.writeText(
        kind === 'answer'
          ? answer
          : `${answer.slice(0, 200)}${answer.length > 200 ? '…' : ''}\n\n— Samiati`
      );
      setCopied(kind);
      setActionStatus(kind === 'answer' ? 'Answer copied.' : 'Shareable snippet copied.');
    } catch {
      setActionStatus('Copy is unavailable. Select and copy the answer text instead.');
    }
  };

  if (error)
    return (
      <div role="alert" className="rounded-2xl border border-destructive bg-destructive/5 p-5">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle className="size-4 text-destructive" />
          We could not finish that answer.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{error}</p>
        {onRetry && (
          <Button onClick={onRetry} className="mt-4 min-h-11 gap-2 rounded-xl">
            <RotateCcw className="size-4" />
            Try again
          </Button>
        )}
      </div>
    );

  return (
    <div className="w-full min-w-0 space-y-4">
      {(sources.length > 0 || images.length > 0) && (
        <div className="flex flex-wrap gap-1" aria-label="Response views">
          <Button
            type="button"
            variant="ghost"
            aria-pressed={view === 'answer'}
            className={cn('min-h-11 rounded-lg text-xs', view === 'answer' && 'bg-secondary')}
            onClick={() => setView('answer')}
          >
            Answer
          </Button>
          {sources.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              aria-pressed={view === 'reading'}
              className={cn(
                'min-h-11 gap-2 rounded-lg text-xs',
                view === 'reading' && 'bg-secondary'
              )}
              onClick={() => setView('reading')}
            >
              <BookOpen className="size-3.5" />
              Related reading <span className="text-muted-foreground">{sources.length}</span>
            </Button>
          )}
          {images.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              aria-pressed={view === 'images'}
              className={cn(
                'min-h-11 gap-2 rounded-lg text-xs',
                view === 'images' && 'bg-secondary'
              )}
              onClick={() => setView('images')}
            >
              <ImageIcon className="size-3.5" />
              Images
            </Button>
          )}
        </div>
      )}
      {view === 'answer' && (
        <>
          <p className="whitespace-pre-wrap leading-7 [overflow-wrap:anywhere]">{answer}</p>
          <div className="flex flex-wrap items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-11 rounded-xl text-muted-foreground"
              aria-label={copied === 'answer' ? 'Answer copied' : 'Copy answer'}
              title="Copy answer"
              onClick={() => copy('answer')}
            >
              {copied === 'answer' ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-11 rounded-xl text-muted-foreground"
              aria-label={
                copied === 'share' ? 'Shareable snippet copied' : 'Copy a shareable snippet'
              }
              title="Copy a shareable snippet"
              onClick={() => copy('share')}
            >
              {copied === 'share' ? <Check className="size-4" /> : <Share2 className="size-4" />}
            </Button>
            {onPlayAudio && (
              <Button
                variant="ghost"
                size="icon"
                className="size-11 rounded-xl text-muted-foreground"
                disabled={Boolean(audioDisabledReason)}
                aria-label={audioDisabledReason ?? (isPlaying ? 'Stop audio' : 'Listen to answer')}
                title={audioDisabledReason ?? (isPlaying ? 'Stop audio' : 'Listen to answer')}
                onClick={onPlayAudio}
              >
                {isPlaying ? <Square className="size-4" /> : <Volume2 className="size-4" />}
              </Button>
            )}
            <div className="ml-auto min-w-0 [&_button]:min-h-11 [&_button]:min-w-11">
              <FeedbackBar
                contextType={contextType}
                messageId={messageId}
                conversationId={conversationId}
                language={language}
                originalText={answer}
                compact
              />
            </div>
          </div>
          {actionStatus && (
            <p role="status" className="text-xs leading-relaxed text-muted-foreground">
              {actionStatus}
            </p>
          )}
          <FollowUpChips suggestions={followUps} onSelect={onFollowUpSelect} />
        </>
      )}
      {view === 'reading' && (
        <section aria-label="Related reading" className="space-y-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Wikipedia results for your question. These pages were not used to generate the answer.
          </p>
          {sources.map((source, index) => (
            <SourceCard
              key={`${source.url}_${index}`}
              source={source}
              index={index}
              variant="list"
            />
          ))}
        </section>
      )}
      {view === 'images' && (
        <section aria-label="Related images" className="space-y-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Related images from Wikimedia Commons. Open an image to view its source and license.
          </p>
          {images.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((image, index) => (
                <a
                  key={`${image.url}_${index}`}
                  href={image.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 overflow-hidden rounded-xl border border-border bg-card transition-colors hover:bg-secondary"
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    <Image
                      src={image.thumbnail}
                      alt={image.title}
                      width={200}
                      height={200}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-xs font-semibold leading-relaxed [overflow-wrap:anywhere]">
                      {image.title}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {getSourceDomain(image.url)}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground">
              <ImageOff className="size-4" />
              No related images found.
            </div>
          )}
        </section>
      )}
    </div>
  );
}
