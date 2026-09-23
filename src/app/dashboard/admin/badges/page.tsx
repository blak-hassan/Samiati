"use client";

import { useChangaQuery as useQuery } from "@/hooks/useChangaData";
import { api } from "../../../../../convex/_generated/api";
import { useNavigation } from "@/hooks/useNavigation";
import { Card } from "@/components/ui/card";
import { Award } from "lucide-react";

type Badge = {
    id: string;
    title: string;
    description: string;
    icon: string;
    criterion: string;
};

export default function AdminBadgesPage() {
    const { goBack } = useNavigation();
    const badges = useQuery(api.changa.badges.listBadges, {}) as Badge[] | undefined;

    return (
        <main className="min-h-screen bg-amber-50 px-4 py-6 dark:bg-stone-950 sm:py-10">
            <div className="mx-auto max-w-2xl space-y-5">
                <header className="flex items-center gap-3">
                    <button
                        onClick={goBack}
                        className="rounded-full p-2 hover:bg-muted transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Award className="size-5 text-amber-700" />
                            Badge catalog
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Badges auto-award when a user crosses a contribution threshold.
                        </p>
                    </div>
                </header>
                {badges === undefined ? (
                    <Card className="p-6 text-sm text-muted-foreground">Loading…</Card>
                ) : (
                    <div className="space-y-3">
                        {badges.map((b: Badge) => (
                            <Card key={b.id} className="flex items-start gap-3 p-4">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                                    <span className="material-symbols-outlined">{b.icon}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold">{b.title}</p>
                                    <p className="text-xs text-muted-foreground">{b.description}</p>
                                    <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                                        {b.criterion}
                                    </p>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
