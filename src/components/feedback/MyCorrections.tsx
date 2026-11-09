"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock3, MessageSquareWarning, Sparkles, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Changa review status → human copy. Mirrors the vocabulary used on the
 * Changa activity screen so a contributor sees one language for their work
 * wherever it appears.
 */
const CORRECTION_STATUS_META: Record<
  string,
  { label: string; icon: typeof Clock3; className: string }
> = {
  submitted: {
    label: "Quality checks",
    icon: Clock3,
    className: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  },
  in_validation: {
    label: "Community review",
    icon: Clock3,
    className: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  },
  validated: {
    label: "Accepted",
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  },
  curated: {
    label: "Accepted",
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  },
  needs_fix: {
    label: "Needs a fix",
    icon: MessageSquareWarning,
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  },
  rejected: {
    label: "Not accepted",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive",
  },
  withdrawn: {
    label: "Withdrawn",
    icon: XCircle,
    className: "bg-muted text-muted-foreground",
  },
};

function relativeTime(timestamp: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * The corrections this user has reported, with the review status of each.
 *
 * A correction is a language contribution the user made. Showing its status
 * back to them — and giving them the reference code — is what turns a
 * one-off report into a contribution they can track.
 */
export const MyCorrections: React.FC = () => {
  const corrections = useQuery(api.feedback.listMyCorrections, { limit: 10 });

  if (!corrections || corrections.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
          Your Corrections
        </h3>
        <Badge variant="outline" className="font-bold">
          {corrections.length}
        </Badge>
      </div>
      <Card className="divide-y divide-border/60 overflow-hidden border-border/50 shadow-sm">
        {corrections.map((correction) => {
          const meta = correction.submissionStatus
            ? CORRECTION_STATUS_META[correction.submissionStatus]
            : null;
          const Icon = meta?.icon;
          return (
            <div key={correction.id} className="p-4 space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-bold text-foreground flex-1 min-w-0 break-words">
                  {correction.correction}
                </p>
                {meta && Icon && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold shrink-0",
                      meta.className,
                    )}
                  >
                    <Icon className="size-3" />
                    {meta.label}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-medium">
                {correction.reasonLabel && <span>{correction.reasonLabel}</span>}
                {correction.language && <span className="capitalize">{correction.language}</span>}
                <span>{relativeTime(correction.timestamp)}</span>
                {correction.code && (
                  <span className="font-mono text-[11px]">{correction.code}</span>
                )}
              </div>
              {!correction.submissionId && (
                <p className="text-[11px] text-muted-foreground/70">
                  Not sent for review yet — open the answer you reported to send it.
                </p>
              )}
            </div>
          );
        })}
      </Card>
      <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1.5">
        <Sparkles className="size-3" />
        Accepted corrections become part of the language data Samiati learns from.
      </p>
    </section>
  );
};

export default MyCorrections;
