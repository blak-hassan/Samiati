"use client";

import { useEffect, useRef, useState } from "react";
import { useChangaQuery as useQuery, useChangaMutation as useMutation } from "@/hooks/useChangaData";
import { api } from "../../../convex/_generated/api";
import { useNavigation } from "@/hooks/useNavigation";
import { useTranslation } from "@/i18n/TranslationProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Screen } from "@/types";
import { logChangaEvent } from "@/lib/changaTelemetry";
import { trackEvent } from "@/lib/analytics";
import { ChangaEmptyState } from "@/components/changa/ChangaEmptyState";
import {
    TodayGoalCard,
    CommunityChallengeCard,
    WaysToHelpGrid,
    ChangaSectionHeading,
    type HelpWayKey,
} from "@/components/changa/ChangaBits";
import {
    ArrowRight,
    Clock3,
    Languages,
    Share2,
    Sparkles,
    Target,
    Users,
    Trophy,
    Globe,
    Bell,
    ShieldCheck,
} from "lucide-react";

const TASK_TYPE_LABELS: Record<string, string> = {
    lexicon_entry: "Add a word",
    phrase_translation: "Translate a phrase",
    sentence_translation: "Translate a sentence",
    transcription: "Write what you hear",
    audio_reading: "Record a phrase",
    cultural_context: "Share cultural context",
    dialect_mapping: "Map a dialect",
};

const TEXT_TASK_TYPES = new Set([
    "lexicon_entry",
    "phrase_translation",
    "sentence_translation",
    "transcription",
    "audio_reading",
    "cultural_context",
    "dialect_mapping",
]);

// "Speak and listen" / "Write" / "Check" / "Together" — the four ways to help.
const WAY_TASK_TYPES: Record<HelpWayKey, string[]> = {
    speak: ["audio_reading", "transcription"],
    write: ["lexicon_entry", "phrase_translation", "sentence_translation", "cultural_context"],
    check: ["validation"],
    together: ["dialect_mapping"],
};

const LANGUAGE_OPTIONS = [
    { id: "sheng", label: "Sheng", emoji: "🔥" },
    { id: "sw", label: "Kiswahili", emoji: "🇰🇪" },
    { id: "ki", label: "Kikuyu", emoji: "🌳" },
    { id: "en", label: "English", emoji: "🌍" },
];

const LANGUAGE_NAMES: Record<string, string> = {
    sheng: "Sheng",
    sw: "Kiswahili",
    ki: "Kikuyu",
    en: "English",
};

function taskLabel(taskType: string | undefined): string {
    return (taskType && TASK_TYPE_LABELS[taskType]) || "Quick task";
}

// Local row shapes. `useChangaQuery` widens to the generated Convex types, but
// a dev deployment can return partially-shaped rows, so we narrow defensively
// at the call site instead of fighting the implicit `any`.
type ChangaTaskRow = {
    _id: string;
    taskType: string;
    languageCode: string;
    dialectCode?: string;
    promptSourceText?: string;
    promptTargetText?: string;
};

type SubmissionRow = { status: string };

type CampaignRow = {
    title: string;
    description: string;
    languageCode?: string;
    currentCount: number;
    goalCount: number;
};

function greetingKey(): "greetingMorning" | "greetingAfternoon" | "greetingEvening" {
    const hour = new Date().getHours();
    if (hour < 12) return "greetingMorning";
    if (hour < 18) return "greetingAfternoon";
    return "greetingEvening";
}

interface ChangaHomeProps {
    onViewActivity?: () => void;
    userName?: string;
}

export default function ChangaHome({ onViewActivity, userName }: ChangaHomeProps) {
    const { navigate } = useNavigation();
    const { t } = useTranslation();
    const [selectedLanguage, setSelectedLanguage] = useState("sheng");
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
    const dailyGoal = useQuery(api.changa.community.getDailyGoal, {});
    const inviteCode = useQuery(api.changa.invites.getMyInviteCode);
    const generateInviteCode = useMutation(api.changa.invites.generateInviteCode);
    const profile = useQuery(api.users.queries.getProfile, {});

    const isModerator = profile?.role === "moderator" || profile?.role === "admin";

    const openTasks = ((tasks ?? []) as ChangaTaskRow[]).filter(
        (task) => typeof task.taskType === "string" && TEXT_TASK_TYPES.has(task.taskType),
    );
    const recommendedTask = openTasks[0];
    const otherTasks = openTasks.slice(1, 6);

    const acceptedCount = userStats?.contributionCount
        ? ((userSubmissions ?? []) as SubmissionRow[]).filter(
              (sub) => sub.status === "validated" || sub.status === "curated",
          ).length
        : 0;
    const inReviewCount = ((userSubmissions ?? []) as SubmissionRow[]).filter(
        (sub) => sub.status === "in_validation" || sub.status === "submitted",
    ).length;

    const isNewContributor = acceptedCount === 0 && inReviewCount === 0;

    const displayName = userName || profile?.name || "there";
    const languageName = LANGUAGE_NAMES[selectedLanguage] ?? selectedLanguage;

    const wayCounts: Partial<Record<HelpWayKey, number>> = {};
    for (const [way, types] of Object.entries(WAY_TASK_TYPES) as [HelpWayKey, string[]][]) {
        wayCounts[way] = openTasks.filter((task) => types.includes(task.taskType)).length;
    }

    const startTask = (taskId: string, taskType: string, languageCode: string) => {
        trackEvent("changa_started", { location: "changa_home" });
        logChangaEvent({ name: "task_started", taskType, languageCode, taskId });
        navigate(Screen.ADD_CONTRIBUTION, { taskId });
    };

    const startQuickContribute = () => {
        if (recommendedTask) {
            startTask(recommendedTask._id, recommendedTask.taskType, recommendedTask.languageCode);
        } else {
            navigate(Screen.ADD_CONTRIBUTION);
        }
    };

    const handleWaySelect = (way: HelpWayKey) => {
        if (way === "check") {
            navigate(Screen.CHANGA_ACTIVITY);
            return;
        }
        const match = openTasks.find((task) => WAY_TASK_TYPES[way].includes(task.taskType));
        if (match) startTask(match._id, match.taskType, match.languageCode);
        else startQuickContribute();
    };

    const handleShare = async () => {
        let code = inviteCode;
        if (!code) {
            code = await generateInviteCode({ channel: "share" });
        }
        const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/changa?ref=${code}`;
        const shareData = {
            title: "Join me on Changa",
            text: "I'm helping build AI that understands my language. Join me on Samiati!",
            url: shareUrl,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
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
        trackEvent("changa_opened", { location: "changa_home" });
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

    const topCampaign = (campaigns as CampaignRow[] | undefined)?.[0];
    const streakDays = dailyGoal?.streakDays ?? userStats?.streakDays ?? 0;

    // Status line — also the aria-live region asserted by e2e/a11y.spec.ts.
    const statusMessage = recommendedTask
        ? `${t("todaysMissions")}: ${taskLabel(recommendedTask.taskType)} — ${languageName}`
        : t("welcomeBack");

    return (
        <main className="min-h-screen bg-background px-4 py-6 sm:py-10">
            <div className="mx-auto max-w-xl space-y-5">
                {/* Greeting header */}
                <header className="space-y-2">
                    <p className="text-sm font-bold uppercase tracking-widest text-primary">
                        {t(greetingKey())}
                    </p>
                    <h1 className="text-3xl font-black tracking-tight text-foreground">
                        {t("helloName", { name: displayName })}
                    </h1>
                    <p className="text-sm text-muted-foreground">{t("valueLine")}</p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
                            <Share2 className="size-3.5" aria-hidden />
                            {t("invite")}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onViewActivity}>
                            {t("myActivity")}
                        </Button>
                    </div>
                </header>

                {showInvite ? (
                    <div className="rounded-lg bg-emerald-100 p-3 text-sm text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                        {t("inviteSuccess")}
                    </div>
                ) : null}

                {/* Language selector — "Which language do you want to help?" */}
                <section className="space-y-2" aria-label={t("whichLanguage")}>
                    <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                        {t("whichLanguage")}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {LANGUAGE_OPTIONS.map((lang) => (
                            <button
                                key={lang.id}
                                type="button"
                                onClick={() => setSelectedLanguage(lang.id)}
                                aria-pressed={selectedLanguage === lang.id}
                                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                                    selectedLanguage === lang.id
                                        ? "bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100"
                                        : "bg-muted text-muted-foreground hover:bg-accent"
                                }`}
                            >
                                <span aria-hidden>{lang.emoji}</span>
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Today's goal + streak/XP */}
                {dailyGoal === undefined ? (
                    <Card className="space-y-3 p-5 shadow-sm">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-2.5 w-full" />
                        <Skeleton className="h-2 w-full" />
                    </Card>
                ) : (
                    <TodayGoalCard
                        done={dailyGoal?.done ?? 0}
                        target={dailyGoal?.target ?? 3}
                        streakDays={streakDays}
                        xpToday={dailyGoal?.xpToday ?? 0}
                        sentenceDone={dailyGoal?.sentenceGoal.done ?? 0}
                        sentenceTarget={dailyGoal?.sentenceGoal.target ?? 100_000}
                    />
                )}

                {/* Community + moderation entry points. The prototype surfaces
                    these directly under the daily goal so they are reachable
                    without scrolling past the whole mission list. */}
                <section className="space-y-3">
                    <Card className="space-y-2 border border-primary/20 bg-primary/5 p-4 shadow-sm">
                        <p className="flex items-center gap-2 text-sm font-black text-foreground">
                            <Globe className="size-4 text-primary" aria-hidden />
                            {t("communityHomeTitle")}
                        </p>
                        <p className="text-xs text-muted-foreground">{t("communityHomeHint")}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                navigate(Screen.CHANGA_COMMUNITY, {
                                    language: selectedLanguage,
                                    name: languageName,
                                })
                            }
                            className="w-full gap-1.5 font-bold"
                        >
                            {t("openCommunity")}
                            <ArrowRight className="size-3.5" aria-hidden />
                        </Button>
                    </Card>

                    <Card className="space-y-2 p-4 shadow-sm">
                        <p className="flex items-center gap-2 text-sm font-black text-foreground">
                            <ShieldCheck className="size-4 text-primary" aria-hidden />
                            {isModerator ? t("trustedReviewer") : t("keeperOfLanguage")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {isModerator ? t("thankYouClean") : t("keeperSubtitle")}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                navigate(
                                    isModerator
                                        ? Screen.MODERATION_DASHBOARD
                                        : Screen.MODERATION_APPLICATION,
                                )
                            }
                            className="w-full font-bold"
                        >
                            {isModerator ? t("openValidationQueue") : t("applyKeeper")}
                        </Button>
                    </Card>
                </section>

                {/* Welcome back + community challenge */}
                <section className="space-y-3" aria-live="polite" aria-atomic="true">
                    <div>
                        <h2 className="text-lg font-black text-foreground">{t("welcomeBack")}</h2>
                        <p className="text-sm text-muted-foreground">{t("whatNeedsToday")}</p>
                    </div>
                    <p className="text-sm font-medium text-foreground/80">{statusMessage}</p>

                    {campaigns === undefined ? (
                        <Skeleton className="h-40 w-full rounded-xl" />
                    ) : topCampaign ? (
                        <CommunityChallengeCard
                            title={topCampaign.title}
                            description={topCampaign.description}
                            languageCode={topCampaign.languageCode ?? languageName}
                            current={topCampaign.currentCount}
                            goal={topCampaign.goalCount}
                            onStart={startQuickContribute}
                        />
                    ) : null}
                </section>

                {/* Quick contribute */}
                <Card className="flex items-center justify-between gap-3 p-4 shadow-sm">
                    <div className="min-w-0">
                        <p className="text-sm font-black text-foreground">{t("quickContribute")}</p>
                        <p className="truncate text-xs text-muted-foreground">{t("aboutTime")}</p>
                    </div>
                    <Button size="sm" onClick={startQuickContribute} className="shrink-0 gap-1.5 font-bold">
                        {t("letUsChoose")}
                        <ArrowRight className="size-3.5" aria-hidden />
                    </Button>
                </Card>

                {/* Today's missions */}
                <section className="space-y-3">
                    <ChangaSectionHeading
                        icon={<Sparkles className="size-4 text-primary" aria-hidden />}
                        title={t("todaysMissions")}
                    />
                    <p className="text-sm text-muted-foreground">{t("missionsHint")}</p>

                    {tasks === undefined ? (
                        <Card className="space-y-3 p-5 shadow-sm">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-11 w-full" />
                        </Card>
                    ) : recommendedTask ? (
                        <Card className="space-y-4 border-amber-300/60 p-5 shadow-sm dark:border-amber-800/60">
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                                        <Languages className="size-3" aria-hidden />
                                        {recommendedTask.languageCode}
                                        {recommendedTask.dialectCode ? ` · ${recommendedTask.dialectCode}` : ""}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                                        <Clock3 className="size-3" aria-hidden />
                                        {t("aboutTime")}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold leading-snug">
                                    {taskLabel(recommendedTask.taskType)}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {recommendedTask.promptSourceText ||
                                        recommendedTask.promptTargetText ||
                                        t("quickTask")}
                                </p>
                            </div>
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={() =>
                                    startTask(
                                        recommendedTask._id,
                                        recommendedTask.taskType,
                                        recommendedTask.languageCode,
                                    )
                                }
                            >
                                {t("startTask")}
                                <ArrowRight className="ml-2 size-4" aria-hidden />
                            </Button>
                        </Card>
                    ) : isNewContributor ? (
                        <ChangaEmptyState
                            onStartTask={(taskId: string) => {
                                const match =
                                    openTasks.find((task) => task._id === taskId) ?? recommendedTask;
                                if (match) startTask(match._id, match.taskType, match.languageCode);
                                else startQuickContribute();
                            }}
                        />
                    ) : (
                        <Card className="space-y-3 p-6 text-center shadow-sm">
                            <Target className="mx-auto size-8 text-muted-foreground" aria-hidden />
                            <h3 className="text-lg font-semibold">{t("noTasks")}</h3>
                            <p className="text-sm text-muted-foreground">{t("findingTasks")}</p>
                        </Card>
                    )}

                    {otherTasks.length > 0 ? (
                        <div className="space-y-2">
                            {otherTasks.map((task) => (
                                <button
                                    key={task._id}
                                    onClick={() => startTask(task._id, task.taskType, task.languageCode)}
                                    className="flex w-full items-center justify-between gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-accent"
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-medium">
                                            {taskLabel(task.taskType)}
                                        </span>
                                        <span className="block truncate text-xs text-muted-foreground">
                                            {task.languageCode}
                                            {task.dialectCode ? ` · ${task.dialectCode}` : ""}
                                            {task.promptSourceText ? ` — ${task.promptSourceText}` : ""}
                                        </span>
                                    </span>
                                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                                </button>
                            ))}
                        </div>
                    ) : null}
                </section>

                {/* All ways to help */}
                <section className="space-y-3">
                    <ChangaSectionHeading title={t("allWaysToHelp")} />
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {dailyGoal?.done ?? 0} {t("doneToday", { count: dailyGoal?.target ?? 3 })} ·{" "}
                        <span aria-hidden>🔥</span> {streakDays} {t("days")}
                    </p>
                    <WaysToHelpGrid counts={wayCounts} onSelect={handleWaySelect} />
                </section>

                {/* Shortcuts: Achievements / Communities / Notifications */}
                <section className="grid grid-cols-3 gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(Screen.ALL_ACHIEVEMENTS)}
                        className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-card p-3 text-center transition-colors hover:bg-accent"
                    >
                        <Trophy className="size-5 text-primary" aria-hidden />
                        <span className="text-[11px] font-bold text-foreground">
                            {t("achievementsLabel")}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(Screen.COMMUNITIES)}
                        className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-card p-3 text-center transition-colors hover:bg-accent"
                    >
                        <Globe className="size-5 text-primary" aria-hidden />
                        <span className="text-[11px] font-bold text-foreground">
                            {t("communitiesLabel")}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(Screen.NOTIFICATIONS)}
                        className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-card p-3 text-center transition-colors hover:bg-accent"
                    >
                        <Bell className="size-5 text-primary" aria-hidden />
                        <span className="text-[11px] font-bold text-foreground">
                            {t("notificationsLabel")}
                        </span>
                    </button>
                </section>

                {/* Invite */}
                <Card className="space-y-3 border-dashed p-4 text-center shadow-sm">
                    <Users className="mx-auto size-6 text-muted-foreground" aria-hidden />
                    <p className="text-sm text-muted-foreground">{t("collectingSheng")}</p>
                    <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
                        <Share2 className="size-3.5" aria-hidden />
                        {t("invite")}
                    </Button>
                </Card>
            </div>
        </main>
    );
}