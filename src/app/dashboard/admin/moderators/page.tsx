"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useNavigation } from "@/hooks/useNavigation";
import { Screen } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Shield, Loader2, Users } from "lucide-react";
import { logChangaEvent } from "@/lib/changaTelemetry";
import type { Id } from "../../../../../convex/_generated/dataModel";

type PendingApplication = {
    id: Id<"users">;
    name: string;
    avatar: string;
    handle?: string;
    appliedAt: number;
    requestedLanguages: string[];
    motivation: string;
    trustScore: number;
    contributionCount: number;
    validationCount: number;
};

export default function AdminModeratorsPage() {
    const { goBack } = useNavigation();
    const applications = useQuery(
        api.moderation.listPendingModeratorApplications,
        {}
    );
    const approve = useMutation(api.moderation.approveModeratorApplication);
    const [approving, setApproving] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleApprove = async (userId: Id<"users">) => {
        setApproving(String(userId));
        setError(null);
        try {
            await approve({ userId });
            logChangaEvent({ name: "moderator_approved" });
        } catch (e) {
            setError(e instanceof Error ? e.message : "Approval failed");
        } finally {
            setApproving(null);
        }
    };

    return (
        <main className="min-h-screen bg-amber-50 px-4 py-6 dark:bg-stone-950 sm:py-10">
            <div className="mx-auto max-w-3xl space-y-5">
                <header className="flex items-center gap-3">
                    <button
                        onClick={goBack}
                        className="rounded-full p-2 hover:bg-muted transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Shield className="size-5 text-amber-700" />
                            Moderator Approvals
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Review and approve pending moderator applications.
                        </p>
                    </div>
                </header>

                {error && (
                    <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
                        {error}
                    </div>
                )}

                {applications === undefined ? (
                    <Card className="p-6 text-center text-sm text-muted-foreground">
                        <Loader2 className="mx-auto size-5 animate-spin" />
                        Loading applications…
                    </Card>
                ) : applications.length === 0 ? (
                    <Card className="p-6 text-center text-sm text-muted-foreground">
                        <CheckCircle2 className="mx-auto size-6 text-emerald-600" />
                        <p className="mt-2">No pending applications. You're all caught up!</p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {applications.map((app: PendingApplication) => (
                            <Card key={app.id} className="space-y-3 p-4">
                                <div className="flex items-start gap-3">
                                    <img
                                        src={app.avatar}
                                        alt={app.name}
                                        className="size-12 rounded-full border border-border"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold">{app.name}</p>
                                        {app.handle && (
                                            <p className="text-xs text-muted-foreground">@{app.handle}</p>
                                        )}
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Applied {new Date(app.appliedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right text-xs text-muted-foreground">
                                        <p>Trust: {app.trustScore.toFixed(2)}</p>
                                        <p>{app.contributionCount} contributions</p>
                                        <p>{app.validationCount} validations</p>
                                    </div>
                                </div>

                                {app.requestedLanguages.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            Languages requested
                                        </p>
                                        <div className="mt-1 flex flex-wrap gap-1.5">
                                            {app.requestedLanguages.map((lang) => (
                                                <span
                                                    key={lang}
                                                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"
                                                >
                                                    <Users className="size-3" />
                                                    {lang}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {app.motivation && (
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            Motivation
                                        </p>
                                        <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">
                                            {app.motivation}
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2">
                                    <Button
                                        size="sm"
                                        disabled={approving === String(app.id)}
                                        onClick={() => handleApprove(app.id)}
                                        className="gap-1.5"
                                    >
                                        {approving === String(app.id) ? (
                                            <Loader2 className="size-3.5 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="size-3.5" />
                                        )}
                                        Approve & grant roles
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
