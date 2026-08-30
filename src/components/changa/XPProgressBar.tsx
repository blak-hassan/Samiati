"use client";

import { Progress } from "@/components/ui/progress";

interface XPProgressBarProps {
    current: number;
    nextLevel: number;
    level: number;
    className?: string;
}

export function XPProgressBar({ current, nextLevel, level, className }: XPProgressBarProps) {
    const progress = nextLevel > 0 ? Math.min(100, Math.round((current / nextLevel) * 100)) : 0;

    return (
        <div className={cn("space-y-1", className)}>
            <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-muted-foreground">Level {level}</span>
                <span className="text-amber-700 dark:text-amber-300">
                    {current} / {nextLevel} XP
                </span>
            </div>
            <Progress value={progress} className="h-1.5" />
        </div>
    );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
    return classes.filter(Boolean).join(" ");
}
