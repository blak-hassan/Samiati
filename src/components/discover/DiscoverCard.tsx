'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowUpRight,
  Bookmark,
  Check,
  Compass,
  ExternalLink,
  Loader2,
  Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiscoverCardProps {
  cluster: {
    _id: string;
    topicTitle: string;
    summary: string;
    whyTrending: string;
    suggestedQuery: string;
    category: string;
    country: string;
    sourceCount: number;
    sourceDomains: string[];
    newestPublishedAt: number;
    trendScore: number;
    imageUrl?: string;
  };
  featured?: boolean;
  saved?: boolean;
  onExplore: (query: string, clusterId: string) => void | Promise<void>;
  onSave?: (clusterId: string) => void | Promise<void>;
  onDismiss?: (clusterId: string) => void | Promise<void>;
}

/** Publisher links deliberately lead to homepages; article URLs are not supplied. */
function publisherUrl(domain: string): string | null {
  const candidate = domain.trim();
  if (!/^(?:[a-z0-9-]+\.)+[a-z]{2,63}$/i.test(candidate)) return null;
  return `https://${candidate}/`;
}

export function DiscoverCard({
  cluster,
  featured = false,
  saved = false,
  onExplore,
  onSave,
}: DiscoverCardProps) {
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const date =
    Number.isFinite(cluster.newestPublishedAt) && cluster.newestPublishedAt > 0
      ? new Date(cluster.newestPublishedAt)
      : null;
  const dateLabel = date?.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const category = cluster.category === 'tech' ? 'Technology' : cluster.category;

  const handleSave = async () => {
    if (!onSave || saved || saving) return;
    setSaving(true);
    setError(null);
    setFeedback(null);
    try {
      await onSave(cluster._id);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : 'We could not save this story. Try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    setError(null);
    setFeedback(null);
    const url = new URL('/dashboard/discover', window.location.origin).href;
    try {
      if (navigator.share)
        await navigator.share({ title: cluster.topicTitle, text: cluster.summary, url });
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${cluster.topicTitle}\n${cluster.summary}\n${url}`);
        setFeedback('Story summary and Discover link copied.');
      } else
        setError(
          'Sharing is unavailable in this browser. You can copy the summary from the reading view.'
        );
    } catch (failure) {
      if (!(failure instanceof DOMException && failure.name === 'AbortError'))
        setError('We could not share this story. Try again.');
    }
  };

  const sources = (
    <div className="flex flex-wrap gap-2">
      {cluster.sourceDomains.map((domain) => {
        const href = publisherUrl(domain);
        return href ? (
          <a
            key={domain}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
            aria-label={`Visit ${domain} publisher homepage`}
          >
            {domain.replace(/^www\./, '')}
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        ) : (
          <span key={domain} className="break-all text-xs text-muted-foreground">
            {domain}
          </span>
        );
      })}
    </div>
  );

  return (
    <>
      <article
        className={cn(
          'group flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 transition-colors duration-200 hover:border-primary/60 sm:p-6',
          featured && 'md:col-span-2 lg:col-span-2'
        )}
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="font-medium capitalize text-primary">
            {featured ? 'In focus · ' : ''}
            {category}
            {cluster.country ? ` · ${cluster.country}` : ''}
          </span>
          {date && <time dateTime={date.toISOString()}>{dateLabel}</time>}
        </div>
        <button type="button" className="text-left" onClick={() => setReading(true)}>
          <h2
            className={cn(
              'break-words font-semibold leading-tight tracking-tight text-foreground group-hover:text-primary',
              featured ? 'font-editorial text-3xl sm:text-4xl' : 'text-xl'
            )}
          >
            {cluster.topicTitle}
          </h2>
        </button>
        <p className="mt-4 text-xs font-medium text-ai">AI-generated summary</p>
        <p className="mt-2 line-clamp-4 break-words text-sm leading-relaxed text-muted-foreground">
          {cluster.summary || 'Open this topic to explore its available source information.'}
        </p>
        <div className="mt-5 flex-1">
          <p className="mb-2 text-xs text-muted-foreground">
            {cluster.sourceCount} source{cluster.sourceCount === 1 ? '' : 's'} · publisher homepages
          </p>
          {sources}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <Button
            variant="ghost"
            onClick={() => setReading(true)}
            className="-ml-2 min-h-11 gap-1.5 text-sm"
          >
            Read summary
            <ArrowUpRight className="size-4" />
          </Button>
          <div className="flex gap-1">
            {onSave && (
              <Button
                variant="ghost"
                size="icon"
                className="size-11"
                disabled={saving || saved}
                aria-label={
                  saved ? `Saved: ${cluster.topicTitle}` : `Save story: ${cluster.topicTitle}`
                }
                onClick={handleSave}
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : saved ? (
                  <Check className="size-4 text-primary" />
                ) : (
                  <Bookmark className="size-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-11"
              aria-label={`Share story: ${cluster.topicTitle}`}
              onClick={handleShare}
            >
              <Share2 className="size-4" />
            </Button>
          </div>
        </div>
        {feedback && (
          <p role="status" className="mt-2 text-xs text-muted-foreground">
            {feedback}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button
          variant="outline"
          className="mt-3 min-h-11 w-full gap-2"
          onClick={() => onExplore(cluster.suggestedQuery, cluster._id)}
        >
          <Compass className="size-4" />
          Ask Samiati about this
        </Button>
      </article>
      <Dialog open={reading} onOpenChange={setReading}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-2xl sm:max-w-2xl">
          <DialogHeader className="pr-5 text-left">
            <DialogDescription className="text-xs text-ai">
              Discover · AI-generated summary{dateLabel ? ` · ${dateLabel}` : ''}
            </DialogDescription>
            <DialogTitle className="font-editorial text-3xl font-normal leading-tight sm:text-4xl">
              {cluster.topicTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="whitespace-pre-wrap break-words text-base leading-relaxed">
            {cluster.summary || 'No summary is available for this topic yet.'}
          </div>
          {cluster.whyTrending && (
            <p className="rounded-xl bg-secondary p-4 text-sm leading-relaxed text-muted-foreground">
              {cluster.whyTrending}
            </p>
          )}
          <section className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold">Publisher sources</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              This is an AI summary, not original reporting. Links below open publisher homepages;
              individual article links are not supplied in this feed. Check the original reporting
              before relying on a claim.
            </p>
            {sources}
          </section>
          <Button
            className="min-h-11 gap-2"
            onClick={() => {
              setReading(false);
              void onExplore(cluster.suggestedQuery, cluster._id);
            }}
          >
            <Compass className="size-4" />
            Explore in your language
          </Button>
          <p className="text-xs text-muted-foreground">
            Choose your language in chat to ask about this topic.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
