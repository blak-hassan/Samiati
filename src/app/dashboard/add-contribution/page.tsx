"use client";

import { Suspense, use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useNavigation } from "@/hooks/useNavigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import TaskContributionScreen from "@/components/changa/TaskContributionScreen";
import { Screen } from "@/types";
import { isChangaQuickTaskType } from "@/lib/changa";
import type { Doc } from "../../../../convex/_generated/dataModel";

type TextTaskDoc = Doc<"changaTasks"> & {
    taskType: "lexicon_entry" | "phrase_translation" | "sentence_translation" | "audio_reading";
};

function isTextTask(task: Doc<"changaTasks">): task is TextTaskDoc {
    return isChangaQuickTaskType(task.taskType);
}

type AddContributionParams = { taskId?: string | string[]; language?: string | string[] };

function AddContributionContent({ searchParams }: { searchParams: Promise<AddContributionParams> }) {
    const { navigate, goBack } = useNavigation();
    const router = useRouter();
    const params = use(searchParams);
    const requestedTaskId = typeof params.taskId === "string" ? params.taskId : undefined;
    const requestedLanguage = typeof params.language === "string" ? params.language : undefined;
    const [dismissedTaskId, setDismissedTaskId] = useState<string | null>(null);

    // The task queue is filtered by the same language the contributor picked
    // on the Changa home screen. Without it the requested task could be
    // missing from the window and the page would silently open a different
    // language's task instead.
    const tasks = useQuery(api.changa.tasks.listAvailableTasks, {
        languageCode: requestedLanguage,
        limit: 50,
    });

    if (tasks === undefined) {
        return <div className="min-h-screen bg-amber-50 p-8 dark:bg-stone-950">Loading a Changa task…</div>;
    }

    const textTasks = tasks.filter(isTextTask);
    const activeTaskId = dismissedTaskId === requestedTaskId ? undefined : requestedTaskId;
    const task = activeTaskId
        ? textTasks.find((candidate) => candidate._id === activeTaskId)
        : textTasks[0];

    // The requested task is gone (expired, claimed, or the language filter
    // excluded it). Say so instead of quietly substituting a different task.
    if (activeTaskId && !task) {
        return (
            <main className="min-h-screen bg-amber-50 px-4 py-12 dark:bg-stone-950">
                <Card className="mx-auto max-w-lg space-y-4 p-8 text-center">
                    <h1 className="text-2xl font-bold">That task is no longer available</h1>
                    <p className="text-sm text-muted-foreground">
                        It may have been claimed by someone else or withdrawn. Pick another task to keep going.
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                        <Button
                            onClick={() => {
                                setDismissedTaskId(activeTaskId);
                                router.replace("/dashboard/add-contribution");
                            }}
                        >
                            Show me another task
                        </Button>
                        <Button variant="outline" onClick={goBack}>
                            Go back
                        </Button>
                    </div>
                </Card>
            </main>
        );
    }

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

export default function AddContributionPage({ searchParams }: { searchParams: Promise<AddContributionParams> }) {
    return (
        <Suspense fallback={<div className="min-h-screen bg-amber-50 p-8 dark:bg-stone-950">Loading a Changa task…</div>}>
            <AddContributionContent searchParams={searchParams} />
        </Suspense>
    );
}
