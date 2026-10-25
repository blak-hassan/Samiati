"use client";

import React, { useState } from "react";
import { type TranslationKey } from "@/i18n/TranslationProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mic, PenLine, ShieldCheck, Globe, ArrowRight } from "lucide-react";
import { type HelpWayKey, WAY_LABEL_KEYS } from "@/components/changa/ChangaBits";

export interface ContributionBlockProps {
    t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
    onQuickContribute: () => void;
    onSelectWay: (key: HelpWayKey) => void;
    wayCounts: Partial<Record<HelpWayKey, number>>;
}

const WAY_TILES: Array<{ key: HelpWayKey; icon: typeof Mic; tone: string }> = [
    { key: "speak", icon: Mic, tone: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200" },
    { key: "write", icon: PenLine, tone: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200" },
    { key: "check", icon: ShieldCheck, tone: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200" },
    { key: "community", icon: Globe, tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200" },
];

function wayStatus(count: number | undefined): string {
    const c = count ?? 0;
    return c > 0 ? `${c} open` : "Ready";
}

export function ContributionBlock({
    t,
    onQuickContribute,
    onSelectWay,
    wayCounts,
}: ContributionBlockProps) {
    const [mode, setMode] = useState<"choose" | "manual">("choose");

    return (
        <Card className="gap-0 overflow-hidden p-0 shadow-sm">
            {/* Header: Quick contribute + time estimate */}
            <div className="space-y-1 p-4">
                <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                    {t("quickContribute")}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                    {t("aboutTime")}
                </p>
            </div>

            {/* Selection mode toggle: Let us choose / All ways to help */}
            <div className="flex items-center gap-1 border-b border-border/50">
                <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "choose"}
                    onClick={() => setMode("choose")}
                    className={cn(
                        "flex-1 py-2.5 text-sm font-medium transition-colors border-b-2",
                        mode === "choose"
                            ? "border-primary text-primary dark:border-primary dark:text-primary"
                            : "border-transparent text-muted-foreground hover:text-muted-foreground",
                    )}
                >
                    {t("letUsChoose")}
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "manual"}
                    onClick={() => setMode("manual")}
                    className={cn(
                        "flex-1 py-2.5 text-sm font-medium transition-colors border-b-2",
                        mode === "manual"
                            ? "border-primary text-primary dark:border-primary dark:text-primary"
                            : "border-transparent text-muted-foreground hover:text-muted-foreground",
                    )}
                >
                    {t("allWaysToHelp")}
                </button>
            </div>

            {mode === "choose" ? (
                <div className="space-y-2.5 border-t border-border/50 p-4">
                    <Button
                        className="w-full gap-1.5 font-bold"
                        size="lg"
                        onClick={onQuickContribute}
                    >
                        {t("letUsChoose")}
                        <ArrowRight className="size-4" aria-hidden />
                    </Button>
                </div>
            ) : (
                <div className="space-y-2.5 border-t border-border/50 p-4">
                    <div className="grid grid-cols-2 gap-2">
                        {WAY_TILES.map((way) => {
                            const Icon = way.icon;
                            const count = wayCounts[way.key] ?? 0;
                            return (
                                <button
                                    key={way.key}
                                    type="button"
                                    onClick={() => onSelectWay(way.key)}
                                    className="flex items-center gap-2.5 rounded-xl bg-muted/50 p-2.5 text-left transition-colors hover:bg-accent"
                                >
                                    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", way.tone)}>
                                        <Icon className="size-4" aria-hidden />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-bold text-foreground">
                                            {t(WAY_LABEL_KEYS[way.key] as TranslationKey)}
                                        </span>
                                        <span className="block text-xs font-medium text-muted-foreground">
                                            {wayStatus(count)}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </Card>
    );
}
