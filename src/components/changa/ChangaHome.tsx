'use client';

import { ChangaShell } from './ChangaShell';
import { PageIntro } from '@/components/product/PageIntro';
import { ServiceUnavailable } from '@/components/shared/ServiceUnavailable';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useNavigation } from '@/hooks/useNavigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/types';
import { logChangaEvent } from '@/lib/changaTelemetry';
import {
  changaTaskLabel,
  CHANGA_LANGUAGE_OPTIONS,
  CHANGA_SHENG_DIALECTS,
  isChangaQuickTaskType,
} from '@/lib/changa';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Languages,
  Share2,
  Sparkles,
  Target,
  Users,
  Trophy,
  MapPin,
} from 'lucide-react';

interface ChangaHomeProps {
  onViewActivity?: () => void;
}

// How many review-queue items the home screen previews. The count is shown as
// "N+" when the preview is saturated, so it never overstates the backlog.
const REVIEW_QUEUE_PREVIEW = 20;

export default function ChangaHome(props: ChangaHomeProps) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL)
    return (
      <ServiceUnavailable
        feature="Changa"
        active="changa"
        description="Your language grows with every contribution. Connect to Changa to discover translation, recording, and review tasks from the community."
      />
    );
  return <LiveChangaHome {...props} />;
}

function LiveChangaHome({ onViewActivity }: ChangaHomeProps) {
  const { navigate } = useNavigation();
  const [selectedLanguage, setSelectedLanguage] = useState('sheng');
  const [selectedDialect, setSelectedDialect] = useState<string | null>(null);
  const [showDialectPicker, setShowDialectPicker] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // The Changa entry point can be opened with ?campaignId=… (from the
  // campaigns screen) or ?ref=… (an invite referral). Both are read once on
  // mount so the screen never depends on a search-params suspense boundary.
  const [entryParams] = useState(() => {
    if (typeof window === 'undefined') {
      return { campaignId: null, ref: null };
    }
    const search = new URLSearchParams(window.location.search);
    return {
      campaignId: search.get('campaignId'),
      ref: search.get('ref'),
    };
  });

  const tasks = useQuery(api.changa.tasks.listAvailableTasks, {
    languageCode: selectedLanguage,
    dialectCode: selectedDialect ?? undefined,
    limit: 50,
  });
  const userSubmissions = useQuery(api.changa.submissions.listUserSubmissions, { limit: 50 });
  const campaigns = useQuery(api.changa.campaigns.listActiveCampaigns, {
    languageCode: selectedLanguage,
    limit: 5,
  });
  // Peer-review lane. The query already excludes the contributor's own work
  // and anything they have already voted on.
  const reviewQueue = useQuery(api.changa.validation.listValidationQueue, {
    languageCode: selectedLanguage,
    limit: REVIEW_QUEUE_PREVIEW,
  });
  const userStats = useQuery(api.changa.stats.getUserContributionStats, {});
  const languageStats = useQuery(api.changa.stats.getLanguageProgressStats, {
    languageCode: selectedLanguage,
  });
  const inviteCode = useQuery(api.changa.invites.getMyInviteCode);
  const generateInviteCode = useMutation(api.changa.invites.generateInviteCode);
  const recordInviteClick = useMutation(api.changa.invites.recordInviteClick);

  // Only task types the quick-contribute form can actually complete are
  // offered. The list lives in @/lib/changa so the home screen and the
  // contribution screen always agree on it.
  //
  // When the contributor arrived from a campaign, the queue is narrowed to
  // that campaign. The filter is applied here rather than on the server so a
  // hand-crafted `?campaignId=` value can never break the query.
  const openTasks = (tasks || []).filter(
    (task) =>
      isChangaQuickTaskType(task.taskType) &&
      (!entryParams.campaignId || task.campaignId === entryParams.campaignId)
  );
  const recommendedTask = openTasks[0];
  const otherTasks = openTasks.slice(1, 6);
  const scopedCampaign = entryParams.campaignId
    ? (campaigns || []).find((campaign) => campaign._id === entryParams.campaignId)
    : undefined;

  // `acceptedCount` comes from the stats query so the number matches the
  // trust score and the activity list, instead of being re-derived from a
  // truncated page of submissions.
  const acceptedCount = userStats?.acceptedCount ?? 0;
  const inReviewCount = (userSubmissions || []).filter(
    (sub) => sub.status === 'in_validation' || sub.status === 'submitted'
  ).length;

  const startTask = (taskId: string) => {
    // The language travels with the task so the contribution screen can
    // resolve exactly this task instead of guessing from the queue.
    navigate(Screen.ADD_CONTRIBUTION, { taskId, language: selectedLanguage });
  };

  const handleShare = async () => {
    setInviteError(null);
    try {
      // Generate or reuse an invite code. The mutation is idempotent, so
      // sharing twice never creates a second invite record.
      const code = inviteCode ?? (await generateInviteCode({ channel: 'share' }));
      // The Changa entry point lives under /dashboard — pointing at
      // "/changa" produced a dead link.
      const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/changa?ref=${code}`;
      const shareData = {
        title: 'Join me on Changa',
        text: `I'm helping build AI that understands ${CHANGA_LANGUAGE_OPTIONS.find((language) => language.id === selectedLanguage)?.label ?? 'our languages'}. Join me on Samiati!`,
        url: shareUrl,
      };
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        setShowInvite(true);
        setTimeout(() => setShowInvite(false), 2000);
      }
    } catch (failure) {
      if (!(failure instanceof DOMException && failure.name === 'AbortError'))
        setInviteError('We could not share the invite. Try again or use another browser.');
    }
  };

  // Record the referral that brought this contributor in.
  const inviteRefRecorded = useRef(false);
  useEffect(() => {
    if (inviteRefRecorded.current || !entryParams.ref) return;

    inviteRefRecorded.current = true;
    void recordInviteClick({ inviteCode: entryParams.ref }).catch(() => {
      // A stale or unknown referral must never block the page.
    });
  }, [entryParams.ref, recordInviteClick]);

  // Log the recommended task as "offered" exactly once, after render.
  const offeredRef = useRef<string | null>(null);
  useEffect(() => {
    if (recommendedTask && offeredRef.current !== recommendedTask._id) {
      offeredRef.current = recommendedTask._id;
      logChangaEvent({
        name: 'task_offered',
        taskType: recommendedTask.taskType,
        languageCode: recommendedTask.languageCode,
        taskId: recommendedTask._id,
      });
    }
  }, [recommendedTask]);

  return (
    <ChangaShell>
      <div className="mx-auto max-w-3xl space-y-5">
        {/* Header */}
        <div className="space-y-5">
          <PageIntro
            eyebrow="Changa · Built together"
            title={
              <>
                A little of your language.
                <br />
                <span className="text-ai">A world of possibility.</span>
              </>
            }
            description="A phrase, a recording, a second opinion. Help build AI that speaks more like home, one thoughtful contribution at a time."
          />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleShare} className="min-h-11 gap-1.5">
              <Share2 className="size-4" />
              Invite
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewActivity ?? (() => navigate(Screen.CHANGA_ACTIVITY))}
            >
              My activity
            </Button>
          </div>
        </div>

        {inviteError && (
          <p role="alert" className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
            {inviteError}
          </p>
        )}
        {/* Invite success toast */}
        {showInvite && (
          <div role="status" className="rounded-lg bg-success/10 p-3 text-sm text-success">
            Link copied! Invite someone to contribute in their language.
          </div>
        )}

        {/* Campaign scope — shown when the contributor arrived from a campaign */}
        {entryParams.campaignId && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm  ">
            <span className="min-w-0 truncate">
              <Target className="mr-1.5 inline size-3.5" />
              {scopedCampaign ? `Tasks for ${scopedCampaign.title}` : 'Tasks for this campaign'}
            </span>
            <button
              onClick={() => navigate(Screen.CHANGA)}
              className="shrink-0 text-xs font-medium underline underline-offset-2"
            >
              Show all tasks
            </button>
          </div>
        )}

        {/* Language selector */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Contribution language">
          {CHANGA_LANGUAGE_OPTIONS.map((lang) => (
            <button
              key={lang.id}
              type="button"
              aria-pressed={selectedLanguage === lang.id}
              onClick={() => {
                setSelectedLanguage(lang.id);
                setSelectedDialect(null);
              }}
              className={`flex items-center gap-1.5 min-h-11 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                selectedLanguage === lang.id
                  ? 'bg-ai/10 text-ai'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              <Languages className="size-4" aria-hidden="true" />
              {lang.label}
            </button>
          ))}
        </div>

        {/* Sheng dialect picker */}
        {selectedLanguage === 'sheng' && (
          <div className="space-y-2">
            <button
              onClick={() => setShowDialectPicker(!showDialectPicker)}
              aria-expanded={showDialectPicker}
              className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <MapPin className="size-3.5" />
              {selectedDialect
                ? CHANGA_SHENG_DIALECTS.find((d) => d.id === selectedDialect)?.label
                : 'All Sheng varieties'}
              <span className="text-xs" aria-hidden="true">
                ▼
              </span>
            </button>
            {showDialectPicker && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSelectedDialect(null);
                    setShowDialectPicker(false);
                  }}
                  className={`min-h-11 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                    selectedDialect === null
                      ? 'bg-warning/10 text-warning'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  All varieties
                </button>
                {CHANGA_SHENG_DIALECTS.map((dialect) => (
                  <button
                    key={dialect.id}
                    type="button"
                    aria-pressed={selectedDialect === dialect.id}
                    onClick={() => {
                      setSelectedDialect(dialect.id);
                      setShowDialectPicker(false);
                    }}
                    className={`min-h-11 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                      selectedDialect === dialect.id
                        ? 'bg-warning/10 text-warning'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {dialect.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Language health stats */}
        {languageStats && (
          <Card className="grid grid-cols-2 gap-4 p-5 text-center sm:grid-cols-4">
            <div>
              <p className="text-lg font-bold text-warning ">{languageStats.openTasks}</p>
              <p className="text-xs text-muted-foreground">Open tasks</p>
            </div>
            <div>
              <p className="text-lg font-bold text-ai ">{languageStats.submissions}</p>
              <p className="text-xs text-muted-foreground">Submitted</p>
            </div>
            <div>
              <p className="text-lg font-bold text-success ">{languageStats.curatedExamples}</p>
              <p className="text-xs text-muted-foreground">Curated</p>
            </div>
            <div>
              <p className="text-lg font-bold text-ai ">{languageStats.activeCampaigns}</p>
              <p className="text-xs text-muted-foreground">Campaigns</p>
            </div>
          </Card>
        )}

        {/* Personal impact */}
        <Card className="flex flex-wrap items-center gap-4 p-5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-success/10 text-success  ">
            <CheckCircle2 className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Your impact</p>
            <p className="text-xs text-muted-foreground">
              {userSubmissions === undefined || userStats === undefined
                ? 'Loading your contribution activity…'
                : acceptedCount > 0
                  ? `${acceptedCount} accepted contribution${acceptedCount === 1 ? '' : 's'} helping train Samiati.`
                  : inReviewCount > 0
                    ? `${inReviewCount} contribution${inReviewCount === 1 ? '' : 's'} being checked by reviewers.`
                    : 'No contributions yet — start with the task below.'}
            </p>
          </div>
          {userStats && userStats.trustScore > 0 && (
            <div className="text-right">
              <p className="text-lg font-bold text-warning ">{userStats.trustScore}</p>
              <p className="text-xs text-muted-foreground">Trust</p>
            </div>
          )}
        </Card>

        {/* Active campaigns */}
        {campaigns && campaigns.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                <Trophy className="size-3.5" />
                Active campaigns
              </h3>
              <button
                onClick={() => navigate(Screen.CHANGA_CAMPAIGNS)}
                className="min-h-11 text-xs text-ai hover:underline"
              >
                View all
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {campaigns.map((campaign) => {
                const progress =
                  campaign.goalCount > 0
                    ? Math.min(100, Math.round((campaign.currentCount / campaign.goalCount) * 100))
                    : 0;
                return (
                  <Card key={campaign._id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{campaign.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {campaign.description}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-warning ">{progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="bg-warning/10 h-1.5 rounded-full transition-colors duration-200"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {campaign.currentCount} / {campaign.goalCount} contributions
                    </p>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Community review — the peer lane is how contributions earn trust */}
        <Card className="flex flex-wrap items-center gap-4 p-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ai/10 text-ai  ">
            <CheckCircle2 className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Review a contribution</p>
            <p className="text-xs text-muted-foreground">
              {reviewQueue === undefined
                ? 'Checking the review queue…'
                : reviewQueue.length === 0
                  ? 'Nothing is waiting for review right now.'
                  : reviewQueue.length < REVIEW_QUEUE_PREVIEW
                    ? `${reviewQueue.length} waiting for review`
                    : `${REVIEW_QUEUE_PREVIEW}+ waiting for review`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="min-h-11 shrink-0 gap-1.5"
            onClick={() => navigate(Screen.CHANGA_VALIDATE, { language: selectedLanguage })}
          >
            Review
            <ArrowRight className="size-3.5" />
          </Button>
        </Card>

        {/* Recommended task */}
        {recommendedTask ? (
          <Card className="space-y-4 border-ai/40 bg-ai/5 p-6 sm:p-8 ">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-warning ">
              <Sparkles className="size-3.5" />A place to start
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                  <Languages className="size-3" />
                  {recommendedTask.languageCode}
                  {recommendedTask.dialectCode ? ` · ${recommendedTask.dialectCode}` : ''}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                  <Clock3 className="size-3" />
                  about 15 seconds
                </span>
              </div>
              <h2 className="text-xl font-bold leading-snug">
                {changaTaskLabel(recommendedTask.taskType)}
              </h2>
              <p className="text-sm text-muted-foreground">
                {recommendedTask.promptSourceText ||
                  recommendedTask.promptTargetText ||
                  'A short task to help your language.'}
              </p>
            </div>
            <Button className="w-full" size="lg" onClick={() => startTask(recommendedTask._id)}>
              Start task
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Card>
        ) : (
          <Card className="space-y-3 p-6 text-center">
            <Target className="mx-auto size-8 text-muted-foreground" />
            <h2 className="text-lg font-semibold">
              {tasks === undefined ? 'Loading tasks...' : 'No tasks are open right now'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {tasks === undefined
                ? 'Finding available tasks.'
                : entryParams.campaignId
                  ? 'This campaign has no open tasks right now. Check back soon or browse all tasks.'
                  : `No ${selectedLanguage} tasks available. Check back soon or try another language.`}
            </p>
          </Card>
        )}

        {/* Task switcher */}
        {otherTasks.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">More tasks</h3>
            <div className="space-y-2">
              {otherTasks.map((task) => (
                <button
                  key={task._id}
                  onClick={() => startTask(task._id)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-accent"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{changaTaskLabel(task.taskType)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {task.languageCode}
                      {task.dialectCode ? ` · ${task.dialectCode}` : ''}
                      {task.promptSourceText ? ` — ${task.promptSourceText}` : ''}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Invite section */}
        <Card className="space-y-3 p-4 text-center border-dashed">
          <Users className="mx-auto size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Language grows through community.</p>
          <Button variant="outline" size="sm" onClick={handleShare} className="min-h-11 gap-1.5">
            <Share2 className="size-3.5" />
            Invite a friend
          </Button>
        </Card>
      </div>
    </ChangaShell>
  );
}
