"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Sparkles } from "lucide-react";

// ---------------------------------------------------------------------------
// Success state shown after a contribution is submitted.
// Prototype: "Nice! You just helped your language." + "+10 XP".
// ---------------------------------------------------------------------------

export function XpCelebration({
  xp,
  message = "Nice! You just helped your language.",
  onNext,
  onDone,
  nextLabel = "Do another task",
  doneLabel = "Back to Changa",
}: {
  xp: number;
  message?: string;
  onNext?: () => void;
  onDone?: () => void;
  nextLabel?: string;
  doneLabel?: string;
}) {
  return (
    <Card className="space-y-4 p-6 text-center shadow-sm">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
        <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-300" aria-hidden />
      </div>
      <h2 className="text-xl font-black text-foreground">{message}</h2>
      <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-black text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
        <Sparkles className="size-4" aria-hidden />
        +{xp} XP
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {onNext ? (
          <Button onClick={onNext} className="h-11 flex-1 rounded-xl font-bold">
            {nextLabel}
          </Button>
        ) : null}
        {onDone ? (
          <Button onClick={onDone} variant="outline" className="h-11 flex-1 rounded-xl font-bold">
            {doneLabel}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
