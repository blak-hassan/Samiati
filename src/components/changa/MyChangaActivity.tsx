"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen, type NavigateFn } from "@/types";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Clock3,
    Flame,
    Loader2,
    MessageSquareWarning,
    PencilLine,
    Star,
    Trophy,
    XCircle,
} from "lucide-react";

const TASK_TYPE_LABELS: Record<string, string> = {
    lexicon_entry: "Word",
    phrase_translation: "Phrase",
    sentence_translation: "Sentence",
    transcription: "Transcription",
    audio_reading: "Recording",
    validation: "Validation",
    cultural_context: "Cultural context",
    dialect_mapping: "Dialect mapping",
};

const STATUS_META: Record<
    string,
    { label: string; icon: typeof Clock3; className: string }
> = {
    draft: {
        label: "Draft saved",
        icon: PencilLine,
        className:
            "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    },
    submitted: {
        label: "Quality checks",
        icon: Loader2,
        className:
            "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
    },
    in_validation: {
        label: "Community review",
        icon: Clock3,
        className:
            "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
    },
    validated: {
        label: "Accepted",
        icon: CheckCircle2,
        className:
            "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    },
    curated: {
        label: "Accepted",
        icon: CheckCircle2,
        className:
            "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    },
    needs_fix: {
        label: "Needs a fix",
        icon: MessageSquareWarning,
        className:
            "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
    },
    rejected: {
        label: "Not accepted",
        icon: XCircle,
        className: "bg-destructive/10 text-destructive",
    },
    withdrawn: {
        label: "Withdrawn",
        icon: XCircle,
        className: "bg-muted text-muted-foreground",
    },
};

function relativeTime(timestamp: number): string {
    const seconds = Math.max(
        0,
        Math.floor((Date.now() - timestamp) / 1000),
    );
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
}

interface MyChangaActivityProps {
    navigate: NavigateFn;
    goBack: () => void;
}

export default function MyChangaActivity({
    navigate,
    goBack,
}: MyChangaActivityProps) {
    const submissions = useQuery(api.changa.submissions.listUserSubmissions, {
        limit: 100,
    });
    const userStats = useQuery(api.changa.stats.getUserContributionStats, {});

    const acceptedCount = (submissions ?? []).filter(
        (sub) =>
            sub.status === "validated" || sub.status === "curated",
    ).length;
    const inReviewCount = (submissions ?? []).filter(
        (sub) =>
            sub.status === "in_validation" || sub.status === "submitted",
    ).length;
    const draftCount = (submissions ?? []).filter(
        (sub) => sub.status === "draft",
    ).length;

    return (
        <main className="min-h-screen bg-amber-50 px-4 py-6 dark:bg-stone-950 sm:py-10">
            <div className="mx-auto max-w-xl space-y-5">
                <div className="flex items-center justify-between">
                    <button
                        onClick={goBack}
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="size-4" />
                        Back
                    </button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(Screen.CHANGA)}
                    >
                        Start a task
                        <ArrowRight className="ml-2 size-4" />
                    </Button>
                </div>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        My Changa activity
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Every contribution, and where it is in the pipeline.
                    </p>
                </div>

                {/* Stats overview */}
                {userStats && (
                    <Card className="grid grid-cols-2 divide-x divide-border p-4 text-center sm:grid-cols-4">
                        <div className="space-y-1">
                            <div className="flex items-center justify-center gap-1">
                                <Flame className="size-4 text-amber-600" />
                                <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                                    {userStats.streakDays}
                                </p>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Day streak
                            </p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-center gap-1">
                                <Star className="size-4 text-violet-600" />
                                <p className="text-lg font-bold text-violet-700 dark:text-violet-300">
                                    {userStats.trustScore}
                                </p>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Trust score
                            </p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-center gap-1">
                                <Trophy className="size-4 text-emerald-600" />
                                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                                    {userStats.contributionCount}
                                </p>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Contributions
                            </p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-center gap-1">
                                <CheckCircle2 className="size-4 text-sky-600" />
                                <p className="text-lg font-bold text-sky-700 dark:text-sky-300">
                                    {Math.round(userStats.acceptRate * 100)}%
                                </p>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Accept rate
                            </p>
                        </div>
                    </Card>
                )}

                {/* Badges */}
                {userStats && userStats.badges.length > 0 && (
                    <Card className="p-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                            Badges earned
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {userStats.badges.map((badge) => (
                                <span
                                    key={badge}
                                    className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                                >
                                    <Trophy className="size-3" />
                                    {badge}
                                </span>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Top languages */}
                {userStats && userStats.topLanguages.length > 0 && (
                    <Card className="p-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                            Your top languages
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {userStats.topLanguages.map((lang) => (
                                <span
                                    key={lang}
                                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium"
                                >
                                    {lang}
                                </span>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Submission counts */}
                {(acceptedCount > 0 || inReviewCount > 0 || draftCount > 0) && (
                    <Card className="grid grid-cols-3 divide-x divide-border p-4 text-center">
                        <div>
                            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                                {acceptedCount}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Accepted
                            </p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-violet-700 dark:text-violet-300">
                                {inReviewCount}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                In review
                            </p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                                {draftCount}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Drafts
                            </p>
                        </div>
                    </Card>
                )}

                {/* Submissions list */}
                {submissions === undefined ? (
                    <Card className="p-8 text-center text-sm text-muted-foreground">
                        <Loader2 className="mx-auto mb-3 size-6 animate-spin" />
                        Loading your activity…
                    </Card>
                ) : submissions.length === 0 ? (
                    <Card className="space-y-3 p-8 text-center">
                        <PencilLine className="mx-auto size-8 text-muted-foreground" />
                        <h2 className="text-lg font-semibold">
                            No contributions yet
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Quick tasks take about 15 seconds each. Every
                            accepted one helps your language.
                        </p>
                        <Button
                            className="mt-2"
                            onClick={() => navigate(Screen.CHANGA)}
                        >
                            Start your first task
                        </Button>
                    </Card>
                ) : (
                    <ul className="space-y-3">
                        {submissions.map((submission) => {
                            const meta =
                                STATUS_META[submission.status] ??
                                STATUS_META.submitted;
                            const StatusIcon = meta.icon;
                            return (
                                <li key={submission._id}>
                                    <Card className="space-y-2 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-sm font-semibold">
                                                {TASK_TYPE_LABELS[
                                                    submission.submissionType
                                                ] ?? "Changa task"}
                                            </p>
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}
                                            >
                                                <StatusIcon
                                                    className={`size-3.5 ${
                                                        submission.status ===
                                                        "submitted"
                                                            ? "animate-spin"
                                                            : ""
                                                    }`}
                                                />
                                                {meta.label}
                                            </span>
                                        </div>
                                        {(submission.sourceText ||
                                            submission.targetText ||
                                            submission.transcriptText) && (
                                            <p className="line-clamp-2 text-sm text-muted-foreground">
                                                {submission.targetText ||
                                                    submission.transcriptText ||
                                                    submission.sourceText}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            {submission.languageCode}
                                            {submission.dialectCode
                                                ? ` · ${submission.dialectCode}`
                                                : ""}
                                            {" · "}
                                            {relativeTime(
                                                submission.updatedAt,
                                            )}
                                        </p>
                                    </Card>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </main>
    );
}
