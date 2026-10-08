"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BookOpen, MapPin, Droplets } from "lucide-react";
import { RecognitionTile } from "@/components/changa/ChangaBits";

// ---------------------------------------------------------------------------
// Community-page blocks (prototype revamp):
//   • Word of the day
//   • Recognition board
//   • "<Language> goal: 100,000 sentences" breakdown
//   • Where we need more voices (regions)
// ---------------------------------------------------------------------------

export type WordOfTheDay = {
  word: string;
  meaning: string;
  partOfSpeech?: string | null;
  example?: string | null;
} | null;

export function WordOfTheDayCard({ word }: { word: WordOfTheDay }) {
  if (!word) return null;
  return (
    <Card className="space-y-2 p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
        <BookOpen className="size-4 text-primary" aria-hidden />
        Word of the day
      </div>
      <p className="text-2xl font-black text-foreground">{word.word}</p>
      <p className="text-sm font-medium text-muted-foreground">{word.meaning}</p>
      {word.partOfSpeech ? (
        <Badge variant="outline" className="text-[10px] font-bold uppercase">
          {word.partOfSpeech}
        </Badge>
      ) : null}
      {word.example ? (
        <p className="border-l-2 border-primary/40 pl-3 text-sm italic text-foreground/80">
          {word.example}
        </p>
      ) : null}
    </Card>
  );
}

export type RecognitionEntry = {
  key: string;
  label: string;
  name: string;
  metric: string;
  value: number;
};

export function RecognitionBoard({ entries }: { entries: RecognitionEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3">
      {entries.map((entry) => (
        <RecognitionTile
          key={entry.key}
          label={entry.label}
          name={entry.name}
          metric={entry.metric}
          value={entry.value}
        />
      ))}
    </div>
  );
}

export type GoalCategory = {
  key: string;
  label: string;
  current: number;
  target: number;
};

export function GoalBreakdown({
  languageName,
  totalCurrent,
  totalTarget,
  categories,
}: {
  languageName: string;
  totalCurrent: number;
  totalTarget: number;
  categories: GoalCategory[];
}) {
  return (
    <Card className="space-y-4 p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-base font-black text-foreground">
          {languageName} goal: {totalTarget.toLocaleString()} sentences
        </h3>
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">so far</span>
      </div>
      <div className="space-y-3">
        {categories.map((category) => {
          const percent =
            category.target > 0 ? Math.min(100, (category.current / category.target) * 100) : 0;
          return (
            <div key={category.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-foreground">{category.label}</span>
                <span className="font-medium text-muted-foreground">
                  {category.current.toLocaleString()} of {category.target.toLocaleString()}
                </span>
              </div>
              <Progress value={percent} className="h-2" />
            </div>
          );
        })}
      </div>
      <p className="border-t border-border/50 pt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {totalCurrent.toLocaleString()} of {totalTarget.toLocaleString()} sentences
      </p>
    </Card>
  );
}

export type RegionVoice = {
  region: string;
  contributions: number;
  target: number;
  remaining: number;
};

export function RegionVoicesGrid({ regions }: { regions: RegionVoice[] }) {
  if (regions.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground">
        <Droplets className="size-4 text-primary" aria-hidden />
        Where we need more voices
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        {regions.map((region) => {
          const percent =
            region.target > 0 ? Math.min(100, (region.contributions / region.target) * 100) : 0;
          return (
            <Card key={region.region} className="space-y-2 p-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" aria-hidden />
                <span className="truncate text-sm font-bold text-foreground">{region.region}</span>
              </div>
              <Progress value={percent} className={cn("h-1.5")} />
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {region.remaining.toLocaleString()} more
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
