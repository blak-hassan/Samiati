"use client";

import { useChangaQuery as useQuery } from "@/hooks/useChangaData";
import { useNavigation } from "@/hooks/useNavigation";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Users, FileText, Mic, Plus } from "lucide-react";
import {
  WordOfTheDayCard,
  RecognitionBoard,
  GoalBreakdown,
  RegionVoicesGrid,
} from "@/components/changa/ChangaCommunityBits";
import { ChangaSectionHeading } from "@/components/changa/ChangaBits";
import { Screen } from "@/types";

interface Props {
  languageCode: string;
  languageName: string;
  goBack: () => void;
}

// ---------------------------------------------------------------------------
// Community page — mirrors `Changa prototype.md` section order:
//   community header → Contributions / People / Hours of speech → Word of the
//   day → Recognition → "<Language> goal: 100,000 sentences" → Where we need
//   more voices → Start a challenge.
//
// One scrolling page (the prototype has no tabs) so every section in the spec
// is reachable; each block is fed by its `changa/community.ts` query, with the
// demo dataset filling in when the Convex deployment is offline.
// ---------------------------------------------------------------------------

export default function ChangaCommunity({ languageCode, languageName, goBack }: Props) {
  const { navigate } = useNavigation();

  const summary = useQuery(api.changa.community.getCommunitySummary, {
    languageCode,
    name: languageName,
  });
  const word = useQuery(api.changa.community.getWordOfTheDay, { languageCode });
  const recognition = useQuery(api.changa.community.getRecognitionBoard, {});
  const goal = useQuery(api.changa.community.getLanguageGoal, { languageCode });
  const regions = useQuery(api.changa.community.getRegionsNeedingVoices, { languageCode });

  const sentencesDone = summary?.sentencesDone ?? 0;
  const sentencesTarget = summary?.sentencesTarget ?? 100_000;
  const percent =
    sentencesTarget > 0
      ? Math.min(100, Math.round((sentencesDone / sentencesTarget) * 100))
      : 0;

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={goBack} className="-ml-2 rounded-full">
            <ArrowLeft className="size-5" aria-hidden />
          </Button>
          <span className="sr-only">Back</span>
        </div>

        {/* Community goal header */}
        <header className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {languageName} community
          </p>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Building the future of technology
          </h1>
          <Progress value={percent} className="h-2.5" />
          <p className="text-sm font-medium text-muted-foreground">
            {sentencesDone.toLocaleString()} of {sentencesTarget.toLocaleString()} sentences
            <span className="font-bold text-foreground"> · {percent}%</span>
          </p>
        </header>

        {/* Contributions / People / Hours of speech */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="space-y-1 p-3 text-center shadow-sm">
            <FileText className="mx-auto size-4 text-primary" aria-hidden />
            <p className="text-lg font-black text-foreground">
              {(summary?.contributions ?? 0).toLocaleString()}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Contributions
            </p>
          </Card>
          <Card className="space-y-1 p-3 text-center shadow-sm">
            <Users className="mx-auto size-4 text-primary" aria-hidden />
            <p className="text-lg font-black text-foreground">
              {(summary?.people ?? 0).toLocaleString()}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">People</p>
          </Card>
          <Card className="space-y-1 p-3 text-center shadow-sm">
            <Mic className="mx-auto size-4 text-primary" aria-hidden />
            <p className="text-lg font-black text-foreground">{summary?.hoursOfSpeech ?? 0}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Hours of speech
            </p>
          </Card>
        </div>

        {/* Word of the day */}
        {word === undefined ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : (
          <WordOfTheDayCard word={word} />
        )}

        {/* Recognition */}
        <section className="space-y-3">
          <ChangaSectionHeading title="Recognition" />
          {recognition === undefined ? (
            <Skeleton className="h-28 w-full rounded-xl" />
          ) : (
            <RecognitionBoard entries={recognition} />
          )}
        </section>

        {/* <Language> goal: 100,000 sentences */}
        {goal ? (
          <GoalBreakdown
            languageName={languageName}
            totalCurrent={goal.totalCurrent}
            totalTarget={goal.targetSentences}
            categories={goal.categories}
          />
        ) : null}

        {/* Where we need more voices */}
        {regions === undefined ? (
          <Skeleton className="h-28 w-full rounded-xl" />
        ) : (
          <RegionVoicesGrid regions={regions} />
        )}

        {/* Start a challenge */}
        <section className="space-y-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5">
          <h2 className="text-lg font-black text-foreground">Start a challenge</h2>
          <p className="text-sm text-muted-foreground">
            Rally your community around something your language needs. A moderator checks it before
            it goes live.
          </p>
          <Button onClick={() => navigate(Screen.ADD_CHALLENGE)} className="w-full gap-2 font-bold">
            <Plus className="size-4" aria-hidden />
            Start a challenge
          </Button>
        </section>
      </div>
    </main>
  );
}