"use client";

import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import type { QualityReportRecord } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export interface QualityPanelProps {
  report: QualityReportRecord;
  className?: string;
  /** Compact mode shows only the summary line. */
  compact?: boolean;
}

const SEVERITY_STYLES = {
  block: "border-destructive/30 bg-destructive/10 text-destructive",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  info: "border-border bg-muted/50 text-muted-foreground",
} as const;

/**
 * Shows the result of the automated quality checks.
 *
 * The panel states clearly that these checks **never approve** a
 * contribution — they only flag it for a human. Saying so here is the point:
 * a contributor must never think a green tick means "accepted".
 */
export function QualityPanel({ report, className, compact }: QualityPanelProps) {
  const failures = report.checks.filter((check) => !check.passed);
  const passed = report.checks.length - failures.length;

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
          report.flagged
            ? SEVERITY_STYLES.warn
            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
          className,
        )}
      >
        {report.flagged ? (
          <AlertTriangle className="h-3 w-3" aria-hidden />
        ) : (
          <CheckCircle2 className="h-3 w-3" aria-hidden />
        )}
        {report.flagged
          ? `${failures.length} check${failures.length === 1 ? "" : "s"} flagged`
          : "No issues flagged"}
      </span>
    );
  }

  return (
    <div className={cn("rounded-lg border p-4", className)}>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
            report.flagged
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
          )}
        >
          {report.flagged ? (
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {report.flagged
              ? "A reviewer should look at this closely"
              : "Nothing suspicious found"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {passed} of {report.checks.length} automated checks passed. These
            checks only flag a contribution — a person always decides whether
            it is accepted.
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {report.checks.map((check) => (
          <li
            key={check.id}
            className={cn(
              "flex items-start gap-2 rounded-md border px-2.5 py-2 text-xs",
              check.passed
                ? "border-border/70 bg-muted/30 text-muted-foreground"
                : SEVERITY_STYLES[check.severity],
            )}
          >
            <span className="mt-0.5 shrink-0">
              {check.passed ? (
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              ) : check.severity === "info" ? (
                <Info className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-medium capitalize">
                {check.id.replace(/_/g, " ")}
              </span>
              <span className="block opacity-90">{check.message}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
