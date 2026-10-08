import { query, type QueryCtx } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";

// ---------------------------------------------------------------------------
// Community surface (Changa prototype revamp).
//
// These queries power the prototype's new community + daily-goal blocks:
//   • "Word of the day"
//   • "Recognition" (Top contributor / Most consistent / Helpful reviewer /
//     Community builder)
//   • "<Language> goal: 100,000 sentences" with a per-category breakdown
//     (Translation · Voice · Vocabulary · Validation)
//   • "Where we need more voices" (region targeting)
//   • Today's goal (streak / XP / sentences)
//
// Every read is bounded so a single page render can never blow the query
// budget, and every table read uses an index (schema gate).
// ---------------------------------------------------------------------------

const SENTENCE_GOAL = 100_000;
const DAILY_TASK_TARGET = 3;
const MAX_ROWS = 2000;

const TRANSLATION_TYPES = ["phrase_translation", "sentence_translation"];
const VOICE_TYPES = ["audio_reading", "transcription"];
const VOCABULARY_TYPES = ["lexicon_entry", "cultural_context"];

function todayIso(): string {
    return new Date().toISOString().slice(0, 10);
}

function startOfTodayMs(): number {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start.getTime();
}

function countAcceptedByType(
    submissions: Array<{ submissionType: string; status: string }>,
    types: string[],
): number {
    return submissions.filter(
        (submission) =>
            (submission.status === "validated" || submission.status === "curated") &&
            types.includes(submission.submissionType),
    ).length;
}

async function submissionsForLanguage(ctx: QueryCtx, languageCode: string) {
    return ctx.db
        .query("changaSubmissions")
        .withIndex("by_language_status", (q) => q.eq("languageCode", languageCode))
        .take(MAX_ROWS);
}

// ---------------------------------------------------------------------------
// Word of the day
// ---------------------------------------------------------------------------

export const getWordOfTheDay = query({
    args: {
        languageCode: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const date = todayIso();

        if (args.languageCode) {
            const todayExact = await ctx.db
                .query("changaWordOfTheDay")
                .withIndex("by_language_date", (q) =>
                    q.eq("languageCode", args.languageCode!).eq("date", date),
                )
                .first();
            if (todayExact) return todayExact;

            const recent = await ctx.db
                .query("changaWordOfTheDay")
                .withIndex("by_language_date", (q) => q.eq("languageCode", args.languageCode!))
                .order("desc")
                .take(1);
            return recent[0] ?? null;
        }

        const todayAny = await ctx.db
            .query("changaWordOfTheDay")
            .withIndex("by_date", (q) => q.eq("date", date))
            .first();
        if (todayAny) return todayAny;

        const recentAny = await ctx.db
            .query("changaWordOfTheDay")
            .withIndex("by_date")
            .order("desc")
            .take(1);
        return recentAny[0] ?? null;
    },
});

// ---------------------------------------------------------------------------
// Recognition board — the four contributors highlighted on the community page
// ---------------------------------------------------------------------------

export type RecognitionEntry = {
    key: "topContributor" | "mostConsistent" | "helpfulReviewer" | "communityBuilder";
    label: string;
    userId: string;
    name: string;
    avatar: string;
    value: number;
    metric: string;
};

export const getRecognitionBoard = query({
    args: {
        languageCode: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args): Promise<RecognitionEntry[]> => {
        const stats = await ctx.db
            .query("changaUserStats")
            .withIndex("by_trustScore")
            .order("desc")
            .take(Math.min(args.limit ?? 50, 100));

        if (stats.length === 0) return [];

        const userDocs = await Promise.all(stats.map((row) => ctx.db.get(row.userId)));
        const usersById = new Map(
            userDocs.filter(Boolean).map((user) => [String(user!._id), user!] as const),
        );

        const scored = stats.map((row) => {
            const user = usersById.get(String(row.userId));
            return {
                userId: String(row.userId),
                name: user?.name ?? "Contributor",
                avatar: user?.avatar ?? "",
                contributionCount: row.contributionCount,
                validationCount: row.validationCount,
                streakDays: row.streakDays,
                languages: row.topLanguages?.length ?? 0,
            };
        });

        type Scored = (typeof scored)[number];
        const pick = (
            key: RecognitionEntry["key"],
            label: string,
            metric: string,
            valueOf: (entry: Scored) => number,
        ): RecognitionEntry | null => {
            const best = [...scored].sort((left, right) => valueOf(right) - valueOf(left))[0];
            if (!best) return null;
            const value = valueOf(best);
            if (value <= 0) return null;
            return {
                key,
                label,
                metric,
                userId: best.userId,
                name: best.name,
                avatar: best.avatar,
                value,
            };
        };

        return [
            pick("topContributor", "Top contributor", "accepted", (entry) => entry.contributionCount),
            pick("mostConsistent", "Most consistent", "day streak", (entry) => entry.streakDays),
            pick("helpfulReviewer", "Helpful reviewer", "reviews", (entry) => entry.validationCount),
            pick("communityBuilder", "Community builder", "languages", (entry) => entry.languages),
        ].filter((entry): entry is RecognitionEntry => entry !== null);
    },
});

// ---------------------------------------------------------------------------
// Per-language goal with category breakdown
// ---------------------------------------------------------------------------

export const getLanguageGoal = query({
    args: {
        languageCode: v.string(),
    },
    handler: async (ctx, args) => {
        const goal = await ctx.db
            .query("changaLanguageGoals")
            .withIndex("by_language", (q) => q.eq("languageCode", args.languageCode))
            .first();

        const submissions = await submissionsForLanguage(ctx, args.languageCode);

        const translationCurrent = countAcceptedByType(submissions, TRANSLATION_TYPES);
        const voiceCurrent = countAcceptedByType(submissions, VOICE_TYPES);
        const vocabularyCurrent = countAcceptedByType(submissions, VOCABULARY_TYPES);
        const validationCurrent = countAcceptedByType(submissions, ["validation"]);

        const categories = [
            { key: "translation", label: "Translation", current: translationCurrent, target: goal?.translationTarget ?? 60_000 },
            { key: "voice", label: "Voice", current: voiceCurrent, target: goal?.voiceTarget ?? 25_000 },
            { key: "vocabulary", label: "Vocabulary", current: vocabularyCurrent, target: goal?.vocabularyTarget ?? 100_000 },
            { key: "validation", label: "Validation", current: validationCurrent, target: goal?.validationTarget ?? 5_000 },
        ];

        const totalCurrent = categories.reduce((sum, category) => sum + category.current, 0);

        return {
            languageCode: args.languageCode,
            targetSentences: goal?.targetSentences ?? SENTENCE_GOAL,
            totalCurrent,
            categories,
        };
    },
});

// ---------------------------------------------------------------------------
// Regions where more voices are needed
// ---------------------------------------------------------------------------

export const getRegionsNeedingVoices = query({
    args: {
        languageCode: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const rows = await ctx.db
            .query("changaRegionVoices")
            .withIndex("by_language", (q) => q.eq("languageCode", args.languageCode))
            .take(Math.min(args.limit ?? 20, 50));

        return rows
            .map((row) => ({
                region: row.region,
                contributions: row.contributions,
                target: row.target,
                remaining: Math.max(0, row.target - row.contributions),
            }))
            .sort((left, right) => right.remaining - left.remaining);
    },
});

// ---------------------------------------------------------------------------
// Today's goal + overall sentence goal
// ---------------------------------------------------------------------------

export const getDailyGoal = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return null;

        const stats = await ctx.db
            .query("changaUserStats")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .first();

        const submissions = await ctx.db
            .query("changaSubmissions")
            .withIndex("by_user_status", (q) => q.eq("userId", user._id))
            .take(500);

        const start = startOfTodayMs();
        const doneToday = submissions.filter(
            (submission) => (submission.submittedAt ?? submission.updatedAt) >= start,
        ).length;

        const done = Math.min(doneToday, DAILY_TASK_TARGET);

        return {
            done,
            target: DAILY_TASK_TARGET,
            remaining: Math.max(0, DAILY_TASK_TARGET - done),
            completed: doneToday >= DAILY_TASK_TARGET,
            streakDays: stats?.streakDays ?? 0,
            xpToday: doneToday * 10,
            xp: user.xp ?? 0,
            level: user.level ?? 1,
            sentenceGoal: { done: SENTENCE_GOAL, target: SENTENCE_GOAL },
        };
    },
});

// ---------------------------------------------------------------------------
// Community summary (header + "Hours of speech" / "of 100,000 sentences")
// ---------------------------------------------------------------------------

export const getCommunitySummary = query({
    args: {
        languageCode: v.optional(v.string()),
        name: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const submissions = args.languageCode
            ? await ctx.db
                  .query("changaSubmissions")
                  .withIndex("by_language_status", (q) => q.eq("languageCode", args.languageCode!))
                  .take(MAX_ROWS)
            : await ctx.db
                  .query("changaSubmissions")
                  .withIndex("by_status", (q) => q.eq("status", "validated"))
                  .take(MAX_ROWS);

        const contributorIds = new Set<string>();
        let audioCount = 0;
        for (const submission of submissions) {
            if (submission.userId) contributorIds.add(String(submission.userId));
            if (VOICE_TYPES.includes(submission.submissionType)) audioCount += 1;
        }

        return {
            name: args.name ?? null,
            sentencesDone: submissions.length,
            sentencesTarget: SENTENCE_GOAL,
            hoursOfSpeech: Math.round(audioCount * 0.1),
            contributions: submissions.length,
            people: contributorIds.size,
        };
    },
});
