"use client";

import { CheckCircle2, MessageSquareWarning, XCircle } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { QualityPanel } from "@/components/changa/quality-panel";
import { StandingCard } from "@/components/changa/standing-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/data/provider";
import type { Contribution, QualityReportRecord, Review } from "@/lib/data/types";
import { getLanguageOrDefault } from "@/lib/languages";
import type { ContributorStanding } from "@/lib/changa/recognition";

/**
 * The review queue.
 *
 * Only contributions that a person has actually looked at can be accepted.
 * The automated checks are shown beside each submission so a reviewer can see
 * what the machine already suspects, but the decision is always theirs.
 */
export function ReviewQueueView() {
  const store = useStore();

  const [queue, setQueue] = React.useState<Contribution[]>([]);
  const [reports, setReports] = React.useState<QualityReportRecord[]>([]);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [tasks, setTasks] = React.useState<
    Awaited<ReturnType<typeof store.listContributionTasks>>
  >([]);
  const [standing, setStanding] = React.useState<ContributorStanding | null>(null);
  const [canAcceptAlone, setCanAcceptAlone] = React.useState(true);
  const [feedback, setFeedback] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const [queueItems, qualityReports, reviewList, taskList, currentStanding, acceptAlone] =
        await Promise.all([
          store.listReviewQueue(),
          store.listQualityReports(),
          store.listReviews(),
          store.listContributionTasks(),
          store.getContributorStanding(),
          store.canAcceptAlone(),
        ]);
      setQueue(queueItems);
      setReports(qualityReports);
      setReviews(reviewList);
      setTasks(taskList);
      setStanding(currentStanding);
      setCanAcceptAlone(acceptAlone);
    } finally {
      setLoading(false);
    }
  }, [store]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const reportFor = (contributionId: string) =>
    reports.find((report) => report.contributionId === contributionId);

  /**
   * Approvals that are waiting for an established reviewer to agree.
   *
   * A reviewer below the reviewer tier can approve, but the approval is
   * provisional: the contribution stays in the queue until somebody
   * established agrees with it.
   */
  const provisionalApprovals = (contributionId: string) =>
    reviews.filter(
      (review) =>
        review.contributionId === contributionId &&
        review.decision === "approve" &&
        review.decisive === false,
    ).length;

  const decide = React.useCallback(
    async (
      contribution: Contribution,
      decision: "approve" | "reject" | "needs_revision",
    ) => {
      setBusyId(contribution.id);
      try {
        await store.createReview({
          contributionId: contribution.id,
          decision,
          feedback: feedback[contribution.id]?.trim() || undefined,
        });
        if (decision === "approve" && !canAcceptAlone) {
          toast.success(
            "Approval recorded. An established reviewer still has to agree before the contribution is accepted.",
          );
        } else {
          toast.success(
            decision === "approve"
              ? "Contribution accepted."
              : decision === "reject"
                ? "Contribution rejected."
                : "Sent back for revision.",
          );
        }
        setFeedback((current) => ({ ...current, [contribution.id]: "" }));
        await load();
      } catch {
        toast.error("Could not record the review.");
      } finally {
        setBusyId(null);
      }
    },
    [canAcceptAlone, feedback, load, store],
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading the review queue…
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Changa
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Review queue
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">
            These contributions are waiting for a person. The automated checks
            below only flag what looks suspicious — they never accept
            anything.
          </p>
        </header>

        {standing ? (
          <div className="mb-6">
            <StandingCard standing={standing} />
          </div>
        ) : null}

        {standing && !canAcceptAlone ? (
          <p className="mb-6 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
            You can review, but your decisions are checked against an
            established reviewer. Keep going — agreement with other reviewers
            is what earns you the ability to approve alone.
          </p>
        ) : null}

        {queue.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="font-medium">Nothing to review</p>
            <p className="mt-1 text-sm text-muted-foreground">
              When contributors submit translations, they will appear here.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {queue.map((contribution) => {
              const task = tasks.find((entry) => entry.id === contribution.taskId);
              const report = reportFor(contribution.id);
              const language = getLanguageOrDefault(contribution.languageId);
              const busy = busyId === contribution.id;
              const pending = provisionalApprovals(contribution.id);

              return (
                <li key={contribution.id} className="rounded-xl border bg-card p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {language.name}
                    </span>
                    {task ? <span>· {task.type}</span> : null}
                    {report ? (
                      <span className="ml-auto">
                        <QualityPanel report={report} compact />
                      </span>
                    ) : null}
                  </div>

                  {task ? (
                    <div className="mt-3 rounded-lg border bg-muted/40 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Source text
                      </p>
                      <p className="mt-1 text-sm">{task.sourceText}</p>
                      {task.context ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {task.context}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Submitted translation
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {contribution.submittedText}
                    </p>
                  </div>

                  {report ? (
                    <QualityPanel report={report} className="mt-3" />
                  ) : null}

                  {pending > 0 ? (
                    <p className="mt-3 rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                      {pending} provisional approval{pending === 1 ? "" : "s"} —
                      waiting for an established reviewer to confirm before the
                      contribution is accepted.
                    </p>
                  ) : null}

                  <Textarea
                    value={feedback[contribution.id] ?? ""}
                    onChange={(event) =>
                      setFeedback((current) => ({
                        ...current,
                        [contribution.id]: event.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="Optional feedback for the contributor"
                    aria-label="Reviewer feedback"
                    className="mt-3"
                  />

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => void decide(contribution, "approve")}
                      disabled={busy}
                      className="gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void decide(contribution, "needs_revision")
                      }
                      disabled={busy}
                      className="gap-1.5"
                    >
                      <MessageSquareWarning
                        className="h-3.5 w-3.5"
                        aria-hidden
                      />
                      Needs revision
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void decide(contribution, "reject")}
                      disabled={busy}
                      className="gap-1.5 text-destructive hover:text-destructive"
                    >
                      <XCircle className="h-3.5 w-3.5" aria-hidden />
                      Reject
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
