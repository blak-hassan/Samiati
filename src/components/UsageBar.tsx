"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface UsageBarProps {
    label: string;
    current: number;
    limit: number;
    unit?: string;
    warningThreshold?: number;
    className?: string;
}

export function UsageBar({
    label,
    current,
    limit,
    unit = "",
    warningThreshold = 80,
    className,
}: UsageBarProps) {
    const percent = Math.min(100, Math.round((current / limit) * 100));
    const isWarning = percent >= warningThreshold;
    const isExhausted = percent >= 100;

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{label}</span>
                <span className={cn(
                    "text-muted-foreground",
                    isWarning && !isExhausted && "text-amber-500",
                    isExhausted && "text-red-500"
                )}>
                    {current}{unit} / {limit}{unit}
                </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isExhausted
                            ? "bg-red-500"
                            : isWarning
                            ? "bg-amber-500"
                            : "bg-primary"
                    )}
                    style={{ width: `${percent}%` }}
                />
            </div>
            {isExhausted && (
                <p className="text-xs text-red-500">
                    Limit reached. Resets next billing period.
                </p>
            )}
        </div>
    );
}
