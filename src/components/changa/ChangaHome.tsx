"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigation } from "@/hooks/useNavigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/types";
import { logChangaEvent } from "@/lib/changaTelemetry";
import { ArrowRight, CheckCircle2, Clock3, Languages, Sparkles, Target } from "lucide-react";

const TASK_TYPE_LABELS: Record<string, string> = {
    lexicon_entry: "Add a word",
    phrase_translation: "Translate a phrase",
    sentence_translation: "Translate a sentence",
    transcription: "Write what you hear",
    audio_reading: "Record a phrase",
};

const TEXT_TASK_TYPES = new Set([
    "lexicon_entry",
    "phrase_translation",
    "sentence_translation",
    "transcription",
    "audio_reading",
]);

function taskLabel(taskType: string | undefined): string {
    return (taskType && TASK_TYPE_LABELS[taskType]) || "Quick task";
}

interface ChangaHomeProps {
    onViewActivity?: () => void;
}

export default function ChangaHome({ onViewActivity }: ChangaHomeProps) {
    const { navigate } = useNavigation();
    const tasks = useQuery(api.changa.tasks.listAvailableTasks, { limit: 25 });
    const userSubmissions = useQuery(api.changa.submissions.listUserSubmissions, { limit: 50 });

    const openTasks = (tasks || []).filter((task) => typeof task.taskType === "string" && TEXT_TASK_TYPES.has(task.taskType));
    const recommendedTask = openTasks[0];
    const otherTasks = openTasks.slice(1, 6);

    const acceptedCount = (userSubmissions || []).filter((sub) => sub.status === "validated").length;
    const inReviewCount = (userSubmissions || []).filter((sub) => sub.status === "in_validation" || sub.status === "submitted").length;

    const startTask = (taskId: string) => {
        navigate(Screen.ADD_CONTRIBUTION, { taskId });
    };

    // Log the recommended task as "offered" exactly once, after render.
    const offeredRef = useRef<string | null>(null);
    useEffect(() => {
        if (recommendedTask && offeredRef.current !== recommendedTask._id) {
            offeredRef.current = recommendedTask._id;
            logChangaEvent({
                name: "task_offered",
                taskType: recommendedTask.taskType,
                languageCode: recommendedTask.languageCode,
                taskId: recommendedTask._id,
            });
        }
    }, [recommendedTask]);

    return (
        <main className="min-h-screen bg-amber-50 px-4 py-6 dark:bg-stone-950 sm:py-10">
            <div className="mx-auto max-w-xl space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Changa</h1>
                        <p className="text-sm text-muted-foreground">Help your language in seconds.</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onViewActivity}>
                        My activity
                    </Button>
                </div>

                {/* Personal impact */}
                <Card className="flex items-center gap-4 p-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        <CheckCircle2 className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold">Your impact</p>
                        <p className="text-xs text-muted-foreground">
                            {acceptedCount > 0
                                ? `${acceptedCount} accepted contribution${acceptedCount === 1 ? "" : "s"} helping train Samiati.`
                                : inReviewCount > 0
                                    ? `${inReviewCount} contribution${inReviewCount === 1 ? "" : "s"} being checked by reviewers.`
                                    : "No contributions yet — start with the task below."}
                        </p>
                    </div>
                </Card>

                {/* Recommended task */}
                {recommendedTask ? (
                    <Card className="space-y-4 border-amber-300/60 p-5 shadow-sm dark:border-amber-800/60">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                            <Sparkles className="size-3.5" />
                            Recommended for you
                        </div>
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                                    <Languages className="size-3" />
                                    {recommendedTask.languageCode}
                                    {recommendedTask.dialectCode ? ` · ${recommendedTask.dialectCode}` : ""}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                                    <Clock3 className="size-3" />
                                    about 15 seconds
                                </span>
                            </div>
                            <h2 className="text-xl font-bold leading-snug">
                                {taskLabel(recommendedTask.taskType)}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {recommendedTask.promptSourceText || recommendedTask.promptTargetText || "A short task to help your language."}
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
                        <h2 className="text-lg font-semibold">No tasks are open right now</h2>
                        <p className="text-sm text-muted-foreground">
                            New language tasks appear here as soon as a campaign needs them.
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
                                        <p className="truncate text-sm font-medium">
                                            {taskLabel(task.taskType)}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {task.languageCode}
                                            {task.dialectCode ? ` · ${task.dialectCode}` : ""}
                                            {task.promptSourceText ? ` — ${task.promptSourceText}` : ""}
                                        </p>
                                    </div>
                                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                                </button>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}