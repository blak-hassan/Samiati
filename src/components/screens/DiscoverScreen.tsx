'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Screen } from '@/types';
import { Button } from '@/components/ui/button';
import { DiscoverCard } from '@/components/discover/DiscoverCard';
import { ServiceUnavailable } from '@/components/shared/ServiceUnavailable';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  Bookmark,
  ArrowLeft,
  Compass,
  Globe,
  MapPin,
  Cpu,
  Music,
  Newspaper,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Id } from '../../../convex/_generated/dataModel';

interface DiscoverScreenProps {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
}

const CATEGORIES = [
  { id: 'for_you', label: 'For You', icon: Compass },
  { id: 'kenya', label: 'Kenya', icon: MapPin },
  { id: 'africa', label: 'Africa', icon: Globe },
  { id: 'tech', label: 'Technology', icon: Cpu },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'culture', label: 'Culture', icon: Music },
  { id: 'world', label: 'World', icon: Newspaper },
  { id: 'saved', label: 'Saved', icon: Bookmark },
];

export function DiscoverScreen(props: DiscoverScreenProps) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <ServiceUnavailable
        feature="Discover"
        active="discover"
        description="Stories are unavailable in this preview. When Discover is connected, sourced stories and your saved reading list will appear here."
      />
    );
  }
  return (
    <Suspense
      fallback={
        <p role="status" className="p-8 text-muted-foreground">
          Loading Discover…
        </p>
      }
    >
      <LiveDiscoverScreen {...props} />
    </Suspense>
  );
}

function LiveDiscoverScreen({ navigate }: DiscoverScreenProps) {
  const searchParams = useSearchParams();
  const [chosenCategory, setActiveCategory] = useState<string | null>(null);
  const activeCategory =
    chosenCategory ?? (searchParams.get('view') === 'saved' ? 'saved' : 'for_you');
  const { isGuest } = useCurrentUser();
  const feed = useQuery(api.discover.feed.getFeed, {
    category: activeCategory === 'saved' ? 'for_you' : activeCategory,
    limit: 20,
  });
  const savedTopics = useQuery(api.discover.feed.getSavedTopics, isGuest ? 'skip' : {});
  const trackEngagement = useMutation(api.discover.feed.trackEngagement);
  const saveTopic = useMutation(api.discover.feed.saveTopic);
  const savedIds = new Set((savedTopics ?? []).map((topic) => topic._id as string));
  const stories = activeCategory === 'saved' ? savedTopics : feed;

  const handleExplore = async (query: string, clusterId: string) => {
    // Analytics must never prevent the main reading-to-chat flow.
    void trackEngagement({
      clusterId: clusterId as Id<'discoverClusters'>,
      action: 'explore',
    }).catch(() => {});
    navigate(Screen.HOME_CHAT, { q: query });
  };

  const handleSave = async (clusterId: string) => {
    if (isGuest) throw new Error('Sign in to save stories to your account.');
    await saveTopic({ clusterId: clusterId as Id<'discoverClusters'> });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/50 bg-background/95 px-4 backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => navigate(Screen.HOME_CHAT)}
          aria-label="Back to chat"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <Compass className="size-5 text-primary" aria-hidden="true" />
        <h1 className="text-base font-bold tracking-tight">Discover</h1>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-4xl flex-1 px-4 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 py-3">
          <nav aria-label="Story categories" className="flex max-w-full gap-1 overflow-x-auto pb-1">
            {CATEGORIES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={activeCategory === id}
                onClick={() => setActiveCategory(id)}
                className={cn(
                  'inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors',
                  activeCategory === id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </nav>
          <p className="text-xs text-muted-foreground">
            Updates automatically · AI summaries, publisher sources
          </p>
        </div>
        {activeCategory === 'saved' && isGuest ? (
          <div className="my-12 rounded-2xl border bg-card p-8 text-center">
            <Bookmark className="mx-auto mb-4 size-8 text-primary" aria-hidden="true" />
            <h2 className="text-xl font-semibold">A place for the stories you want to keep.</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to access your saved stories across devices.
            </p>
            <Button className="mt-5" onClick={() => navigate(Screen.SIGN_IN)}>
              Sign in
            </Button>
          </div>
        ) : stories === undefined ? (
          <div
            role="status"
            className="flex items-center justify-center gap-3 py-24 text-muted-foreground"
          >
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            Loading stories…
          </div>
        ) : stories.length === 0 ? (
          <div className="my-12 rounded-2xl border border-dashed p-10 text-center">
            <Compass className="mx-auto mb-4 size-8 text-primary" aria-hidden="true" />
            <h2 className="text-xl font-semibold">
              {activeCategory === 'saved'
                ? 'Your reading list starts here.'
                : 'Something worth exploring is on its way.'}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {activeCategory === 'saved'
                ? 'Save a story from the feed and find it here whenever you want to return.'
                : 'There are no published stories in this category yet. Choose another topic or return later.'}
            </p>
            {activeCategory !== 'for_you' && (
              <Button
                variant="outline"
                className="mt-5"
                onClick={() => setActiveCategory('for_you')}
              >
                Browse all stories
              </Button>
            )}
          </div>
        ) : (
          <section
            className="mt-4 min-w-0 space-y-3"
            aria-label={activeCategory === 'saved' ? 'Saved stories' : 'Latest stories'}
          >
            {stories.map((topic, index) => (
              <DiscoverCard
                key={topic._id}
                cluster={topic}
                featured={index === 0 && activeCategory !== 'saved'}
                saved={savedIds.has(topic._id)}
                onExplore={handleExplore}
                onSave={handleSave}
              />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
