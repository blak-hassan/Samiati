"use client";

import {
  Award,
  CheckCircle2,
  ClipboardList,
  Clock,
  Languages,
  Send,
  Sparkles,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/data/provider";
import type {
  Contribution,
  ContributionTask,
  ContributionTaskType,
} from "@/lib/data/types";
import { getLanguageOrDefault } from "@/lib/languages";

const TASK_TYPES: { id: ContributionTaskType; label: string; blurb: string }[] = [
  { id: "translate", label: "Translate", blurb: "Write the source text in your language." },
  { id: "validate", label: "Validate", blurb: "Check that an existing translation reads naturally." },
  { id: "correct", label: "Correct", blurb: "Improve a translation that is close but not right." },
  { id: "compare", label: "Compare", blurb: "Choose between candidate words." },
  { id: "terminology", label: "Terminology", blurb: "Collect the term your community actually uses." },
];

const STATUS_LABEL: Record<ContributionTask["status"], string> = {
  open: "Open",
  in_progress: "In progress",
  submitted: "Submitted",
  validated: "Validated",
  rejected: "Rejected",
  accepted: "Accepted",
};

/**
 * Changa — Samiati's language contribution platform.
 *
 * Contributors translate, validate and correct text so that Samiati's
 * language models get better at the languages people actually speak. The tasks
 * shown here are seeded sample tasks; the submission and review flow is real.
 */
export function ChangaView() {
  const store = useStore();

  const [tasks, setTasks] = React.useState<ContributionTask[]>([]);
  const [contributions, setContributions] = React.useState<Contribution[]>([]);
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [languageFilter, setLanguageFilter] = React.useState<string>("all");
  const [activeTask, setActiveTask] = React.useState<ContributionTask | null>(null);
  const [draft, setDraft] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const [taskList, contributionList] = await Promise.all([
        store.listContributionTasks(),
        store.listContributions(),
      ]);
      setTasks(taskList);
      setContributions(contributionList);
    } finally {
      setLoading(false);
    }
  }, [store]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const visibleTasks = React.useMemo(
    () =>
      tasks.filter((task) => {
        if (typeFilter !== "all" && task.type !== typeFilter) return false;
        if (languageFilter !== "all" && task.languageId !== languageFilter) {
          return false;
        }
        return true;
      }),
    [languageFilter, tasks, typeFilter],
  );

  const taskLanguages = React.useMemo(() => {
    const ids = new Set<string>();
    for (const task of tasks) ids.add(task.languageId);
    return [...ids];
  }, [tasks]);

  const stats = React.useMemo(() => {
    const accepted = contributions.filter(
      (contribution) => contribution.status === "accepted",
    ).length;
    const points = contributions.reduce(
      (total, contribution) =>
        total + (contribution.qualityScore ? Math.round(contribution.qualityScore * 10) : 0),
      0,
    );
    return {
      open: tasks.filter((task) => task.status === "open").length,
      submitted: contributions.length,
      accepted,
      points,
    };
  }, [contributions, tasks]);

  const openTask = React.useCallback((task: ContributionTask) => {
    setActiveTask(task);
    setDraft(task.targetText ?? "");
  }, []);

  const submit = React.useCallback(async () => {
    if (!activeTask) return;
    if (!draft.trim()) {
      toast.error("Add your translation before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      await store.submitContribution({
        taskId: activeTask.id,
        submittedText: draft.trim(),
      });
      toast.success("Contribution submitted for review.");
      setActiveTask(null);
      setDraft("");
      await load();
    } catch {
      toast.error("Could not submit the contribution.");
    } finally {
      setSubmitting(false);
    }
  }, [activeTask, draft, load, store]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Changa
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Make Samiati better at your language
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">
            Every accepted translation makes the assistant more useful for
            everyone who speaks that language. Start with one task.
          </p>
        </header>

        <dl className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Open tasks", value: stats.open, icon: ClipboardList },
            { label: "Submitted", value: stats.submitted, icon: Send },
            { label: "Accepted", value: stats.accepted, icon: CheckCircle2 },
            { label: "Impact points", value: stats.points, icon: Award },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-xl border bg-card p-4">
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                  {stat.label}
                </dt>
                <dd className="mt-1 font-display text-2xl font-semibold">
                  {stat.value}
                </dd>
              </div>
            );
          })}
        </dl>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-xl font-semibold">Tasks</h2>
          <div className="flex flex-wrap gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger
                className="w-[10rem]"
                aria-label="Filter by task type"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {TASK_TYPES.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger
                className="w-[10.5rem]"
                aria-label="Filter by language"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All languages</SelectItem>
                {taskLanguages.map((id) => (
                  <SelectItem key={id} value={id}>
                    {getLanguageOrDefault(id).name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((key) => (
              <div
                key={key}
                className="h-28 animate-pulse rounded-xl border bg-muted/40"
              />
            ))}
          </div>
        ) : visibleTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="font-medium">No tasks match those filters</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different type or language.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {visibleTasks.map((task) => {
              const type = TASK_TYPES.find((entry) => entry.id === task.type);
              const language = getLanguageOrDefault(task.languageId);
              const mine = contributions.find(
                (contribution) => contribution.taskId === task.id,
              );
              return (
                <li key={task.id} className="rounded-xl border bg-card p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{type?.label ?? task.type}</Badge>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Languages className="h-3 w-3" aria-hidden />
                      {language.name}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" aria-hidden />
                      {task.difficulty}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      +{task.rewardPoints} points
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {STATUS_LABEL[task.status]}
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-medium">{task.sourceText}</p>
                  {task.context ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {task.context}
                    </p>
                  ) : null}

                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => openTask(task)}
                      disabled={Boolean(mine)}
                    >
                      {mine ? "Submitted" : "Open task"}
                    </Button>
                    {mine ? (
                      <span className="text-xs text-muted-foreground">
                        Status: {mine.status}
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {contributions.length > 0 ? (
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold">
              Your contributions
            </h2>
            <ul className="mt-3 space-y-2">
              {contributions.map((contribution) => {
                const task = tasks.find(
                  (entry) => entry.id === contribution.taskId,
                );
                return (
                  <li
                    key={contribution.id}
                    className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">
                      {task?.sourceText ?? contribution.taskId}
                    </span>
                    <Badge
                      variant={
                        contribution.status === "accepted"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {contribution.status}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>

      <Dialog
        open={Boolean(activeTask)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveTask(null);
            setDraft("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {activeTask ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {TASK_TYPES.find((entry) => entry.id === activeTask.type)?.label ??
                    "Task"}{" "}
                  · {getLanguageOrDefault(activeTask.languageId).name}
                </DialogTitle>
                <DialogDescription>
                  {TASK_TYPES.find((entry) => entry.id === activeTask.type)?.blurb}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Source text
                  </p>
                  <p className="mt-1 text-sm">{activeTask.sourceText}</p>
                  {activeTask.context ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {activeTask.context}
                    </p>
                  ) : null}
                </div>

                {activeTask.targetText ? (
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Existing translation
                    </p>
                    <p className="mt-1 text-sm">{activeTask.targetText}</p>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label
                    htmlFor="changa-answer"
                    className="text-sm font-medium"
                  >
                    {activeTask.type === "validate"
                      ? "Your assessment"
                      : activeTask.type === "correct"
                        ? "Your corrected version"
                        : "Your translation"}
                  </label>
                  <Textarea
                    id="changa-answer"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={5}
                    placeholder={
                      activeTask.type === "validate"
                        ? "Does this read naturally? Explain what you would change."
                        : "Write it the way you would actually say it."
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Write the way you would actually say it, not the way a
                    textbook would. Your submission is reviewed by speakers of
                    your language before it enters the dataset.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setActiveTask(null);
                    setDraft("");
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={() => void submit()} disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit contribution"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
