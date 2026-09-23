/**
 * TEMPORARY Changa e2e fixtures — NOT for production, NOT for committing.
 *
 * Hard-coded values only (no Convex/DB writes). Field names mirror
 * `convex/schema.ts`; grouped blocks also mirror the computed shapes returned
 * by the `convex/changa/*` queries so they can be dropped behind the
 * `useChangaQuery` fallback resolvers in `src/hooks/useChangaData.ts`.
 *
 * This folder is excluded from the app's `tsconfig.json` `include`, so nothing
 * here can affect the Next.js build, and Playwright only test-matches
 * `*.spec.ts`, so this module is inert unless a spec imports it.
 *
 * Language codes follow the Changa convention already used across the section:
 * `sheng`, `sw` (Kiswahili), `ki` (Kikuyu), `luo` (Dholuo), `yo` (Yoruba),
 * `ig` (Igbo), plus rare-language names for the XP multiplier path.
 */

export const T_NOW = Date.UTC(2026, 8, 16, 9, 0, 0); // 2026-09-16T09:00:00Z
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

// ---------------------------------------------------------------------------
// USERS  (contributors + edge cases: brand-new, max-level, rare-language,
//        no-stats-row, orphaned submission)
// ---------------------------------------------------------------------------

export const CHANGA_TEST_USERS = {
    // EDGE: regular trusted contributor (rich stats, streak 7)
    wanjiku: { _id: "t_user_wanjiku", name: "Wanjiku Mwangi", avatar: "", role: "member", level: 3, xp: 145, primaryLanguage: "sheng" },
    // EDGE: mid-tier contributor
    otieno: { _id: "t_user_otieno", name: "Otieno Ochieng", avatar: "", role: "member", level: 2, xp: 88, primaryLanguage: "sw" },
    // EDGE: brand-new contributor — 0 XP, no badges, no stats rows
    amina: { _id: "t_user_amina", name: "Amina Hassan", avatar: "", role: "member", level: 1, xp: 0, primaryLanguage: "sw" },
    // EDGE: moderator — drives the `requiresModerator` lane in listValidationQueue
    njeri: { _id: "t_user_njeri", name: "Njeri Kamau", avatar: "", role: "moderator", level: 7, xp: 820, primaryLanguage: "ki" },
    // EDGE: max level (10) + rare language `El Molo` -> 1.5x XP + rare_language_champion
    kevin: { _id: "t_user_kevin", name: "Kevin Ekiru", avatar: "", role: "member", level: 10, xp: 2600, primaryLanguage: "El Molo" },
    // EDGE: has XP on the legacy `users` row but NO `changaUserStats` row
    ghost: { _id: "t_user_ghost", name: "Test Ghost", avatar: "", role: "member", level: 1, xp: 5, primaryLanguage: "sheng" },
    // EDGE: signed-out viewer (guest). Server-side `getCurrentUser` returns null,
    // so every changa query must resolve to its empty/unauthorized shape.
    guest: null,
} as const;

// ---------------------------------------------------------------------------
// CAMPAIGNS  ->  listActiveCampaigns / listEndedCampaigns / getCampaignLeaderboard
// ---------------------------------------------------------------------------

const campaignBase = { startAt: T_NOW - 21 * DAY, createdBy: CHANGA_TEST_USERS.njeri._id, createdAt: T_NOW - 21 * DAY };

export const CHANGA_TEST_CAMPAIGNS = [
    { ...campaignBase, _id: "t_campaign_sheng", title: "Collect 500 Sheng Sentences", description: "Help build the first high-quality Sheng translation dataset.", languageCode: "sheng", taskTypes: ["sentence_translation", "audio_reading"], goalCount: 500, currentCount: 187, status: "active", rewardProfile: { baseXp: 8, bonusXp: 4, streakMultiplier: 1.2 } },
    { ...campaignBase, _id: "t_campaign_sw", title: "Kiswahili Phrase Harvest", description: "Collect everyday Kiswahili phrases and their translations.", languageCode: "sw", taskTypes: ["phrase_translation", "lexicon_entry"], goalCount: 1000, currentCount: 412, status: "active" },
    // EDGE: goal met exactly -> progress must clamp to 100%, never 101%
    { ...campaignBase, _id: "t_campaign_ki", title: "Kikuyu Lexicon Sprint", description: "Build the first community-reviewed Gikuyu word list.", languageCode: "ki", taskTypes: ["lexicon_entry"], goalCount: 300, currentCount: 300, status: "active" },
    // EDGE: over-goal -> progress must clamp, not overflow the bar
    { ...campaignBase, _id: "t_campaign_luo", title: "Dholuo Stories on Record", description: "Record short Dholuo stories in your natural voice.", languageCode: "luo", taskTypes: ["transcription", "audio_reading"], goalCount: 200, currentCount: 214, status: "active" },
    // EDGE: no languageCode -> multi-language campaign (must still show under "All")
    { ...campaignBase, _id: "t_campaign_multi", title: "Cross-Language Proverbs", description: "Share proverbs that exist in more than one Kenyan language.", taskTypes: ["cultural_context", "dialect_mapping"], goalCount: 150, currentCount: 12, status: "active" },
    // EDGE: goalCount 0 -> division-by-zero guard in the progress helper
    { ...campaignBase, _id: "t_campaign_zero", title: "Open-ended Sheng Sprints", description: "No fixed goal; keep the slang list fresh.", languageCode: "sheng", taskTypes: ["lexicon_entry"], goalCount: 0, currentCount: 47, status: "paused" },
    // EDGE: empty taskTypes array (allowed by the validator)
    { ...campaignBase, _id: "t_campaign_empty", title: "Placeholder Campaign", description: "Task types not yet configured.", languageCode: "sw", taskTypes: [], goalCount: 50, currentCount: 0, status: "active" },
    // EDGE: `active` but endAt already passed -> still returned by listActiveCampaigns
    { ...campaignBase, _id: "t_campaign_expired", title: "Sheng Slang of the Week (past)", description: "Weekly sprint that has already ended.", languageCode: "sheng", taskTypes: ["lexicon_entry", "cultural_context"], goalCount: 50, currentCount: 47, endAt: T_NOW - 3 * DAY, status: "active" },
    { ...campaignBase, _id: "t_campaign_completed", title: "Kamba Counting Words", description: "Numbers and counting in Kikamba.", languageCode: "kamba", taskTypes: ["lexicon_entry"], goalCount: 120, currentCount: 120, endAt: T_NOW - 2 * DAY, status: "completed" },
    { ...campaignBase, _id: "t_campaign_draft", title: "Somali Greetings (draft)", description: "Not published yet — must not appear in active lists.", languageCode: "somali", taskTypes: ["phrase_translation"], goalCount: 80, currentCount: 0, status: "draft" },
    { ...campaignBase, _id: "t_campaign_archived", title: "Old Yoruba Pilot", description: "Archived pilot campaign.", languageCode: "yo", taskTypes: ["phrase_translation"], goalCount: 100, currentCount: 100, endAt: T_NOW - 40 * DAY, status: "archived" },
];

// changaCampaignProposals -> listCampaignProposals / reviewCampaignProposal
export const CHANGA_TEST_CAMPAIGN_PROPOSALS = [
    { _id: "t_proposal_pending", title: "Igbo Market Words", description: "Collect market vocabulary from Igbo traders.", languageCode: "ig", taskTypes: ["lexicon_entry"], goalCount: 200, rationale: "Igbo traders code-switch heavily; market terms are missing from our lexicon.", status: "pending", proposedBy: CHANGA_TEST_USERS.wanjiku._id, createdAt: T_NOW - 2 * DAY },
    { _id: "t_proposal_approved", title: "Luhya Greetings", description: "Everyday Luhya greetings.", languageCode: "luhya", taskTypes: ["phrase_translation"], goalCount: 150, status: "approved", proposedBy: CHANGA_TEST_USERS.otieno._id, reviewedBy: CHANGA_TEST_USERS.njeri._id, reviewedAt: T_NOW - 5 * DAY, reviewNote: "Approved as-is.", createdAt: T_NOW - 7 * DAY },
    { _id: "t_proposal_adapted", title: "Kalenjin Weather Sayings", description: "Weather proverbs.", languageCode: "kalenjin", taskTypes: ["cultural_context"], goalCount: 400, rationale: "Oral weather knowledge is at risk.", status: "adapted", proposedBy: CHANGA_TEST_USERS.amina._id, reviewedBy: CHANGA_TEST_USERS.njeri._id, reviewedAt: T_NOW - 4 * DAY, reviewNote: "Goal reduced to 120 to match reviewer capacity.", createdAt: T_NOW - 6 * DAY },
    // EDGE: rejected proposal (visible to its author, hidden from everyone else)
    { _id: "t_proposal_rejected", title: "Duplicate Sheng List", description: "Another Sheng slang list.", languageCode: "sheng", taskTypes: ["lexicon_entry"], goalCount: 500, status: "rejected", proposedBy: CHANGA_TEST_USERS.otieno._id, reviewedBy: CHANGA_TEST_USERS.njeri._id, reviewedAt: T_NOW - 3 * DAY, reviewNote: "Overlaps an active campaign. Please merge instead.", createdAt: T_NOW - 4 * DAY },
];

// ---------------------------------------------------------------------------
// TASKS  ->  listAvailableTasks / getTask / getActiveTaskClaim
// All 8 task types, all 4 statuses, all 4 priorities, 3 difficulties,
// campaign-linked + standalone + challenge-linked, plus the expiry filter.
// ---------------------------------------------------------------------------

const taskBase = { templateVersion: 1, status: "open", targetSubmissionCount: 5, targetValidationCount: 2, priority: "normal", createdBy: CHANGA_TEST_USERS.njeri._id, createdAt: T_NOW - 2 * DAY };

export const CHANGA_TEST_TASKS = [
    { ...taskBase, _id: "t_task_sheng_phrase_1", campaignId: "t_campaign_sheng", taskType: "phrase_translation", languageCode: "sheng", domain: "everyday_conversation", difficulty: "beginner", priority: "high", promptSourceText: "Good morning, my friend." },
    { ...taskBase, _id: "t_task_sheng_phrase_2", campaignId: "t_campaign_sheng", taskType: "phrase_translation", languageCode: "sheng", domain: "everyday_conversation", difficulty: "beginner", promptSourceText: "See you later." },
    { ...taskBase, _id: "t_task_sheng_phrase_3", campaignId: "t_campaign_sheng", taskType: "phrase_translation", languageCode: "sheng", domain: "technology_finance", difficulty: "beginner", promptSourceText: "I'm broke, bro." },
    { ...taskBase, _id: "t_task_sheng_lex", campaignId: "t_campaign_zero", taskType: "lexicon_entry", languageCode: "sheng", domain: "other", difficulty: "intermediate", priority: "high", promptSourceText: "Slang for the police" },
    { ...taskBase, _id: "t_task_sheng_culture", campaignId: "t_campaign_multi", taskType: "cultural_context", languageCode: "sheng", domain: "cultural_idioms", difficulty: "advanced", promptSourceText: "Explain what 'ushamba' means and when it is used." },
    { ...taskBase, _id: "t_task_sheng_sentence", campaignId: "t_campaign_sheng", taskType: "sentence_translation", languageCode: "sheng", domain: "emotional_social", difficulty: "intermediate", priority: "high", promptSourceText: "He was so happy he cried." },
    // EDGE: audio task -> needs a real capture before submit is allowed
    { ...taskBase, _id: "t_task_sheng_audio", campaignId: "t_campaign_sheng", taskType: "audio_reading", languageCode: "sheng", domain: "story", difficulty: "beginner", priority: "high", promptSourceText: "Read this Sheng sentence aloud in your natural voice.", promptAudioAssetId: "t_asset_prompt_ref_sheng_1" },
    { ...taskBase, _id: "t_task_sw_phrase", campaignId: "t_campaign_sw", taskType: "phrase_translation", languageCode: "sw", domain: "greeting", difficulty: "beginner", priority: "high", promptSourceText: "Good morning" },
    // EDGE: custom prompt fields (select + checkbox) instead of one prompt string
    { ...taskBase, _id: "t_task_sw_lex", campaignId: "t_campaign_sw", taskType: "lexicon_entry", languageCode: "sw", domain: "kinship", difficulty: "beginner", promptSourceText: "grandmother (noun)", promptFields: [
        { id: "word", label: "Word", inputType: "text", required: true },
        { id: "pos", label: "Part of speech", inputType: "select", required: true, options: ["noun", "verb", "adjective", "adverb"] },
        { id: "is_loanword", label: "Borrowed from another language?", inputType: "checkbox", required: false },
    ] },
    { ...taskBase, _id: "t_task_ki_lex", campaignId: "t_campaign_ki", taskType: "lexicon_entry", languageCode: "ki", domain: "kinship", difficulty: "beginner", promptSourceText: "mother (noun)" },
    { ...taskBase, _id: "t_task_ki_lex_rain", campaignId: "t_campaign_ki", taskType: "lexicon_entry", languageCode: "ki", domain: "weather", difficulty: "beginner", promptSourceText: "rain (noun)" },
    // EDGE: dialect/region-scoped task (exact-match filter in listAvailableTasks)
    { ...taskBase, _id: "t_task_ki_dialect", campaignId: "t_campaign_multi", taskType: "dialect_mapping", languageCode: "ki", dialectCode: "mugikuyu", regionCode: "nyeri", domain: "place", difficulty: "advanced", promptSourceText: "How is 'Nyeri' pronounced in your dialect?" },
    { ...taskBase, _id: "t_task_luo_transcription", campaignId: "t_campaign_luo", taskType: "transcription", languageCode: "luo", domain: "story", difficulty: "intermediate", priority: "high", promptSourceText: "Transcribe the Dholuo audio clip attached to this task.", promptAudioAssetId: "t_asset_prompt_ref_luo_1" },
    { ...taskBase, _id: "t_task_luo_audio", campaignId: "t_campaign_luo", taskType: "audio_reading", languageCode: "luo", domain: "everyday_conversation", difficulty: "beginner", promptSourceText: "Read this Dholuo greeting aloud." },
    // EDGE: `validation` is a first-class task type (gold-task seeding path)
    { ...taskBase, _id: "t_task_validation_gold", taskType: "validation", languageCode: "sheng", domain: "other", difficulty: "beginner", promptSourceText: "Is this Sheng phrase natural? Rate 1-5.", promptFields: [
        { id: "naturalness", label: "Naturalness (1-5)", inputType: "select", required: true, options: ["1", "2", "3", "4", "5"] },
        { id: "variant", label: "Language variety", inputType: "select", required: true, options: ["Sheng", "Swahili", "English", "Mixed"] },
    ] },
    // EDGE: rare language + critical priority -> must sort to the top of the task hub
    { ...taskBase, _id: "t_task_rare_elmo", taskType: "lexicon_entry", languageCode: "El Molo", domain: "food", difficulty: "advanced", priority: "critical", promptSourceText: "fish (noun) — El Molo" },
    // EDGE: Yoruba (present in the campaign language filter chips)
    { ...taskBase, _id: "t_task_yo_phrase", taskType: "phrase_translation", languageCode: "yo", domain: "greeting", difficulty: "beginner", promptSourceText: "Welcome" },
    // EDGE: `low` priority + `intermediate` -> must sort last
    { ...taskBase, _id: "t_task_ig_lowpri", taskType: "phrase_translation", languageCode: "ig", domain: "questions_commands", difficulty: "intermediate", priority: "low", promptSourceText: "Where are you going?" },
    // EDGE: no capacity left -> progress bar at 100%, claim must be refused
    { ...taskBase, _id: "t_task_full", taskType: "phrase_translation", languageCode: "sheng", domain: "greeting", difficulty: "beginner", status: "full", targetSubmissionCount: 3 },
    // EDGE: paused/closed tasks must NEVER appear in listAvailableTasks
    { ...taskBase, _id: "t_task_paused", taskType: "phrase_translation", languageCode: "sheng", domain: "greeting", difficulty: "beginner", status: "paused" },
    { ...taskBase, _id: "t_task_closed", taskType: "lexicon_entry", languageCode: "sw", domain: "numbers", difficulty: "beginner", status: "closed" },
    // EDGE: status still `open` but expiresAt is in the past -> filtered out
    { ...taskBase, _id: "t_task_expired", taskType: "phrase_translation", languageCode: "sheng", domain: "time", difficulty: "beginner", expiresAt: T_NOW - 2 * DAY },
    // EDGE: targetSubmissionCount 0 -> no submissions wanted (UI must not divide by zero)
    { ...taskBase, _id: "t_task_zerotarget", taskType: "lexicon_entry", languageCode: "sw", domain: "body", difficulty: "beginner", targetSubmissionCount: 0 },
    // EDGE: attached to a community Challenge instead of a campaign
    { ...taskBase, _id: "t_task_challenge", challengeId: "t_challenge_demo_1", taskType: "cultural_context", languageCode: "sheng", domain: "ritual", difficulty: "intermediate", promptSourceText: "Describe a naming ceremony in Sheng." },
];

// changaTaskClaims -> getActiveTaskClaim / releaseTaskClaim / skipTask
export const CHANGA_TEST_TASK_CLAIMS = [
    { _id: "t_claim_active", taskId: "t_task_sheng_phrase_2", userId: CHANGA_TEST_USERS.wanjiku._id, status: "active", claimedAt: T_NOW - 1 * DAY, expiresAt: T_NOW + 1 * HOUR },
    // EDGE: `active` but the deadline passed -> getActiveTaskClaim must return null
    { _id: "t_claim_stale", taskId: "t_task_sheng_phrase_3", userId: CHANGA_TEST_USERS.otieno._id, status: "active", claimedAt: T_NOW - 2 * DAY, expiresAt: T_NOW - 1 * HOUR },
    // EDGE: released claim carries a skipReason
    { _id: "t_claim_released", taskId: "t_task_sw_phrase", userId: CHANGA_TEST_USERS.amina._id, status: "released", claimedAt: T_NOW - 3 * DAY, expiresAt: T_NOW - 3 * DAY + 2 * HOUR, skipReason: "not_my_dialect" },
    // EDGE: submitted claim is linked back to its submission
    { _id: "t_claim_submitted", taskId: "t_task_sheng_lex", userId: CHANGA_TEST_USERS.kevin._id, status: "submitted", claimedAt: T_NOW - 4 * DAY, expiresAt: T_NOW - 4 * DAY + 2 * HOUR, submissionId: "t_sub_s09" },
    // EDGE: expired claim (deadline passed while still unsubmitted)
    { _id: "t_claim_expired", taskId: "t_task_ki_lex", userId: CHANGA_TEST_USERS.njeri._id, status: "expired", claimedAt: T_NOW - 6 * DAY, expiresAt: T_NOW - 5 * DAY },
];
