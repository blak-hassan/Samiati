"use client";

/**
 * Changa demo dataset (client-side fallback).
 *
 * WHY THIS EXISTS: the Changa section reads from Convex, and a dev
 * deployment can be unavailable (disabled plan, no backend configured,
 * offline). When that happens every `useQuery` stays `undefined` and the
 * whole section is stuck on skeletons, which blocks end-to-end testing.
 *
 * This module mirrors the shapes returned by the real queries (same field
 * names as `convex/schema.ts`) with stable IDs so navigation between
 * screens (task → contribution → activity → review) keeps working. It is
 * the client-side twin of `convex/changa/seedDemo.ts`, which seeds the same
 * story into a live deployment.
 *
 * NEVER imported in production code paths: see `src/hooks/useChangaData.ts`
 * for the guard.
 */

export const DEMO_NOW = Date.now();
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const DEMO_USERS = {
    wanjiku: {
        _id: "demo_user_wanjiku",
        name: "Wanjiku Mwangi",
        avatar: "",
        role: "member",
        level: 3,
        xp: 145,
    },
    otieno: {
        _id: "demo_user_otieno",
        name: "Otieno Ochieng",
        avatar: "",
        role: "member",
        level: 2,
        xp: 88,
    },
    amina: {
        _id: "demo_user_amina",
        name: "Amina Hassan",
        avatar: "",
        role: "member",
        level: 1,
        xp: 47,
    },
} as const;

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

const baseCampaign = {
    startAt: DEMO_NOW - 21 * DAY,
    status: "active" as const,
    createdAt: DEMO_NOW - 21 * DAY,
};

export const DEMO_CAMPAIGNS = [
    {
        ...baseCampaign,
        _id: "demo_campaign_sheng",
        title: "Collect 500 Sheng Sentences",
        description:
            "Help build the first high-quality Sheng translation dataset. Every sentence you translate helps AI understand how real Sheng speakers talk.",
        languageCode: "sheng",
        taskTypes: ["sentence_translation", "audio_reading"],
        goalCount: 500,
        currentCount: 187,
    },
    {
        ...baseCampaign,
        _id: "demo_campaign_sw",
        title: "Kiswahili Phrase Harvest",
        description:
            "Collect everyday Kiswahili phrases and their translations to power natural, human-sounding translations.",
        languageCode: "sw",
        taskTypes: ["phrase_translation", "lexicon_entry"],
        goalCount: 1000,
        currentCount: 412,
    },
    {
        ...baseCampaign,
        _id: "demo_campaign_ki",
        title: "Kikuyu Lexicon Sprint",
        description:
            "Build the first community-reviewed Gikuyu word list. Every entry is checked by two peer reviewers before curation.",
        languageCode: "ki",
        taskTypes: ["lexicon_entry"],
        goalCount: 300,
        currentCount: 64,
    },
    {
        ...baseCampaign,
        _id: "demo_campaign_luo",
        title: "Dholuo Stories on Record",
        description:
            "Record short Dholuo stories and conversations in your natural voice to train speech models for Luo speakers.",
        languageCode: "luo",
        taskTypes: ["transcription", "audio_reading"],
        goalCount: 200,
        currentCount: 178,
    },
    {
        ...baseCampaign,
        _id: "demo_campaign_slang",
        title: "Sheng Slang of the Week",
        description:
            "A weekly sprint for the newest Sheng coinages before they go stale. Fast tasks, quick review.",
        languageCode: "sheng",
        taskTypes: ["lexicon_entry", "cultural_context"],
        goalCount: 50,
        currentCount: 47,
    },
] as const;

// ---------------------------------------------------------------------------
// Tasks (all open, text types so they render in the task hub)
// ---------------------------------------------------------------------------

const baseTask = {
    templateVersion: 1,
    status: "open" as const,
    targetSubmissionCount: 5,
    targetValidationCount: 2,
    priority: "normal" as const,
    createdBy: "demo_user_wanjiku",
    createdAt: DEMO_NOW - 2 * DAY,
};

export const DEMO_TASKS = [
    {
        ...baseTask,
        _id: "demo_task_1",
        campaignId: "demo_campaign_slang",
        taskType: "phrase_translation",
        languageCode: "sheng",
        domain: "everyday_conversation",
        difficulty: "beginner",
        priority: "high",
        promptSourceText: "Good morning, my friend.",
    },
    {
        ...baseTask,
        _id: "demo_task_2",
        campaignId: "demo_campaign_slang",
        taskType: "phrase_translation",
        languageCode: "sheng",
        domain: "everyday_conversation",
        difficulty: "beginner",
        promptSourceText: "See you later.",
    },
    {
        ...baseTask,
        _id: "demo_task_3",
        campaignId: "demo_campaign_slang",
        taskType: "phrase_translation",
        languageCode: "sheng",
        domain: "technology_finance",
        difficulty: "beginner",
        promptSourceText: "I'm broke, bro.",
    },
    {
        ...baseTask,
        _id: "demo_task_4",
        campaignId: "demo_campaign_slang",
        taskType: "lexicon_entry",
        languageCode: "sheng",
        domain: "other",
        difficulty: "intermediate",
        priority: "high",
        promptSourceText: "Slang for the police",
    },
    {
        ...baseTask,
        _id: "demo_task_5",
        campaignId: "demo_campaign_slang",
        taskType: "cultural_context",
        languageCode: "sheng",
        domain: "cultural_idioms",
        difficulty: "advanced",
        promptSourceText: "Explain what 'ushamba' means and when it is used.",
    },
    {
        ...baseTask,
        _id: "demo_task_6",
        campaignId: "demo_campaign_sw",
        taskType: "phrase_translation",
        languageCode: "sw",
        domain: "greeting",
        difficulty: "beginner",
        priority: "high",
        promptSourceText: "Good morning",
    },
    {
        ...baseTask,
        _id: "demo_task_7",
        campaignId: "demo_campaign_sw",
        taskType: "phrase_translation",
        languageCode: "sw",
        domain: "questions_commands",
        difficulty: "beginner",
        promptSourceText: "Where is the market?",
    },
    {
        ...baseTask,
        _id: "demo_task_8",
        campaignId: "demo_campaign_sw",
        taskType: "phrase_translation",
        languageCode: "sw",
        domain: "everyday_conversation",
        difficulty: "beginner",
        promptSourceText: "How is your family?",
    },
    {
        ...baseTask,
        _id: "demo_task_9",
        campaignId: "demo_campaign_ki",
        taskType: "lexicon_entry",
        languageCode: "ki",
        domain: "kinship",
        difficulty: "beginner",
        promptSourceText: "mother (noun)",
    },
    {
        ...baseTask,
        _id: "demo_task_10",
        campaignId: "demo_campaign_ki",
        taskType: "lexicon_entry",
        languageCode: "ki",
        domain: "weather",
        difficulty: "beginner",
        promptSourceText: "rain (noun)",
    },
] as const;

// ---------------------------------------------------------------------------
// Submissions (one per pipeline status, owned by demo contributors)
// ---------------------------------------------------------------------------

const baseSubmission = {
    dialectCode: undefined,
    regionCode: undefined,
    transcriptText: undefined,
    gloss: undefined,
    partOfSpeech: undefined,
    contextNote: undefined,
    speakerProfile: undefined,
    license: "community" as const,
    qualityFlags: [] as string[],
    autoChecks: { passed: true },
    revision: 1,
    withdrawnAt: undefined,
    curatedExampleId: undefined,
    documentEntryId: undefined,
};

const baseConsent = {
    isGranted: true,
    allowTraining: true,
    allowResearch: true,
    allowPublicAttribution: false,
    grantedAt: DEMO_NOW - 10 * DAY,
};

export const DEMO_SUBMISSIONS = [
    {
        ...baseSubmission,
        _id: "demo_sub_1",
        taskId: "demo_task_1",
        userId: DEMO_USERS.wanjiku._id,
        submissionType: "sentence_translation",
        languageCode: "sheng",
        sourceText: "Where are you going?",
        targetText: "Unakwenda wapi?",
        contextNote: "Common greeting-time question between friends.",
        consent: baseConsent,
        status: "curated",
        submittedAt: DEMO_NOW - 9 * DAY,
        updatedAt: DEMO_NOW - 8 * DAY,
    },
    {
        ...baseSubmission,
        _id: "demo_sub_2",
        taskId: "demo_task_1",
        userId: DEMO_USERS.otieno._id,
        submissionType: "sentence_translation",
        languageCode: "sheng",
        sourceText: "How are you doing?",
        targetText: "Mambo vipi?",
        consent: baseConsent,
        status: "validated",
        submittedAt: DEMO_NOW - 6 * DAY,
        updatedAt: DEMO_NOW - 5 * DAY,
    },
    {
        ...baseSubmission,
        _id: "demo_sub_3",
        taskId: "demo_task_2",
        userId: DEMO_USERS.amina._id,
        submissionType: "sentence_translation",
        languageCode: "sheng",
        sourceText: "The traffic is terrible today.",
        targetText: "Traffiki ni mbaya leo, ni shida.",
        consent: baseConsent,
        status: "in_validation",
        submittedAt: DEMO_NOW - 2 * DAY,
        updatedAt: DEMO_NOW - 2 * DAY,
    },
    {
        ...baseSubmission,
        _id: "demo_sub_4",
        taskId: "demo_task_6",
        userId: DEMO_USERS.wanjiku._id,
        submissionType: "phrase_translation",
        languageCode: "sw",
        sourceText: "Good morning",
        targetText: "Habari za asubuhi",
        consent: baseConsent,
        status: "in_validation",
        submittedAt: DEMO_NOW - 1 * DAY,
        updatedAt: DEMO_NOW - 1 * DAY,
    },
    {
        ...baseSubmission,
        _id: "demo_sub_5",
        taskId: "demo_task_4",
        userId: DEMO_USERS.otieno._id,
        submissionType: "lexicon_entry",
        languageCode: "sheng",
        sourceText: "Slang for the police",
        targetText: "karao",
        gloss: "the police",
        consent: baseConsent,
        status: "rejected",
        submittedAt: DEMO_NOW - 4 * DAY,
        updatedAt: DEMO_NOW - 3 * DAY,
    },
    {
        ...baseSubmission,
        _id: "demo_sub_6",
        taskId: "demo_task_3",
        userId: DEMO_USERS.wanjiku._id,
        submissionType: "phrase_translation",
        languageCode: "sheng",
        sourceText: "I'm broke, bro.",
        targetText: "Niko na zero, msee.",
        consent: baseConsent,
        status: "submitted",
        submittedAt: DEMO_NOW - 3 * HOUR,
        updatedAt: DEMO_NOW - 3 * HOUR,
    },
] as const;

// Curated examples (curation dashboard "release candidates").
export const DEMO_CURATED_EXAMPLES = [
    {
        _id: "demo_curated_1",
        sourceSubmissionId: "demo_sub_1",
        exampleType: "parallel_text",
        languageCode: "sheng",
        sourceText: "Where are you going?",
        targetText: "Unakwenda wapi?",
        contextText: "Common greeting-time question between friends.",
        qualityScore: 0.92,
        reviewSummary: "Natural Sheng phrasing; two peer accepts, no flags.",
        splitRecommendation: "train",
        releaseStatus: "candidate",
        createdAt: DEMO_NOW - 8 * DAY,
    },
    {
        _id: "demo_curated_2",
        sourceSubmissionId: "demo_sub_2",
        exampleType: "parallel_text",
        languageCode: "sheng",
        sourceText: "How are you doing?",
        targetText: "Mambo vipi?",
        contextText: undefined,
        qualityScore: 0.88,
        reviewSummary: "Widely used greeting.",
        splitRecommendation: "dev",
        releaseStatus: "candidate",
        createdAt: DEMO_NOW - 5 * DAY,
    },
] as const;

// ---------------------------------------------------------------------------
// Stats, profile, leaderboard, submission status
// ---------------------------------------------------------------------------

export const DEMO_USER_STATS = {
    userId: "demo_user_wanjiku",
    contributionCount: 6,
    validationCount: 14,
    acceptRate: 0.83,
    reviewAgreementRate: 0.71,
    trustScore: 104,
    streakDays: 7,
    lastActiveDate: new Date(DEMO_NOW).toISOString(),
    topLanguages: ["sheng", "sw"],
    badges: ["first_contribution", "week_streak"],
} as const;

export const DEMO_PROFILE = {
    _id: "demo_user_wanjiku",
    name: "Wanjiku Mwangi",
    avatar: "",
    role: "member",
    level: 3,
    xp: 145,
    isGuest: false,
} as const;

export function demoLanguageStats(languageCode: string) {
    const tasks = DEMO_TASKS.filter((t) => t.languageCode === languageCode).length;
    const submissions = DEMO_SUBMISSIONS.filter(
        (s) => s.languageCode === languageCode,
    ).length;
    const campaigns = DEMO_CAMPAIGNS.filter(
        (c) => c.languageCode === languageCode,
    ).length;
    return {
        languageCode,
        openTasks: tasks,
        submissions,
        curatedExamples: languageCode === "sheng" ? 2 : 0,
        activeCampaigns: campaigns,
    };
}

export const DEMO_LEADERBOARD = {
    campaign: DEMO_CAMPAIGNS[1],
    leaderboard: [
        { rank: 1, userId: DEMO_USERS.wanjiku._id, name: DEMO_USERS.wanjiku.name, avatar: "", submissionCount: 6 },
        { rank: 2, userId: DEMO_USERS.otieno._id, name: DEMO_USERS.otieno.name, avatar: "", submissionCount: 4 },
        { rank: 3, userId: DEMO_USERS.amina._id, name: DEMO_USERS.amina.name, avatar: "", submissionCount: 3 },
    ],
    totalContributions: DEMO_CAMPAIGNS[1].currentCount,
} as const;

export function demoSubmissionStatus(submissionId: string) {
    const submission = DEMO_SUBMISSIONS.find((s) => s._id === submissionId);
    const status =
        submission?.status === "validated" || submission?.status === "curated"
            ? "accepted"
            : submission?.status === "rejected"
              ? "rejected"
              : submission?.status === "in_validation"
                ? "in_review"
                : "received";
    const message =
        status === "accepted"
            ? "Your contribution was accepted and is eligible for training data."
            : status === "rejected"
              ? "This contribution could not be accepted."
              : status === "in_review"
                ? "Your contribution is being reviewed by the community."
                : "Your contribution was received and is being checked.";
    return {
        submissionId,
        status,
        message,
        retryReason: null,
        qualityFlags: [] as string[],
        autoChecks: { passed: true },
        processingRuns: [
            { processor: "basic_task_check", status: "completed" },
            { processor: "duplicate_detection", status: "completed" },
            { processor: "language_id", status: "queued" },
        ],
    };
}

export const DEMO_INVITE_CODE = "SAMI-DEMO42";

// Validation-queue rows carry the extra vote-count fields computed by
// `listValidationQueue` on top of the raw submission doc.
export const DEMO_VALIDATION_QUEUE = [
    {
        ...DEMO_SUBMISSIONS[2],
        voteCount: 1,
        acceptCount: 1,
        rejectCount: 0,
        hasCurrentUserVote: false,
        requiresModerator: false,
    },
    {
        ...DEMO_SUBMISSIONS[3],
        voteCount: 0,
        acceptCount: 0,
        rejectCount: 0,
        hasCurrentUserVote: false,
        requiresModerator: false,
    },
] as const;

// ---------------------------------------------------------------------------
// Badge catalog — mirrors `BADGE_CATALOG` in `convex/changa/badges.ts`
// (returned verbatim by `api.changa.badges.listBadges`).
// ---------------------------------------------------------------------------

export const DEMO_BADGES = [
    {
        id: "first_contribution",
        title: "First Step",
        description: "Submitted your first Changa contribution.",
        icon: "footprint",
        criterion: "contributionCount >= 1",
    },
    {
        id: "ten_contributions",
        title: "10 Contributions",
        description: "Contributed ten times to your language.",
        icon: "auto_awesome",
        criterion: "contributionCount >= 10",
    },
    {
        id: "audio_contributor",
        title: "Voice Carrier",
        description: "Recorded at least one audio reading.",
        icon: "mic",
        criterion: "any audio_reading submission",
    },
    {
        id: "rare_language_champion",
        title: "Rare Language Champion",
        description: "Contributed in a rare or endangered language.",
        icon: "language",
        criterion: "any submission with a rare language code",
    },
    {
        id: "streak_7",
        title: "Week-Long Streak",
        description: "Contributed seven days in a row.",
        icon: "local_fire_department",
        criterion: "streakDays >= 7",
    },
    {
        id: "streak_30",
        title: "30-Day Streak",
        description: "A whole month of daily contributions.",
        icon: "whatshot",
        criterion: "streakDays >= 30",
    },
    {
        id: "validator",
        title: "Validator",
        description: "Cast at least five validation votes.",
        icon: "fact_check",
        criterion: "validationCount >= 5",
    },
    {
        id: "language_master",
        title: "Language Master",
        description: "Reached the highest Changa level.",
        icon: "workspace_premium",
        criterion: "level >= 10",
    },
] as const;

// Badges the demo user has already earned, so the Changa profile surfaces
// show a partly-complete award state instead of an all-empty badge shelf.
export const DEMO_EARNED_BADGE_IDS = [
    "first_contribution",
    "audio_contributor",
    "streak_7",
] as const;




