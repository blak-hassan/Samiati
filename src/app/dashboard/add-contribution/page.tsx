"use client";

import { Suspense, use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useNavigation } from "@/hooks/useNavigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import TaskContributionScreen from "@/components/changa/TaskContributionScreen";
import { Screen } from "@/types";
import type { Doc } from "../../../../convex/_generated/dataModel";

const TEXT_TASK_TYPES = new Set([
    "lexicon_entry",
    "phrase_translation",
    "sentence_translation",
    "transcription",
    "audio_reading",
]);

type TextTaskDoc = Doc<"changaTasks"> & {
    taskType: "lexicon_entry" | "phrase_translation" | "sentence_translation" | "transcription" | "audio_reading";
};

function isTextTask(task: Doc<"changaTasks">): task is TextTaskDoc {
    return typeof task.taskType === "string" && TEXT_TASK_TYPES.has(task.taskType);
}

function AddContributionContent({ searchParams }: { searchParams: Promise<{ taskId?: string | string[] }> }) {
    const { navigate, goBack } = useNavigation();
    const params = use(searchParams);
    const requestedTaskId = typeof params.taskId === "string" ? params.taskId : undefined;
    const tasks = useQuery(api.changa.tasks.listAvailableTasks, { limit: 25 });

    if (tasks === undefined) {
        return <div className="min-h-screen bg-amber-50 p-8 dark:bg-stone-950">Loading a Changa task…</div>;
    }

    const textTasks = tasks.filter(isTextTask);
    const task = textTasks.find((candidate) => candidate._id === requestedTaskId) ?? textTasks[0];

    if (!task) {
        return (
            <main className="min-h-screen bg-amber-50 px-4 py-12 dark:bg-stone-950">
                <Card className="mx-auto max-w-lg space-y-4 p-8 text-center">
                    <h1 className="text-2xl font-bold">No text tasks are open right now</h1>
                    <p className="text-sm text-muted-foreground">New language tasks appear here as soon as a campaign needs them.</p>
                    <Button variant="outline" onClick={goBack}>Go back</Button>
                </Card>
            </main>
        );
    }

    return <TaskContributionScreen
        task={task}
        onComplete={() => navigate(Screen.CHANGA_ACTIVITY)}
    />;
}

export default function AddContributionPage({ searchParams }: { searchParams: Promise<{ taskId?: string | string[] }> }) {
    return (
        <Suspense fallback={<div className="min-h-screen bg-amber-50 p-8 dark:bg-stone-950">Loading a Changa task…</div>}>
            <AddContributionContent searchParams={searchParams} />
        </Suspense>
    );
}
