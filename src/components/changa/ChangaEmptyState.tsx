"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target, Users, Sparkles } from "lucide-react";
import { useNavigation } from "@/hooks/useNavigation";
import { Screen } from "@/types";

interface ChangaEmptyStateProps {
    onStartTask: (taskId: string) => void;
    recommendedTaskId?: string;
}

export function ChangaEmptyState({ onStartTask, recommendedTaskId }: ChangaEmptyStateProps) {
    const { navigate } = useNavigation();

    return (
        <Card className="space-y-5 p-6 sm:p-8 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <Target className="size-7" />
            </div>
            <div className="space-y-2">
                <h2 className="text-xl font-bold">Claim your first task</h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Every word you add helps train AI that understands your language.
                    It only takes about 15 seconds.
                </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {recommendedTaskId ? (
                    <Button size="lg" onClick={() => onStartTask(recommendedTaskId)}>
                        <Sparkles className="mr-2 size-4" />
                        Start your first task
                    </Button>
                ) : (
                    <Button size="lg" onClick={() => navigate(Screen.CHANGA)}>
                        <Sparkles className="mr-2 size-4" />
                        Find a task
                    </Button>
                )}
                <Button variant="outline" size="lg" onClick={() => navigate(Screen.CHANGA_CAMPAIGNS)}>
                    <Users className="mr-2 size-4" />
                    Browse campaigns
                </Button>
            </div>
        </Card>
    );
}
