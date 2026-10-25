"use client";

import { useEffect, useRef, useState } from "react";
import { useChangaQuery as useQuery } from "@/hooks/useChangaData";
import { api } from "../../../convex/_generated/api";
import { useNavigation } from "@/hooks/useNavigation";
import { useTranslation } from "@/i18n/TranslationProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChangaPageHeader } from "@/components/changa/ChangaPageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Screen } from "@/types";
import { logChangaEvent } from "@/lib/changaTelemetry";
import { trackEvent } from "@/lib/analytics";
import { LANGUAGES } from "@/lib/languages";
import { ChangaEmptyState } from "@/components/changa/ChangaEmptyState";
import {
    TodayGoalMissionCard,
    CommunityHeroCard,
    ActivityLinkButton,
    type HelpWayKey,
} from "@/components/changa/ChangaBits";
import { ContributionBlock } from "@/components/changa/ContributionBlock";
import {
    Target,
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

// "Speak and listen" / "Write" / "Check" / "Community" — the ways to help.
const WAY_TASK_TYPES: Record<HelpWayKey, string[]> = {
    speak: ["audio_reading", "transcription"],
    write: ["lexicon_entry", "phrase_translation", "sentence_translation", "cultural_context"],
    check: ["validation"],
    community: [],
};

// Language chips shown on the Changa home "which language do you want to help?" picker.
// Driven by the full set of in-app supported languages so every language Samiati offers
// is available to contribute to, not just a handful.
const LANGUAGE_OPTIONS = LANGUAGES.map((lang) => ({
    id: lang.code,
    label: lang.name,
}));

const LANGUAGE_NAMES: Record<string, string> = Object.fromEntries(
    LANGUAGES.map((lang) => [lang.code, lang.name]),
);

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
    goBack?: () => void;
}

export default function ChangaHome({ onViewActivity, userName, goBack }: ChangaHomeProps) {
    const { navigate } = useNavigation();
    const { t } = useTranslation();
    const [selectedLanguage, setSelectedLanguage] = useState("sw");

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
    const profile = useQuery(api.users.queries.getProfile, {});

    const isModerator = profile?.role === "moderator" || profile?.role === "admin";

    const openTasks = ((tasks ?? []) as ChangaTaskRow[]).filter(
        (task) => typeof task.taskType === "string" && TEXT_TASK_TYPES.has(task.taskType),
    );
    const recommendedTask = openTasks[0];

    const acceptedCount = userStats?.contributionCount
        ? ((userSubmissions ?? []) as SubmissionRow[]).filter(
              (sub) => sub.status === "validated" || sub.status === "curated",
          ).length
        : 0;
    const inReviewCount = ((userSubmissions ?? []) as SubmissionRow[]).filter(
        (sub) => sub.status === "in_validation" || sub.status === "submitted",
    ).length;

    const isNewContributor = acceptedCount === 0 && inReviewCount === 0;

    const activityCount = userStats?.contributionCount ?? 0;
    const activityCountLabel = t("activityCountLabel", {
        count: activityCount,
        plural: activityCount === 1 ? "" : "s",
    });

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

    const TRANSLATION_TASK_TYPES = new Set([
        "lexicon_entry",
        "phrase_translation",
        "sentence_translation",
        "cultural_context",
    ]);
    const ASR_TASK_TYPES = new Set(["transcription"]);
    const TTS_TASK_TYPES = new Set(["audio_reading"]);

    const categorizeTask = (taskType: string): "translation" | "asr" | "tts" | null => {
        if (TRANSLATION_TASK_TYPES.has(taskType)) return "translation";
        if (ASR_TASK_TYPES.has(taskType)) return "asr";
        if (TTS_TASK_TYPES.has(taskType)) return "tts";
        return null;
    };

    const startQuickContribute = () => {
        if (!openTasks.length) {
            navigate(Screen.ADD_CONTRIBUTION);
            return;
        }

        // Algorithm: identify the contribution area requiring the most attention
        // by counting open tasks per category (translation / ASR / TTS).
        const categoryCounts = {
            translation: openTasks.filter((t) => categorizeTask(t.taskType) === "translation").length,
            asr: openTasks.filter((t) => categorizeTask(t.taskType) === "asr").length,
            tts: openTasks.filter((t) => categorizeTask(t.taskType) === "tts").length,
        };

        // Priority order: translation > ASR > TTS; break ties by highest open count.
        let priorityCategory: "translation" | "asr" | "tts" = "translation";
        let maxCount = categoryCounts.translation;
        if (categoryCounts.asr > maxCount) {
            priorityCategory = "asr";
            maxCount = categoryCounts.asr;
        }
        if (categoryCounts.tts > maxCount) {
            priorityCategory = "tts";
        }

        const match = openTasks.find((task) => categorizeTask(task.taskType) === priorityCategory);
        if (match) {
            startTask(match._id, match.taskType, match.languageCode);
        } else {
            navigate(Screen.ADD_CONTRIBUTION);
        }
    };

    const handleWaySelect = (way: HelpWayKey) => {
        if (way === "check") {
            navigate(Screen.MODERATION_DASHBOARD);
            return;
        }
        if (way === "community") {
            navigate(Screen.CHANGA_COMMUNITY, { language: selectedLanguage, name: languageName });
            return;
        }
        const match = openTasks.find((task) => WAY_TASK_TYPES[way].includes(task.taskType));
        if (match) startTask(match._id, match.taskType, match.languageCode);
        else startQuickContribute();
    };

    const handleViewActivity = () => {
        trackEvent("changa_activity_viewed", { location: "changa_home" });
        if (onViewActivity) {
            onViewActivity();
            return;
        }
        navigate(Screen.CHANGA_ACTIVITY);
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

    return (
        <main className="min-h-screen bg-background px-4 py-6 sm:py-10">
            <div className="mx-auto max-w-xl space-y-5">
                {/* Greeting header */}
                <div className="space-y-3">
                    {goBack ? (
                        <ChangaPageHeader
                            title={t("helloName", { name: displayName })}
                            onBack={goBack}
                            onNotifications={() => navigate(Screen.NOTIFICATIONS)}
                        />
                    ) : (
                        <header className="space-y-2">
                            <p className="text-sm font-bold uppercase tracking-widest text-primary">
                                {t(greetingKey())}
                            </p>
                            <h1 className="text-3xl font-black tracking-tight text-foreground">
                                {t("helloName", { name: displayName })}
                            </h1>
                            <p className="text-sm text-muted-foreground">{t("valueLine")}</p>
                            <div className="flex justify-end">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate(Screen.NOTIFICATIONS)}
                                    aria-label="Notifications"
                                    className="rounded-full"
                                >
                                    <Bell className="size-5" />
                                </Button>
                            </div>
                        </header>
                    )}
                    {!goBack && (
                        <p className="text-sm font-bold uppercase tracking-widest text-primary">
                            {t(greetingKey())}
                        </p>
                    )}
                </div>

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
                                    {lang.label}
                                </button>
                        ))}
                    </div>
                </section>

                {/* Today's goal + mission — merged clickable hero card */}
                {dailyGoal === undefined || tasks === undefined ? (
                    <Card className="space-y-3 p-5 shadow-sm">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-2.5 w-full" />
                        <Skeleton className="h-2 w-full" />
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-11 w-full" />
                    </Card>
                ) : recommendedTask ? (
                    <TodayGoalMissionCard
                        done={dailyGoal?.done ?? 0}
                        target={dailyGoal?.target ?? 3}
                        streakDays={streakDays}
                        xpToday={dailyGoal?.xpToday ?? 0}
                        sentenceDone={dailyGoal?.sentenceGoal.done ?? 0}
                        sentenceTarget={dailyGoal?.sentenceGoal.target ?? 100_000}
                        mission={{
                            label: t("todaysMissions"),
                            title: taskLabel(recommendedTask.taskType),
                            prompt:
                                recommendedTask.promptSourceText ||
                                recommendedTask.promptTargetText ||
                                t("quickTask"),
                            languageCode: recommendedTask.languageCode,
                            dialectCode: recommendedTask.dialectCode,
                            timeLabel: t("aboutTime"),
                            ctaLabel: t("startTask"),
                        }}
                        onStart={() =>
                            startTask(
                                recommendedTask._id,
                                recommendedTask.taskType,
                                recommendedTask.languageCode,
                            )
                        }
                        onViewActivity={handleViewActivity}
                        activityLabel={t("myActivity")}
                        activityCount={activityCount}
                        activityCountLabel={activityCountLabel}
                    />
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

                {/* Activity stays reachable even when the goal card is not shown */}
                {dailyGoal === undefined || !recommendedTask ? (
                    <div className="flex justify-end">
                        <ActivityLinkButton
                            label={t("myActivity")}
                            count={activityCount}
                            countLabel={activityCountLabel}
                            onClick={handleViewActivity}
                        />
                    </div>
                ) : null}

                {/* Community + moderation entry points. The prototype surfaces
                    these directly under the daily goal so they are reachable
                    without scrolling past the whole mission list. */}
                <section className="space-y-3">
                    <CommunityHeroCard
                        title={t("communityHomeTitle")}
                        hint={t("communityHomeHint")}
                        loading={campaigns === undefined}
                        challenge={
                            topCampaign
                                ? {
                                      title: topCampaign.title,
                                      description: topCampaign.description,
                                      languageCode: topCampaign.languageCode ?? languageName,
                                      current: topCampaign.currentCount,
                                      goal: topCampaign.goalCount,
                                  }
                                : undefined
                        }
                        openCtaLabel={t("openCommunity")}
                        onOpenCommunity={() =>
                            navigate(Screen.CHANGA_COMMUNITY, {
                                language: selectedLanguage,
                                name: languageName,
                            })
                        }
                        onJoinChallenge={startQuickContribute}
                    />

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

                {/* Contribution Block: quick contribute + ways to help */}
                <ContributionBlock
                    t={t}
                    onQuickContribute={startQuickContribute}
                    onSelectWay={handleWaySelect}
                    wayCounts={wayCounts}
                />
            </div>
        </main>
    );
}