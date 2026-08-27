"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigation } from "@/hooks/useNavigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/types";
import { logChangaEvent } from "@/lib/changaTelemetry";
import {
    ArrowRight,
    CheckCircle2,
    Clock3,
    Languages,
    Share2,
    Sparkles,
    Target,
    Users,
    Flame,
    Trophy,
    MapPin,
} from "lucide-react";

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

const SHENG_DIALECTS = [
    { id: "nairobi_eastlands", label: "Nairobi Eastlands" },
    { id: "nairobi_westlands", label: "Nairobi Westlands" },
    { id: "coast", label: "Coast (Mombasa)" },
    { id: "kisumu", label: "Kisumu" },
    { id: "eldoret", label: "Eldoret" },
    { id: "general", label: "General Sheng" },
];

const LANGUAGE_OPTIONS = [
    { id: "sheng", label: "Sheng", emoji: "🔥" },
    { id: "sw", label: "Kiswahili", emoji: "🇰🇪" },
    { id: "en", label: "English", emoji: "🌍" },
];

function taskLabel(taskType: string | undefined): string {
    return (taskType && TASK_TYPE_LABELS[taskType]) || "Quick task";
}

interface ChangaHomeProps {
    onViewActivity?: () => void;
}

export default function ChangaHome({ onViewActivity }: ChangaHomeProps) {
    const { navigate } = useNavigation();
    const [selectedLanguage, setSelectedLanguage] = useState("sheng");
    const [selectedDialect, setSelectedDialect] = useState<string | null>(null);
    const [showDialectPicker, setShowDialectPicker] = useState(false);
    const [showInvite, setShowInvite] = useState(false);

    const tasks = useQuery(api.changa.tasks.listAvailableTasks, {
        languageCode: selectedLanguage,
        limit: 25,
    });
    const userSubmissions = useQuery(api.changa.submissions.listUserSubmissions, { limit: 50 });
    const campaigns = useQuery(api.changa.campaigns.listActiveCampaigns, {
        languageCode: selectedLanguage,
        limit: 5,
    });
    const userStats = useQuery(api.changa.stats.getUserContributionStats, {});
    const languageStats = useQuery(api.changa.stats.getLanguageProgressStats, {
        languageCode: selectedLanguage,
    });
    const inviteCode = useQuery(api.changa.invites.getMyInviteCode);
    const generateInviteCode = useMutation(api.changa.invites.generateInviteCode);

    const openTasks = (tasks || []).filter(
        (task) => typeof task.taskType === "string" && TEXT_TASK_TYPES.has(task.taskType),
    );
    const recommendedTask = openTasks[0];
    const otherTasks = openTasks.slice(1, 6);

    const acceptedCount = userStats?.contributionCount
        ? (userSubmissions || []).filter(
              (sub) => sub.status === "validated" || sub.status === "curated",
          ).length
        : 0;
    const inReviewCount = (userSubmissions || []).filter(
        (sub) => sub.status === "in_validation" || sub.status === "submitted",
    ).length;

    const startTask = (taskId: string) => {
        navigate(Screen.ADD_CONTRIBUTION, { taskId });
    };

    const handleShare = async () => {
        // Generate or reuse an invite code
        let code = inviteCode;
        if (!code) {
            code = await generateInviteCode({ channel: "share" });
        }
        const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/changa?ref=${code}`;
        const shareData = {
            title: "Join me on Changa",
            text: "I'm helping build AI that understands Sheng. Join me on Samiati!",
            url: shareUrl,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(
                    `${shareData.text} ${shareData.url}`,
                );
                setShowInvite(true);
                setTimeout(() => setShowInvite(false), 2000);
            }
        } catch {
            // User cancelled share
        }
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
                        <p className="text-sm text-muted-foreground">
                            Help your language in seconds.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleShare}
                            className="gap-1.5"
                        >
                            <Share2 className="size-4" />
                            Invite
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onViewActivity}>
                            My activity
                        </Button>
                    </div>
                </div>

                {/* Invite success toast */}
                {showInvite && (
                    <div className="rounded-lg bg-emerald-100 p-3 text-sm text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                        Link copied! Share it with friends to collect Sheng together.
                    </div>
                )}

                {/* Language selector */}
                <div className="flex gap-2">
                    {LANGUAGE_OPTIONS.map((lang) => (
                        <button
                            key={lang.id}
                            onClick={() => {
                                setSelectedLanguage(lang.id);
                                setSelectedDialect(null);
                            }}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                                selectedLanguage === lang.id
                                    ? "bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100"
                                    : "bg-muted text-muted-foreground hover:bg-accent"
                            }`}
                        >
                            <span>{lang.emoji}</span>
                            {lang.label}
                        </button>
                    ))}
                </div>

                {/* Sheng dialect picker */}
                {selectedLanguage === "sheng" && (
                    <div className="space-y-2">
                        <button
                            onClick={() => setShowDialectPicker(!showDialectPicker)}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <MapPin className="size-3.5" />
                            {selectedDialect
                                ? SHENG_DIALECTS.find((d) => d.id === selectedDialect)?.label
                                : "All Sheng dialects"}
                            <span className="text-xs">▼</span>
                        </button>
                        {showDialectPicker && (
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedDialect(null);
                                        setShowDialectPicker(false);
                                    }}
                                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                        selectedDialect === null
                                            ? "bg-amber-200 text-amber-900"
                                            : "bg-muted text-muted-foreground hover:bg-accent"
                                    }`}
                                >
                                    All dialects
                                </button>
                                {SHENG_DIALECTS.map((dialect) => (
                                    <button
                                        key={dialect.id}
                                        onClick={() => {
                                            setSelectedDialect(dialect.id);
                                            setShowDialectPicker(false);
                                        }}
                                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                            selectedDialect === dialect.id
                                                ? "bg-amber-200 text-amber-900"
                                                : "bg-muted text-muted-foreground hover:bg-accent"
                                        }`}
                                    >
                                        {dialect.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Language health stats */}
                {languageStats && (
                    <Card className="grid grid-cols-4 divide-x divide-border p-3 text-center">
                        <div>
                            <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                                {languageStats.openTasks}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Open tasks</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-violet-700 dark:text-violet-300">
                                {languageStats.submissions}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Submitted</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                                {languageStats.curatedExamples}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Curated</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-sky-700 dark:text-sky-300">
                                {languageStats.activeCampaigns}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Campaigns</p>
                        </div>
                    </Card>
                )}

                {/* Personal impact */}
                <Card className="flex items-center gap-4 p-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        <CheckCircle2 className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">Your impact</p>
                        <p className="text-xs text-muted-foreground">
                            {acceptedCount > 0
                                ? `${acceptedCount} accepted contribution${acceptedCount === 1 ? "" : "s"} helping train Samiati.`
                                : inReviewCount > 0
                                  ? `${inReviewCount} contribution${inReviewCount === 1 ? "" : "s"} being checked by reviewers.`
                                  : "No contributions yet — start with the task below."}
                        </p>
                    </div>
                    {userStats && userStats.trustScore > 0 && (
                        <div className="text-right">
                            <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                                {userStats.trustScore}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Trust</p>
                        </div>
                    )}
                </Card>

                {/* Active campaigns */}
                {campaigns && campaigns.length > 0 && (
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                                <Trophy className="size-3.5" />
                                Active campaigns
                            </h3>
                            <button
                                onClick={() => navigate(Screen.CHANGA_CAMPAIGNS)}
                                className="text-xs text-amber-700 dark:text-amber-300 hover:underline"
                            >
                                View all
                            </button>
                        </div>
                        <div className="space-y-2">
                            {campaigns.map((campaign) => {
                                const progress = campaign.goalCount > 0
                                    ? Math.min(100, Math.round((campaign.currentCount / campaign.goalCount) * 100))
                                    : 0;
                                return (
                                    <Card key={campaign._id} className="p-4 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold truncate">
                                                    {campaign.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {campaign.description}
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-xs font-bold text-amber-700 dark:text-amber-300">
                                                {progress}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-1.5">
                                            <div
                                                className="bg-amber-500 h-1.5 rounded-full transition-all"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">
                                            {campaign.currentCount} / {campaign.goalCount} contributions
                                        </p>
                                    </Card>
                                );
                            })}
                        </div>
                    </section>
                )}

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
                                    {recommendedTask.dialectCode
                                        ? ` · ${recommendedTask.dialectCode}`
                                        : ""}
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
                                {recommendedTask.promptSourceText ||
                                    recommendedTask.promptTargetText ||
                                    "A short task to help your language."}
                            </p>
                        </div>
                        <Button
                            className="w-full"
                            size="lg"
                            onClick={() => startTask(recommendedTask._id)}
                        >
                            Start task
                            <ArrowRight className="ml-2 size-4" />
                        </Button>
                    </Card>
                ) : (
                    <Card className="space-y-3 p-6 text-center">
                        <Target className="mx-auto size-8 text-muted-foreground" />
                        <h2 className="text-lg font-semibold">
                            {tasks === undefined
                                ? "Loading tasks..."
                                : "No tasks are open right now"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {tasks === undefined
                                ? "Finding the best tasks for you."
                                : `No ${selectedLanguage} tasks available. Check back soon or try another language.`}
                        </p>
                    </Card>
                )}

                {/* Task switcher */}
                {otherTasks.length > 0 && (
                    <section className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground">
                            More tasks
                        </h3>
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
                                            {task.dialectCode
                                                ? ` · ${task.dialectCode}`
                                                : ""}
                                            {task.promptSourceText
                                                ? ` — ${task.promptSourceText}`
                                                : ""}
                                        </p>
                                    </div>
                                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* Invite section */}
                <Card className="space-y-3 p-4 text-center border-dashed">
                    <Users className="mx-auto size-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        collecting Sheng data is better with friends
                    </p>
                    <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
                        <Share2 className="size-3.5" />
                        Invite a friend
                    </Button>
                </Card>
            </div>
        </main>
    );
}
