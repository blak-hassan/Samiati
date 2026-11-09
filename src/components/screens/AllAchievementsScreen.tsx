'use client';

import { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { localConversationService } from '@/services/localConversationService';
import { ServiceUnavailable } from '@/components/shared/ServiceUnavailable';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  FileCheck2,
  Languages,
  MessageCircle,
  Mic,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  goBack: () => void;
}
type MilestoneFilter = 'All' | 'Recognized' | 'In progress';

export default function AllAchievementsScreen(props: Props) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL)
    return (
      <ServiceUnavailable
        feature="Contribution milestones"
        active="profile"
        description="Milestones reflect real conversations and reviewed contributions. They will appear when your account is connected."
      />
    );
  return <LiveMilestones {...props} />;
}

function LiveMilestones({ goBack }: Props) {
  const dashboard = useQuery(api.profile.queries.getDashboard, {});
  const [filter, setFilter] = useState<MilestoneFilter>('All');
  const conversationCount = useMemo(() => localConversationService.getConversations().length, []);
  const contribution = dashboard?.contribution;
  const milestones = [
    {
      title: 'A first conversation',
      description: 'Start a conversation with Samiati on this browser.',
      icon: MessageCircle,
      count: conversationCount,
      goal: 1,
    },
    {
      title: 'A word that helps',
      description: 'Have your first Changa contribution accepted.',
      icon: FileCheck2,
      count: contribution?.accepted ?? 0,
      goal: 1,
    },
    {
      title: 'A voice in the collection',
      description: 'Have a voice recording accepted after review.',
      icon: Mic,
      count: contribution?.voiceAccepted ?? 0,
      goal: 1,
    },
    {
      title: 'A thoughtful second opinion',
      description: 'Review a community contribution.',
      icon: ShieldCheck,
      count: contribution?.validationCount ?? 0,
      goal: 1,
    },
    {
      title: 'Language builder',
      description: 'Build a collection of 25 accepted contributions.',
      icon: Languages,
      count: contribution?.accepted ?? 0,
      goal: 25,
    },
    {
      title: 'Community care',
      description: 'Share your perspective through 10 community reviews.',
      icon: Award,
      count: contribution?.validationCount ?? 0,
      goal: 10,
    },
  ];
  const shown = milestones.filter(
    (item) =>
      filter === 'All' ||
      (filter === 'Recognized' ? item.count >= item.goal : item.count < item.goal)
  );

  return (
    <div className="min-h-dvh bg-background pb-8">
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/50 bg-background/95 px-4 backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
          className="rounded-full"
          aria-label="Go back"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="ml-2 text-lg font-bold tracking-tight">Achievements</h1>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter milestones">
          {(['All', 'Recognized', 'In progress'] as const).map((item) => (
            <Button
              key={item}
              variant={filter === item ? 'secondary' : 'ghost'}
              aria-pressed={filter === item}
              className="min-h-11"
              onClick={() => setFilter(item)}
            >
              {item}
            </Button>
          ))}
        </div>
        {dashboard === undefined ? (
          <p role="status" className="rounded-2xl border bg-card p-8 text-sm text-muted-foreground">
            Loading your contribution milestones…
          </p>
        ) : !dashboard ? (
          <p className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
            Sign in to see milestones from your contribution history.
          </p>
        ) : shown.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
            No milestones in this view yet. Your next contribution can start whenever you are ready.
          </p>
        ) : (
          <section className="grid gap-3 sm:grid-cols-2" aria-label="Your milestones">
            {shown.map(({ title, description, icon: Icon, count, goal }) => {
              const recognized = count >= goal;
              return (
                <article
                  key={title}
                  className={cn(
                    'rounded-xl border border-border/50 bg-muted/20 p-4',
                    recognized && 'border-primary/40'
                  )}
                >
                  <div className="mb-5 flex items-center justify-between gap-2">
                    <Icon className="size-6 text-primary" aria-hidden="true" />
                    {recognized ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-success">
                        <CheckCircle2 className="size-4" />
                        Recognized
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">In progress</span>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold">{title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                  <p className="mt-5 text-xs text-muted-foreground">
                    {Math.min(count, goal)} of {goal}
                    {title === 'A first conversation' ? ' · stored on this browser' : ''}
                  </p>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
