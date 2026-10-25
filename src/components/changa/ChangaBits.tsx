"use client";

import React from "react";
import { type TranslationKey } from "@/i18n/TranslationProvider";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Flame, Star, Trophy, Sparkles, Mic, PenLine, ShieldCheck, Users, ArrowRight, Clock3, Languages, Globe, Share2, History } from "lucide-react";

// ---------------------------------------------------------------------------
// Shared Changa building blocks (prototype revamp).
//
// Small, presentational pieces reused by the new Home, the community page and
// the profile so the streak / XP / goal language stays identical everywhere.
// ---------------------------------------------------------------------------

export function StreakXpChips({
  streakDays,
  xp,
  className,
}: {
  streakDays: number;
  xp: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-700 dark:bg-orange-900/40 dark:text-orange-200">
        <Flame className="size-3.5" aria-hidden />
        {streakDays}
        <span className="font-semibold opacity-80">day streak</span>
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
        <Star className="size-3.5" aria-hidden />
        {xp}
        <span className="font-semibold opacity-80">XP</span>
      </span>
    </div>
  );
}

export type TodayMission = {
  label: string;
  title: string;
  prompt: string;
  languageCode: string;
  dialectCode?: string;
  timeLabel: string;
  ctaLabel?: string;
};

// "My activity" pill. It is a real <button> so it stays keyboard- and
// screen-reader-accessible, and it stops click propagation so it never
// triggers the surrounding card's click target.
export function ActivityLinkButton({
  label,
  count,
  countLabel,
  onClick,
  className,
}: {
  label: string;
  count?: number;
  /** Screen-reader description of the count, e.g. "12 contributions". */
  countLabel?: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "h-8 gap-1.5 rounded-full border-border/70 bg-background/80 px-3 text-xs font-bold shadow-xs backdrop-blur transition-colors hover:bg-accent dark:border-amber-900/60 dark:bg-amber-950/40",
        className,
      )}
    >
      <History className="size-3.5" aria-hidden />
      {label}
      {typeof count === "number" && count > 0 ? (
        <>
          <span
            aria-hidden
            className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-black leading-none text-primary"
          >
            {count}
          </span>
          {countLabel ? <span className="sr-only">{countLabel}</span> : null}
        </>
      ) : null}
      <ArrowRight className="size-3.5" aria-hidden />
    </Button>
  );
}

// Merged "Today's goal + Today's mission" hero card. The whole card is a
// click target (mouse) while the inner <Button> stays the keyboard /
// screen-reader path — the button stops propagation so a single tap never
// double-fires the handler.
export function TodayGoalMissionCard({
  done,
  target,
  streakDays,
  xpToday,
  sentenceDone,
  sentenceTarget,
  mission,
  onStart,
  onViewActivity,
  activityLabel,
  activityCount,
  activityCountLabel,
}: {
  done: number;
  target: number;
  streakDays: number;
  xpToday: number;
  sentenceDone: number;
  sentenceTarget: number;
  mission: TodayMission;
  onStart: () => void;
  /** Opens the contributor's activity/history. Omit to hide the button. */
  onViewActivity?: () => void;
  activityLabel?: string;
  /** Optional contribution count rendered as a badge inside the button. */
  activityCount?: number;
  activityCountLabel?: string;
}) {
  const goalPercent = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
  const sentencePercent =
    sentenceTarget > 0 ? Math.min(100, Math.round((sentenceDone / sentenceTarget) * 100)) : 0;

  return (
    <Card
      onClick={onStart}
      className="cursor-pointer gap-4 border-amber-300/60 bg-gradient-to-b from-amber-50/70 to-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md active:translate-y-0 active:shadow-sm dark:border-amber-800/60 dark:from-amber-950/30"
    >
      {/* Today's goal */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
            Today&apos;s goal
          </h2>
          <p className="text-lg font-bold text-foreground">
            {done} of {target} done
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StreakXpChips streakDays={streakDays} xp={xpToday} />
          {onViewActivity ? (
            <ActivityLinkButton
              label={activityLabel ?? "My activity"}
              count={activityCount}
              countLabel={activityCountLabel}
              onClick={onViewActivity}
            />
          ) : null}
        </div>
      </div>
      <div className="space-y-2">
        <Progress value={goalPercent} className="h-2.5" />
        <div className="flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
          <span>Help reach 100,000 new sentences</span>
          <span className="font-black text-primary">{sentencePercent}%</span>
        </div>
        <Progress value={sentencePercent} className="h-1.5" />
      </div>

      {/* Today's mission */}
      <div className="space-y-2 border-t border-border/50 pt-3">
        <p className="flex items-center gap-1.5 text-sm font-black uppercase tracking-widest text-muted-foreground">
          <Sparkles className="size-4 text-primary" aria-hidden />
          {mission.label}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
            <Languages className="size-3" aria-hidden />
            {mission.languageCode}
            {mission.dialectCode ? ` · ${mission.dialectCode}` : ""}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
            <Clock3 className="size-3" aria-hidden />
            {mission.timeLabel}
          </span>
        </div>
        <h3 className="text-lg font-bold leading-snug text-foreground">{mission.title}</h3>
        <p className="text-sm text-muted-foreground">{mission.prompt}</p>
        <Button
          className="mt-1 w-full gap-1.5"
          size="lg"
          onClick={(e) => {
            e.stopPropagation();
            onStart();
          }}
        >
          {mission.ctaLabel ?? "Start task"}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </Card>
  );
}

// Merged "community + challenge" hero card. The whole card opens the
// community page (mouse); the inner buttons stop propagation so each action
// stays precise and keyboard-accessible.
export function CommunityHeroCard({
  title,
  hint,
  loading,
  challenge,
  openCtaLabel,
  challengeCtaLabel,
  onOpenCommunity,
  onJoinChallenge,
}: {
  title: string;
  hint?: string;
  loading?: boolean;
  challenge?: {
    title: string;
    description?: string;
    languageCode: string;
    current: number;
    goal: number;
  };
  openCtaLabel?: string;
  challengeCtaLabel?: string;
  onOpenCommunity: () => void;
  onJoinChallenge: () => void;
}) {
  const challengePercent =
    challenge && challenge.goal > 0
      ? Math.min(100, Math.round((challenge.current / challenge.goal) * 100))
      : 0;

  return (
    <Card
      onClick={onOpenCommunity}
      className="cursor-pointer gap-3 border-primary/20 bg-primary/5 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md active:translate-y-0 active:shadow-sm"
    >
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-sm font-black text-foreground">
          <Globe className="size-4 text-primary" aria-hidden />
          {title}
        </p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>

      {loading ? (
        <div className="space-y-2 rounded-xl border border-border/50 bg-card p-3">
          <div className="h-3 w-2/3 rounded bg-muted" />
          <div className="h-2 w-full rounded bg-muted" />
        </div>
      ) : challenge ? (
        <div className="space-y-1.5 rounded-xl border border-border/50 bg-card p-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-bold text-foreground">{challenge.title}</span>
            <span className="font-black text-primary">{challengePercent}%</span>
          </div>
          {challenge.description ? (
            <p className="text-xs text-muted-foreground">{challenge.description}</p>
          ) : null}
          <Progress value={challengePercent} className="h-1.5" />
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <span className="uppercase">{challenge.languageCode}</span>
            <span>
              {challenge.current.toLocaleString()} / {challenge.goal.toLocaleString()}
            </span>
          </div>
        </div>
      ) : null}

      <div className="flex gap-2">
        {challenge ? (
          <Button
            className="flex-1 gap-1.5"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onJoinChallenge();
            }}
          >
            {challengeCtaLabel ?? "Join the challenge"}
          </Button>
        ) : null}
        <Button
          variant="outline"
          className="flex-1 gap-1.5 font-bold"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onOpenCommunity();
          }}
        >
          {openCtaLabel ?? "Open community"}
          <ArrowRight className="size-3.5" aria-hidden />
        </Button>
      </div>
    </Card>
  );
}

export type HelpWayKey = "speak" | "write" | "check" | "community";

export const WAY_LABEL_KEYS: Record<HelpWayKey, TranslationKey> = {
  speak: "speakAndListen",
  write: "writeLabel",
  check: "checkLabel",
  community: "communityLabel",
};

const HELP_WAYS: Array<{ key: HelpWayKey; icon: typeof Mic; tone: string }> = [
  { key: "speak", icon: Mic, tone: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200" },
  { key: "write", icon: PenLine, tone: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200" },
  { key: "check", icon: ShieldCheck, tone: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200" },
  { key: "community", icon: Globe, tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200" },
];

export function WaysToHelpGrid({
  counts,
  onSelect,
  t,
}: {
  counts: Partial<Record<HelpWayKey, number>>;
  onSelect: (key: HelpWayKey) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {HELP_WAYS.map((way) => {
        const Icon = way.icon;
        const count = counts[way.key] ?? 0;
        return (
          <button
            key={way.key}
            type="button"
            onClick={() => onSelect(way.key)}
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 text-left transition-colors hover:bg-accent"
          >
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", way.tone)}>
              <Icon className="size-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-foreground">{t(WAY_LABEL_KEYS[way.key])}</span>
              <span className="block text-xs font-medium text-muted-foreground">
                {count > 0 ? `${count} open` : "Ready"}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ChangaSectionHeading({
  icon,
  title,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground">
        {icon}
        {title}
      </h3>
      {action}
    </div>
  );
}

export function RecognitionTile({
  label,
  name,
  metric,
  value,
}: {
  label: string;
  name: string;
  metric: string;
  value: number;
}) {
  return (
    <Card className="space-y-1 p-3 text-center shadow-sm">
      <Badge variant="secondary" className="mx-auto gap-1 text-[10px] font-bold uppercase">
        <Trophy className="size-3" aria-hidden />
        {label}
      </Badge>
      <p className="truncate text-sm font-black text-foreground">{name}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {value.toLocaleString()} {metric}
      </p>
    </Card>
  );
}

export type TodayBlockShortcut = {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
};

// Unified "today" block. Merges what used to be five stacked cards — the
// welcome/status header, quick contribute, the ways-to-help grid, the
// Achievements / Communities / Notifications shortcuts and the invite promo —
// into one Card with soft dividers so the page reads as a single unit.
//
// Design rules:
// - The whole block is a passive container: every action is a real <button>
//   inside it, so there is exactly one focus stop and one click target per
//   action (no nested card-level handlers firing twice).
// - The status line keeps its own aria-live="polite" region — e2e/a11y.spec.ts
//   scopes on `main [aria-live='polite']` and asserts it is non-empty.
// - Labels/counts arrive via props so i18n stays in ChangaHome.
export function ChangaTodayBlock({
  quickContributeLabel,
  quickContributeHint,
  letUsChooseLabel,
  onQuickContribute,
  waysToHelpTitle,
  wayCounts,
  onSelectWay,
  shortcuts,
  inviteMessage,
  inviteLabel,
  onInvite,
  t,
}: {
  quickContributeLabel: string;
  quickContributeHint: string;
  letUsChooseLabel: string;
  onQuickContribute: () => void;
  waysToHelpTitle: string;
  wayCounts: Partial<Record<HelpWayKey, number>>;
  onSelectWay: (key: HelpWayKey) => void;
  shortcuts?: TodayBlockShortcut[];
  inviteMessage: string;
  inviteLabel: string;
  onInvite: () => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}) {
  return (
    <Card className="gap-0 overflow-hidden p-0 shadow-sm">
      {/* Quick contribute — the single primary action of the block */}
      <div className="space-y-2.5 border-t border-border/50 p-4">
        <div className="min-w-0">
          <p className="text-sm font-black text-foreground">{quickContributeLabel}</p>
          <p className="truncate text-xs text-muted-foreground">{quickContributeHint}</p>
        </div>
        <Button className="w-full gap-1.5 font-bold" size="lg" onClick={onQuickContribute}>
          {letUsChooseLabel}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>

      {/* All ways to help — compact tiles that live inside the block */}
      <div className="space-y-2.5 border-t border-border/50 p-4">
        <ChangaSectionHeading title={waysToHelpTitle} />
        <div className="grid grid-cols-2 gap-2">
          {HELP_WAYS.map((way) => {
            const Icon = way.icon;
            const count = wayCounts[way.key] ?? 0;
            return (
              <button
                key={way.key}
                type="button"
                onClick={() => onSelectWay(way.key)}
                className="flex items-center gap-2.5 rounded-xl bg-muted/50 p-2.5 text-left transition-colors hover:bg-accent"
              >
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", way.tone)}>
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-foreground">{t(WAY_LABEL_KEYS[way.key])}</span>
                  <span className="block text-xs font-medium text-muted-foreground">
                    {count > 0 ? `${count} open` : "Ready"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Shortcuts: Achievements / Communities / Notifications */}
      {shortcuts && shortcuts.length > 0 ? (
        <div className="grid grid-cols-3 divide-x divide-border/50 border-t border-border/50">
          {shortcuts.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={item.onClick}
              className="flex flex-col items-center gap-1 px-2 py-3 text-center transition-colors hover:bg-accent"
            >
              <span className="text-primary">{item.icon}</span>
              <span className="text-[11px] font-bold text-foreground">{item.label}</span>
            </button>
          ))}
        </div>
      ) : null}

      {/* Invite footer — subtle, dashed divider so it reads as an afterthought */}
      <div className="flex items-center justify-between gap-3 border-t border-dashed border-border/60 bg-muted/30 p-4">
        <p className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <Users className="size-4 shrink-0" aria-hidden />
          <span className="line-clamp-2">{inviteMessage}</span>
        </p>
        <Button variant="outline" size="sm" onClick={onInvite} className="shrink-0 gap-1.5 font-bold">
          <Share2 className="size-3.5" aria-hidden />
          {inviteLabel}
        </Button>
      </div>
    </Card>
  );
}
