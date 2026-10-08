"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Flame, Star, Trophy, Sparkles, Mic, PenLine, ShieldCheck, Users } from "lucide-react";

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

export function TodayGoalCard({
  done,
  target,
  streakDays,
  xpToday,
  sentenceDone,
  sentenceTarget,
}: {
  done: number;
  target: number;
  streakDays: number;
  xpToday: number;
  sentenceDone: number;
  sentenceTarget: number;
}) {
  const goalPercent = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
  const sentencePercent =
    sentenceTarget > 0 ? Math.min(100, (sentenceDone / sentenceTarget) * 100) : 0;

  return (
    <Card className="space-y-4 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
            Today&apos;s goal
          </h2>
          <p className="text-lg font-bold text-foreground">
            {done} of {target} done
          </p>
        </div>
        <StreakXpChips streakDays={streakDays} xp={xpToday} />
      </div>
      <Progress value={goalPercent} className="h-2.5" />
      <div className="space-y-2 border-t border-border/50 pt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-foreground">Help reach 100,000 new sentences</span>
          <span className="font-black text-primary">{Math.round(sentencePercent)}%</span>
        </div>
        <Progress value={sentencePercent} className="h-2" />
        <p className="text-xs font-medium text-muted-foreground">
          {sentenceDone.toLocaleString()} of {sentenceTarget.toLocaleString()} · there
        </p>
      </div>
    </Card>
  );
}

export function CommunityChallengeCard({
  title,
  description,
  languageCode,
  current,
  goal,
  onStart,
}: {
  title: string;
  description?: string;
  languageCode: string;
  current: number;
  goal: number;
  onStart: () => void;
}) {
  const percent = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
  return (
    <Card className="space-y-3 border-amber-300/60 p-5 shadow-sm dark:border-amber-800/60">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
        <Sparkles className="size-3.5" aria-hidden />
        Community challenge
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-bold leading-snug">{title}</h3>
        {description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <Progress value={percent} className="h-2" />
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span className="uppercase">{languageCode}</span>
          <span>
            {current.toLocaleString()} / {goal.toLocaleString()}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Join the challenge
      </button>
    </Card>
  );
}

export type HelpWayKey = "speak" | "write" | "check" | "together";

const HELP_WAYS: Array<{ key: HelpWayKey; label: string; icon: typeof Mic; tone: string }> = [
  { key: "speak", label: "Speak and listen", icon: Mic, tone: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200" },
  { key: "write", label: "Write", icon: PenLine, tone: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200" },
  { key: "check", label: "Check", icon: ShieldCheck, tone: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200" },
  { key: "together", label: "Together", icon: Users, tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200" },
];

export function WaysToHelpGrid({
  counts,
  onSelect,
}: {
  counts: Partial<Record<HelpWayKey, number>>;
  onSelect: (key: HelpWayKey) => void;
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
              <span className="block truncate text-sm font-bold text-foreground">{way.label}</span>
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
