/**
 * TEMPORARY Changa e2e fixtures — NOT for production, NOT for committing.
 *
 * Hard-coded values only (no Convex/DB writes). Field names mirror
 * `convex/schema.ts`; grouped blocks also mirror the computed shapes returned
 * by the `convex/changa/*` queries so they can be dropped behind the
 * `useChangaQuery` fallback resolvers in `src/hooks/useChangaData.ts`.
 *
 * Consumed by the dev-only fallback in `src/hooks/useChangaData.ts` — never in
 * production (`changaFallbackAllowed` is false there). `e2e/fixtures/` holds a
 * re-export shim so specs and the fallback share one source of truth.
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
  wanjiku: {
    _id: 't_user_wanjiku',
    name: 'Wanjiku Mwangi',
    avatar: '',
    role: 'member',
    level: 3,
    xp: 145,
    primaryLanguage: 'sheng',
  },
  // EDGE: mid-tier contributor
  otieno: {
    _id: 't_user_otieno',
    name: 'Otieno Ochieng',
    avatar: '',
    role: 'member',
    level: 2,
    xp: 88,
    primaryLanguage: 'sw',
  },
  // EDGE: brand-new contributor — 0 XP, no badges, no stats rows
  amina: {
    _id: 't_user_amina',
    name: 'Amina Hassan',
    avatar: '',
    role: 'member',
    level: 1,
    xp: 0,
    primaryLanguage: 'sw',
  },
  // EDGE: moderator — drives the `requiresModerator` lane in listValidationQueue
  njeri: {
    _id: 't_user_njeri',
    name: 'Njeri Kamau',
    avatar: '',
    role: 'moderator',
    level: 7,
    xp: 820,
    primaryLanguage: 'ki',
  },
  // EDGE: max level (10) + rare language `El Molo` -> 1.5x XP + rare_language_champion
  kevin: {
    _id: 't_user_kevin',
    name: 'Kevin Ekiru',
    avatar: '',
    role: 'member',
    level: 10,
    xp: 2600,
    primaryLanguage: 'El Molo',
  },
  // EDGE: has XP on the legacy `users` row but NO `changaUserStats` row
  ghost: {
    _id: 't_user_ghost',
    name: 'Test Ghost',
    avatar: '',
    role: 'member',
    level: 1,
    xp: 5,
    primaryLanguage: 'sheng',
  },
  // EDGE: signed-out viewer (guest). Server-side `getCurrentUser` returns null,
  // so every changa query must resolve to its empty/unauthorized shape.
  guest: null,
} as const;

// ---------------------------------------------------------------------------
// CAMPAIGNS  ->  listActiveCampaigns / listEndedCampaigns / getCampaignLeaderboard
// ---------------------------------------------------------------------------

const campaignBase = {
  startAt: T_NOW - 21 * DAY,
  createdBy: CHANGA_TEST_USERS.njeri._id,
  createdAt: T_NOW - 21 * DAY,
};

export const CHANGA_TEST_CAMPAIGNS = [
  {
    ...campaignBase,
    _id: 't_campaign_sheng',
    title: 'Collect 500 Sheng Sentences',
    description: 'Help build the first high-quality Sheng translation dataset.',
    languageCode: 'sheng',
    taskTypes: ['sentence_translation', 'audio_reading'],
    goalCount: 500,
    currentCount: 187,
    status: 'active',
    rewardProfile: { baseXp: 8, bonusXp: 4, streakMultiplier: 1.2 },
  },
  {
    ...campaignBase,
    _id: 't_campaign_sw',
    title: 'Kiswahili Phrase Harvest',
    description: 'Collect everyday Kiswahili phrases and their translations.',
    languageCode: 'sw',
    taskTypes: ['phrase_translation', 'lexicon_entry'],
    goalCount: 1000,
    currentCount: 412,
    status: 'active',
  },
  // EDGE: goal met exactly -> progress must clamp to 100%, never 101%
  {
    ...campaignBase,
    _id: 't_campaign_ki',
    title: 'Kikuyu Lexicon Sprint',
    description: 'Build the first community-reviewed Gikuyu word list.',
    languageCode: 'ki',
    taskTypes: ['lexicon_entry'],
    goalCount: 300,
    currentCount: 300,
    status: 'active',
  },
  // EDGE: over-goal -> progress must clamp, not overflow the bar
  {
    ...campaignBase,
    _id: 't_campaign_luo',
    title: 'Dholuo Stories on Record',
    description: 'Record short Dholuo stories in your natural voice.',
    languageCode: 'luo',
    taskTypes: ['transcription', 'audio_reading'],
    goalCount: 200,
    currentCount: 214,
    status: 'active',
  },
  // EDGE: no languageCode -> multi-language campaign (must still show under "All")
  {
    ...campaignBase,
    _id: 't_campaign_multi',
    title: 'Cross-Language Proverbs',
    description: 'Share proverbs that exist in more than one Kenyan language.',
    taskTypes: ['cultural_context', 'dialect_mapping'],
    goalCount: 150,
    currentCount: 12,
    status: 'active',
  },
  // EDGE: goalCount 0 -> division-by-zero guard in the progress helper
  {
    ...campaignBase,
    _id: 't_campaign_zero',
    title: 'Open-ended Sheng Sprints',
    description: 'No fixed goal; keep the slang list fresh.',
    languageCode: 'sheng',
    taskTypes: ['lexicon_entry'],
    goalCount: 0,
    currentCount: 47,
    status: 'paused',
  },
  // EDGE: empty taskTypes array (allowed by the validator)
  {
    ...campaignBase,
    _id: 't_campaign_empty',
    title: 'Placeholder Campaign',
    description: 'Task types not yet configured.',
    languageCode: 'sw',
    taskTypes: [],
    goalCount: 50,
    currentCount: 0,
    status: 'active',
  },
  // EDGE: `active` but endAt already passed -> still returned by listActiveCampaigns
  {
    ...campaignBase,
    _id: 't_campaign_expired',
    title: 'Sheng Slang of the Week (past)',
    description: 'Weekly sprint that has already ended.',
    languageCode: 'sheng',
    taskTypes: ['lexicon_entry', 'cultural_context'],
    goalCount: 50,
    currentCount: 47,
    endAt: T_NOW - 3 * DAY,
    status: 'active',
  },
  {
    ...campaignBase,
    _id: 't_campaign_completed',
    title: 'Kamba Counting Words',
    description: 'Numbers and counting in Kikamba.',
    languageCode: 'kamba',
    taskTypes: ['lexicon_entry'],
    goalCount: 120,
    currentCount: 120,
    endAt: T_NOW - 2 * DAY,
    status: 'completed',
  },
  {
    ...campaignBase,
    _id: 't_campaign_draft',
    title: 'Somali Greetings (draft)',
    description: 'Not published yet — must not appear in active lists.',
    languageCode: 'somali',
    taskTypes: ['phrase_translation'],
    goalCount: 80,
    currentCount: 0,
    status: 'draft',
  },
  {
    ...campaignBase,
    _id: 't_campaign_archived',
    title: 'Old Yoruba Pilot',
    description: 'Archived pilot campaign.',
    languageCode: 'yo',
    taskTypes: ['phrase_translation'],
    goalCount: 100,
    currentCount: 100,
    endAt: T_NOW - 40 * DAY,
    status: 'archived',
  },
];

// changaCampaignProposals -> listCampaignProposals / reviewCampaignProposal
export const CHANGA_TEST_CAMPAIGN_PROPOSALS = [
  {
    _id: 't_proposal_pending',
    title: 'Igbo Market Words',
    description: 'Collect market vocabulary from Igbo traders.',
    languageCode: 'ig',
    taskTypes: ['lexicon_entry'],
    goalCount: 200,
    rationale: 'Igbo traders code-switch heavily; market terms are missing from our lexicon.',
    status: 'pending',
    proposedBy: CHANGA_TEST_USERS.wanjiku._id,
    createdAt: T_NOW - 2 * DAY,
  },
  {
    _id: 't_proposal_approved',
    title: 'Luhya Greetings',
    description: 'Everyday Luhya greetings.',
    languageCode: 'luhya',
    taskTypes: ['phrase_translation'],
    goalCount: 150,
    status: 'approved',
    proposedBy: CHANGA_TEST_USERS.otieno._id,
    reviewedBy: CHANGA_TEST_USERS.njeri._id,
    reviewedAt: T_NOW - 5 * DAY,
    reviewNote: 'Approved as-is.',
    createdAt: T_NOW - 7 * DAY,
  },
  {
    _id: 't_proposal_adapted',
    title: 'Kalenjin Weather Sayings',
    description: 'Weather proverbs.',
    languageCode: 'kalenjin',
    taskTypes: ['cultural_context'],
    goalCount: 400,
    rationale: 'Oral weather knowledge is at risk.',
    status: 'adapted',
    proposedBy: CHANGA_TEST_USERS.amina._id,
    reviewedBy: CHANGA_TEST_USERS.njeri._id,
    reviewedAt: T_NOW - 4 * DAY,
    reviewNote: 'Goal reduced to 120 to match reviewer capacity.',
    createdAt: T_NOW - 6 * DAY,
  },
  // EDGE: rejected proposal (visible to its author, hidden from everyone else)
  {
    _id: 't_proposal_rejected',
    title: 'Duplicate Sheng List',
    description: 'Another Sheng slang list.',
    languageCode: 'sheng',
    taskTypes: ['lexicon_entry'],
    goalCount: 500,
    status: 'rejected',
    proposedBy: CHANGA_TEST_USERS.otieno._id,
    reviewedBy: CHANGA_TEST_USERS.njeri._id,
    reviewedAt: T_NOW - 3 * DAY,
    reviewNote: 'Overlaps an active campaign. Please merge instead.',
    createdAt: T_NOW - 4 * DAY,
  },
];

// ---------------------------------------------------------------------------
// TASKS  ->  listAvailableTasks / getTask / getActiveTaskClaim
// All 8 task types, all 4 statuses, all 4 priorities, 3 difficulties,
// campaign-linked + standalone + challenge-linked, plus the expiry filter.
// ---------------------------------------------------------------------------

const taskBase = {
  templateVersion: 1,
  status: 'open',
  targetSubmissionCount: 5,
  targetValidationCount: 2,
  priority: 'normal',
  createdBy: CHANGA_TEST_USERS.njeri._id,
  createdAt: T_NOW - 2 * DAY,
};

export const CHANGA_TEST_TASKS = [
  {
    ...taskBase,
    _id: 't_task_sheng_phrase_1',
    campaignId: 't_campaign_sheng',
    taskType: 'phrase_translation',
    languageCode: 'sheng',
    domain: 'everyday_conversation',
    difficulty: 'beginner',
    priority: 'high',
    promptSourceText: 'Good morning, my friend.',
  },
  {
    ...taskBase,
    _id: 't_task_sheng_phrase_2',
    campaignId: 't_campaign_sheng',
    taskType: 'phrase_translation',
    languageCode: 'sheng',
    domain: 'everyday_conversation',
    difficulty: 'beginner',
    promptSourceText: 'See you later.',
  },
  {
    ...taskBase,
    _id: 't_task_sheng_phrase_3',
    campaignId: 't_campaign_sheng',
    taskType: 'phrase_translation',
    languageCode: 'sheng',
    domain: 'technology_finance',
    difficulty: 'beginner',
    promptSourceText: "I'm broke, bro.",
  },
  {
    ...taskBase,
    _id: 't_task_sheng_lex',
    campaignId: 't_campaign_zero',
    taskType: 'lexicon_entry',
    languageCode: 'sheng',
    domain: 'other',
    difficulty: 'intermediate',
    priority: 'high',
    promptSourceText: 'Slang for the police',
  },
  {
    ...taskBase,
    _id: 't_task_sheng_culture',
    campaignId: 't_campaign_multi',
    taskType: 'cultural_context',
    languageCode: 'sheng',
    domain: 'cultural_idioms',
    difficulty: 'advanced',
    promptSourceText: "Explain what 'ushamba' means and when it is used.",
  },
  {
    ...taskBase,
    _id: 't_task_sheng_sentence',
    campaignId: 't_campaign_sheng',
    taskType: 'sentence_translation',
    languageCode: 'sheng',
    domain: 'emotional_social',
    difficulty: 'intermediate',
    priority: 'high',
    promptSourceText: 'He was so happy he cried.',
  },
  // EDGE: audio task -> needs a real capture before submit is allowed
  {
    ...taskBase,
    _id: 't_task_sheng_audio',
    campaignId: 't_campaign_sheng',
    taskType: 'audio_reading',
    languageCode: 'sheng',
    domain: 'story',
    difficulty: 'beginner',
    priority: 'high',
    promptSourceText: 'Read this Sheng sentence aloud in your natural voice.',
    promptAudioAssetId: 't_asset_prompt_ref_sheng_1',
  },
  {
    ...taskBase,
    _id: 't_task_sw_phrase',
    campaignId: 't_campaign_sw',
    taskType: 'phrase_translation',
    languageCode: 'sw',
    domain: 'greeting',
    difficulty: 'beginner',
    priority: 'high',
    promptSourceText: 'Good morning',
  },
  // EDGE: custom prompt fields (select + checkbox) instead of one prompt string
  {
    ...taskBase,
    _id: 't_task_sw_lex',
    campaignId: 't_campaign_sw',
    taskType: 'lexicon_entry',
    languageCode: 'sw',
    domain: 'kinship',
    difficulty: 'beginner',
    promptSourceText: 'grandmother (noun)',
    promptFields: [
      { id: 'word', label: 'Word', inputType: 'text', required: true },
      {
        id: 'pos',
        label: 'Part of speech',
        inputType: 'select',
        required: true,
        options: ['noun', 'verb', 'adjective', 'adverb'],
      },
      {
        id: 'is_loanword',
        label: 'Borrowed from another language?',
        inputType: 'checkbox',
        required: false,
      },
    ],
  },
  {
    ...taskBase,
    _id: 't_task_ki_lex',
    campaignId: 't_campaign_ki',
    taskType: 'lexicon_entry',
    languageCode: 'ki',
    domain: 'kinship',
    difficulty: 'beginner',
    promptSourceText: 'mother (noun)',
  },
  {
    ...taskBase,
    _id: 't_task_ki_lex_rain',
    campaignId: 't_campaign_ki',
    taskType: 'lexicon_entry',
    languageCode: 'ki',
    domain: 'weather',
    difficulty: 'beginner',
    promptSourceText: 'rain (noun)',
  },
  // EDGE: dialect/region-scoped task (exact-match filter in listAvailableTasks)
  {
    ...taskBase,
    _id: 't_task_ki_dialect',
    campaignId: 't_campaign_multi',
    taskType: 'dialect_mapping',
    languageCode: 'ki',
    dialectCode: 'mugikuyu',
    regionCode: 'nyeri',
    domain: 'place',
    difficulty: 'advanced',
    promptSourceText: "How is 'Nyeri' pronounced in your dialect?",
  },
  {
    ...taskBase,
    _id: 't_task_luo_transcription',
    campaignId: 't_campaign_luo',
    taskType: 'transcription',
    languageCode: 'luo',
    domain: 'story',
    difficulty: 'intermediate',
    priority: 'high',
    promptSourceText: 'Transcribe the Dholuo audio clip attached to this task.',
    promptAudioAssetId: 't_asset_prompt_ref_luo_1',
  },
  {
    ...taskBase,
    _id: 't_task_luo_audio',
    campaignId: 't_campaign_luo',
    taskType: 'audio_reading',
    languageCode: 'luo',
    domain: 'everyday_conversation',
    difficulty: 'beginner',
    promptSourceText: 'Read this Dholuo greeting aloud.',
  },
  // EDGE: `validation` is a first-class task type (gold-task seeding path)
  {
    ...taskBase,
    _id: 't_task_validation_gold',
    taskType: 'validation',
    languageCode: 'sheng',
    domain: 'other',
    difficulty: 'beginner',
    promptSourceText: 'Is this Sheng phrase natural? Rate 1-5.',
    promptFields: [
      {
        id: 'naturalness',
        label: 'Naturalness (1-5)',
        inputType: 'select',
        required: true,
        options: ['1', '2', '3', '4', '5'],
      },
      {
        id: 'variant',
        label: 'Language variety',
        inputType: 'select',
        required: true,
        options: ['Sheng', 'Swahili', 'English', 'Mixed'],
      },
    ],
  },
  // EDGE: rare language + critical priority -> must sort to the top of the task hub
  {
    ...taskBase,
    _id: 't_task_rare_elmo',
    taskType: 'lexicon_entry',
    languageCode: 'El Molo',
    domain: 'food',
    difficulty: 'advanced',
    priority: 'critical',
    promptSourceText: 'fish (noun) — El Molo',
  },
  // EDGE: Yoruba (present in the campaign language filter chips)
  {
    ...taskBase,
    _id: 't_task_yo_phrase',
    taskType: 'phrase_translation',
    languageCode: 'yo',
    domain: 'greeting',
    difficulty: 'beginner',
    promptSourceText: 'Welcome',
  },
  // EDGE: `low` priority + `intermediate` -> must sort last
  {
    ...taskBase,
    _id: 't_task_ig_lowpri',
    taskType: 'phrase_translation',
    languageCode: 'ig',
    domain: 'questions_commands',
    difficulty: 'intermediate',
    priority: 'low',
    promptSourceText: 'Where are you going?',
  },
  // EDGE: no capacity left -> progress bar at 100%, claim must be refused
  {
    ...taskBase,
    _id: 't_task_full',
    taskType: 'phrase_translation',
    languageCode: 'sheng',
    domain: 'greeting',
    difficulty: 'beginner',
    status: 'full',
    targetSubmissionCount: 3,
  },
  // EDGE: paused/closed tasks must NEVER appear in listAvailableTasks
  {
    ...taskBase,
    _id: 't_task_paused',
    taskType: 'phrase_translation',
    languageCode: 'sheng',
    domain: 'greeting',
    difficulty: 'beginner',
    status: 'paused',
  },
  {
    ...taskBase,
    _id: 't_task_closed',
    taskType: 'lexicon_entry',
    languageCode: 'sw',
    domain: 'numbers',
    difficulty: 'beginner',
    status: 'closed',
  },
  // EDGE: status still `open` but expiresAt is in the past -> filtered out
  {
    ...taskBase,
    _id: 't_task_expired',
    taskType: 'phrase_translation',
    languageCode: 'sheng',
    domain: 'time',
    difficulty: 'beginner',
    expiresAt: T_NOW - 2 * DAY,
  },
  // EDGE: targetSubmissionCount 0 -> no submissions wanted (UI must not divide by zero)
  {
    ...taskBase,
    _id: 't_task_zerotarget',
    taskType: 'lexicon_entry',
    languageCode: 'sw',
    domain: 'body',
    difficulty: 'beginner',
    targetSubmissionCount: 0,
  },
  // EDGE: attached to a community Challenge instead of a campaign
  {
    ...taskBase,
    _id: 't_task_challenge',
    challengeId: 't_challenge_demo_1',
    taskType: 'cultural_context',
    languageCode: 'sheng',
    domain: 'ritual',
    difficulty: 'intermediate',
    promptSourceText: 'Describe a naming ceremony in Sheng.',
  },
];

// changaTaskClaims -> getActiveTaskClaim / releaseTaskClaim / skipTask
export const CHANGA_TEST_TASK_CLAIMS = [
  {
    _id: 't_claim_active',
    taskId: 't_task_sheng_phrase_2',
    userId: CHANGA_TEST_USERS.wanjiku._id,
    status: 'active',
    claimedAt: T_NOW - 1 * DAY,
    expiresAt: T_NOW + 1 * HOUR,
  },
  // EDGE: `active` but the deadline passed -> getActiveTaskClaim must return null
  {
    _id: 't_claim_stale',
    taskId: 't_task_sheng_phrase_3',
    userId: CHANGA_TEST_USERS.otieno._id,
    status: 'active',
    claimedAt: T_NOW - 2 * DAY,
    expiresAt: T_NOW - 1 * HOUR,
  },
  // EDGE: released claim carries a skipReason
  {
    _id: 't_claim_released',
    taskId: 't_task_sw_phrase',
    userId: CHANGA_TEST_USERS.amina._id,
    status: 'released',
    claimedAt: T_NOW - 3 * DAY,
    expiresAt: T_NOW - 3 * DAY + 2 * HOUR,
    skipReason: 'not_my_dialect',
  },
  // EDGE: submitted claim is linked back to its submission
  {
    _id: 't_claim_submitted',
    taskId: 't_task_sheng_lex',
    userId: CHANGA_TEST_USERS.kevin._id,
    status: 'submitted',
    claimedAt: T_NOW - 4 * DAY,
    expiresAt: T_NOW - 4 * DAY + 2 * HOUR,
    submissionId: 't_sub_s09',
  },
  // EDGE: expired claim (deadline passed while still unsubmitted)
  {
    _id: 't_claim_expired',
    taskId: 't_task_ki_lex',
    userId: CHANGA_TEST_USERS.njeri._id,
    status: 'expired',
    claimedAt: T_NOW - 6 * DAY,
    expiresAt: T_NOW - 5 * DAY,
  },
];

// ---------------------------------------------------------------------------
// SUBMISSIONS  ->  listUserSubmissions / listAllSubmissions / getSubmission
// Covers all 8 pipeline statuses, every submission type, all 4 licences,
// consent variants, quality flags, withdrawn/revision, orphans and imports.
// ---------------------------------------------------------------------------

const subBase = {
  dialectCode: undefined,
  regionCode: undefined,
  transcriptText: undefined,
  gloss: undefined,
  partOfSpeech: undefined,
  contextNote: undefined,
  speakerProfile: undefined,
  externalUrl: undefined,
  documentEntryId: undefined,
  qualityFlags: [],
  autoChecks: { passed: true },
  revision: 1,
  withdrawnAt: undefined,
  curatedExampleId: undefined,
  consentPolicyVersion: '2026-01',
};

const consentFull = {
  isGranted: true,
  allowTraining: true,
  allowResearch: true,
  allowPublicAttribution: false,
  grantedAt: T_NOW - 10 * DAY,
};
// EDGE: research-only consent -> must not be promotable to the training split
const consentResearchOnly = {
  isGranted: true,
  allowTraining: false,
  allowResearch: true,
  allowPublicAttribution: true,
  grantedAt: T_NOW - 8 * DAY,
};
// EDGE: consent revoked after the fact -> pipeline must stop accepting it
const consentRevoked = {
  isGranted: false,
  allowTraining: false,
  allowResearch: false,
  allowPublicAttribution: false,
  grantedAt: T_NOW - 30 * DAY,
};

export const CHANGA_TEST_SUBMISSIONS = [
  {
    ...subBase,
    _id: 't_sub_s01',
    taskId: 't_task_sheng_phrase_1',
    userId: CHANGA_TEST_USERS.wanjiku._id,
    submissionType: 'phrase_translation',
    languageCode: 'sheng',
    sourceText: 'Where are you going?',
    targetText: 'Unakwenda wapi?',
    contextNote: 'Common greeting-time question between friends.',
    consent: consentFull,
    license: 'community',
    status: 'draft',
    updatedAt: T_NOW - 2 * HOUR,
  },
  {
    ...subBase,
    _id: 't_sub_s02',
    taskId: 't_task_sheng_phrase_2',
    userId: CHANGA_TEST_USERS.wanjiku._id,
    submissionType: 'phrase_translation',
    languageCode: 'sheng',
    sourceText: 'See you later.',
    targetText: 'Tutaonana baadaye.',
    consent: consentFull,
    license: 'community',
    clientIdempotencyKey: 'idem-sheng-002',
    status: 'submitted',
    submittedAt: T_NOW - 5 * HOUR,
    updatedAt: T_NOW - 5 * HOUR,
  },
  {
    ...subBase,
    _id: 't_sub_s03',
    taskId: 't_task_sheng_lex',
    userId: CHANGA_TEST_USERS.otieno._id,
    submissionType: 'lexicon_entry',
    languageCode: 'sheng',
    sourceText: 'Slang for the police',
    targetText: 'karao',
    gloss: 'the police',
    partOfSpeech: 'noun',
    consent: consentFull,
    license: 'community',
    qualityFlags: ['needs_context'],
    autoChecks: { passed: false, languageConfidence: 0.62, duplicateScore: 0.11 },
    status: 'needs_fix',
    submittedAt: T_NOW - 2 * DAY,
    updatedAt: T_NOW - 1 * DAY,
  },
  {
    ...subBase,
    _id: 't_sub_s04',
    taskId: 't_task_sheng_sentence',
    userId: CHANGA_TEST_USERS.wanjiku._id,
    submissionType: 'sentence_translation',
    languageCode: 'sheng',
    sourceText: 'He was so happy he cried.',
    targetText: 'Alifurahi sana hadi akalia.',
    consent: consentFull,
    license: 'community',
    status: 'in_validation',
    submittedAt: T_NOW - 2 * DAY,
    updatedAt: T_NOW - 2 * DAY,
  },
  {
    ...subBase,
    _id: 't_sub_s05',
    taskId: 't_task_sw_phrase',
    userId: CHANGA_TEST_USERS.amina._id,
    submissionType: 'phrase_translation',
    languageCode: 'sw',
    sourceText: 'Good morning',
    targetText: 'Habari za asubuhi',
    consent: consentFull,
    license: 'cc-by-4.0',
    status: 'in_validation',
    submittedAt: T_NOW - 1 * DAY,
    updatedAt: T_NOW - 1 * DAY,
  },
  {
    ...subBase,
    _id: 't_sub_s06',
    taskId: 't_task_ki_lex',
    userId: CHANGA_TEST_USERS.otieno._id,
    submissionType: 'lexicon_entry',
    languageCode: 'ki',
    sourceText: 'mother (noun)',
    targetText: 'nyina',
    gloss: 'mother',
    partOfSpeech: 'noun',
    consent: consentFull,
    license: 'community',
    status: 'in_validation',
    submittedAt: T_NOW - 1 * DAY,
    updatedAt: T_NOW - 1 * DAY,
  },
  {
    ...subBase,
    _id: 't_sub_s07',
    taskId: 't_task_sheng_sentence',
    userId: CHANGA_TEST_USERS.otieno._id,
    submissionType: 'sentence_translation',
    languageCode: 'sheng',
    sourceText: 'How are you doing?',
    targetText: 'Mambo vipi?',
    consent: consentFull,
    license: 'community',
    status: 'validated',
    submittedAt: T_NOW - 6 * DAY,
    updatedAt: T_NOW - 5 * DAY,
    curatedExampleId: 't_ce_2',
  },
  {
    ...subBase,
    _id: 't_sub_s08',
    taskId: 't_task_sw_lex',
    userId: CHANGA_TEST_USERS.amina._id,
    submissionType: 'lexicon_entry',
    languageCode: 'sw',
    sourceText: 'grandmother (noun)',
    targetText: 'nyanya',
    gloss: 'grandmother',
    partOfSpeech: 'noun',
    consent: consentFull,
    license: 'cc-by-sa-4.0',
    status: 'validated',
    submittedAt: T_NOW - 4 * DAY,
    updatedAt: T_NOW - 3 * DAY,
  },
  // EDGE: rejected by moderation -> must never reach curation
  {
    ...subBase,
    _id: 't_sub_s09',
    taskId: 't_task_sheng_lex',
    userId: CHANGA_TEST_USERS.kevin._id,
    submissionType: 'lexicon_entry',
    languageCode: 'sheng',
    sourceText: 'Slang for a bribe',
    targetText: 'chai',
    gloss: 'a bribe',
    consent: consentFull,
    license: 'community',
    qualityFlags: ['profanity_risk', 'needs_context'],
    autoChecks: { passed: false, profanityRiskScore: 0.71, languageConfidence: 0.94 },
    status: 'rejected',
    submittedAt: T_NOW - 4 * DAY,
    updatedAt: T_NOW - 3 * DAY,
  },
  // EDGE: curated -> terminal happy path, linked to curated example t_ce_1
  {
    ...subBase,
    _id: 't_sub_s10',
    taskId: 't_task_sheng_sentence',
    userId: CHANGA_TEST_USERS.wanjiku._id,
    submissionType: 'sentence_translation',
    languageCode: 'sheng',
    sourceText: 'Where are you going?',
    targetText: 'Unakwenda wapi?',
    contextNote: 'Common greeting-time question between friends.',
    consent: consentFull,
    license: 'community',
    autoChecks: { passed: true, languageConfidence: 0.97, duplicateScore: 0.03 },
    status: 'curated',
    submittedAt: T_NOW - 9 * DAY,
    updatedAt: T_NOW - 8 * DAY,
    curatedExampleId: 't_ce_1',
  },
  // EDGE: withdrawn by author, revision 2 (an earlier edit was replaced)
  {
    ...subBase,
    _id: 't_sub_s11',
    taskId: 't_task_sheng_phrase_3',
    userId: CHANGA_TEST_USERS.amina._id,
    submissionType: 'phrase_translation',
    languageCode: 'sheng',
    sourceText: "I'm broke, bro.",
    targetText: 'Niko na zero, msee.',
    consent: consentFull,
    license: 'community',
    revision: 2,
    status: 'withdrawn',
    submittedAt: T_NOW - 5 * DAY,
    updatedAt: T_NOW - 2 * DAY,
    withdrawnAt: T_NOW - 2 * DAY,
  },
  // EDGE: audio reading -> ValidationRunner must surface the player
  {
    ...subBase,
    _id: 't_sub_s12',
    taskId: 't_task_sheng_audio',
    userId: CHANGA_TEST_USERS.wanjiku._id,
    submissionType: 'audio_reading',
    languageCode: 'sheng',
    sourceText: 'Read this Sheng sentence aloud in your natural voice.',
    targetText: 'Niaje msee, uko poa?',
    speakerProfile: {
      regionCode: 'nairobi',
      ageBand: '25-34',
      gender: 'female',
      selfReportedFluency: 'native',
    },
    consent: consentFull,
    license: 'community',
    status: 'submitted',
    submittedAt: T_NOW - 3 * HOUR,
    updatedAt: T_NOW - 3 * HOUR,
  },
  // EDGE: low-quality audio (low SNR / heavy clipping) -> audio_quality + soft flags
  {
    ...subBase,
    _id: 't_sub_s13',
    taskId: 't_task_luo_audio',
    userId: CHANGA_TEST_USERS.otieno._id,
    submissionType: 'audio_reading',
    languageCode: 'luo',
    sourceText: 'Read this Dholuo greeting aloud.',
    targetText: 'Idhi nade?',
    speakerProfile: {
      regionCode: 'kisumu',
      ageBand: '35-44',
      gender: 'male',
      selfReportedFluency: 'fluent',
    },
    consent: consentFull,
    license: 'community',
    qualityFlags: ['noisy_recording', 'possible_clipping'],
    autoChecks: { passed: false, audioQualityScore: 0.38 },
    status: 'submitted',
    submittedAt: T_NOW - 4 * HOUR,
    updatedAt: T_NOW - 4 * HOUR,
  },
  // EDGE: transcription task -> transcriptText is the payload, sourceText is unused
  {
    ...subBase,
    _id: 't_sub_s14',
    taskId: 't_task_luo_transcription',
    userId: CHANGA_TEST_USERS.njeri._id,
    submissionType: 'transcription',
    languageCode: 'luo',
    transcriptText: "Ne gin e ot ka gikwe. Koro wasewinjo sigand ma ne okonyo ji mang'eny.",
    speakerProfile: {
      regionCode: 'siaya',
      ageBand: '55+',
      gender: 'unspecified',
      selfReportedFluency: 'native',
    },
    consent: consentFull,
    license: 'internal',
    status: 'submitted',
    submittedAt: T_NOW - 2 * HOUR,
    updatedAt: T_NOW - 2 * HOUR,
  },
  // EDGE: escalated for moderator review (pairs with an open moderator assignment)
  {
    ...subBase,
    _id: 't_sub_s15',
    taskId: 't_task_sheng_culture',
    userId: CHANGA_TEST_USERS.kevin._id,
    submissionType: 'cultural_context',
    languageCode: 'sheng',
    sourceText: "Explain what 'ushamba' means and when it is used.",
    targetText: 'Ushamba ni kutungisha watu na tabia za mshamba.',
    contextNote: 'Pejorative in some contexts; needs cultural sensitivity review.',
    consent: consentFull,
    license: 'community',
    qualityFlags: ['sensitive_context'],
    status: 'in_validation',
    submittedAt: T_NOW - 20 * HOUR,
    updatedAt: T_NOW - 20 * HOUR,
  },
  // EDGE: externalUrl citation (http(s)-validated server-side)
  {
    ...subBase,
    _id: 't_sub_s16',
    taskId: 't_task_sw_phrase',
    userId: CHANGA_TEST_USERS.amina._id,
    submissionType: 'phrase_translation',
    languageCode: 'sw',
    sourceText: 'Welcome',
    targetText: 'Karibu',
    externalUrl: 'https://www.standardmedia.co.ke/example-kiswahili-greetings',
    consent: consentFull,
    license: 'cc-by-4.0',
    status: 'validated',
    submittedAt: T_NOW - 7 * DAY,
    updatedAt: T_NOW - 6 * DAY,
  },
  // EDGE: unsafe content vote path (pairs with an `unsafe` validation vote)
  {
    ...subBase,
    _id: 't_sub_s17',
    taskId: 't_task_sheng_culture',
    userId: CHANGA_TEST_USERS.ghost._id,
    submissionType: 'cultural_context',
    languageCode: 'sheng',
    sourceText: 'Describe a naming ceremony in Sheng.',
    targetText: 'Ceremony ni ile ya kupeana jina, na ni ya kila mwaka.',
    consent: consentFull,
    license: 'community',
    autoChecks: { passed: false, profanityRiskScore: 0.88, piiRiskScore: 0.55 },
    qualityFlags: ['pii_risk'],
    status: 'rejected',
    submittedAt: T_NOW - 8 * DAY,
    updatedAt: T_NOW - 7 * DAY,
  },
  // EDGE: research-only consent -> allowed in the queue, blocked from training release
  {
    ...subBase,
    _id: 't_sub_s18',
    taskId: 't_task_yo_phrase',
    userId: CHANGA_TEST_USERS.amina._id,
    submissionType: 'phrase_translation',
    languageCode: 'yo',
    sourceText: 'Welcome',
    targetText: 'Ẹ ku abọ',
    consent: consentResearchOnly,
    consentPolicyVersion: '2025-09',
    license: 'cc-by-4.0',
    status: 'in_validation',
    submittedAt: T_NOW - 30 * HOUR,
    updatedAt: T_NOW - 30 * HOUR,
  },
  // EDGE: consent revoked / never granted -> must be excluded from every release
  {
    ...subBase,
    _id: 't_sub_s19',
    taskId: 't_task_ig_lowpri',
    userId: CHANGA_TEST_USERS.ghost._id,
    submissionType: 'phrase_translation',
    languageCode: 'ig',
    sourceText: 'Where are you going?',
    targetText: 'Ebee ka ị na-aga?',
    consent: consentRevoked,
    license: 'community',
    status: 'needs_fix',
    qualityFlags: ['consent_required'],
    autoChecks: { passed: false },
    submittedAt: T_NOW - 11 * DAY,
    updatedAt: T_NOW - 10 * DAY,
  },
  // EDGE: orphaned submission — author account removed (userId undefined)
  {
    ...subBase,
    _id: 't_sub_s20',
    taskId: 't_task_sheng_phrase_1',
    submissionType: 'phrase_translation',
    languageCode: 'sheng',
    sourceText: 'Good morning, my friend.',
    targetText: 'Niaje msee.',
    consent: consentFull,
    license: 'community',
    status: 'submitted',
    submittedAt: T_NOW - 9 * HOUR,
    updatedAt: T_NOW - 9 * HOUR,
  },
  // EDGE: promoted out of a bulk document import -> keeps documentEntryId for traceability
  {
    ...subBase,
    _id: 't_sub_s21',
    taskId: 't_task_ki_lex_rain',
    userId: CHANGA_TEST_USERS.njeri._id,
    submissionType: 'lexicon_entry',
    languageCode: 'ki',
    sourceText: 'rain (noun)',
    targetText: 'mbura',
    gloss: 'rain',
    partOfSpeech: 'noun',
    documentEntryId: 't_doc_entry_ki_004',
    consent: consentFull,
    license: 'internal',
    status: 'in_validation',
    submittedAt: T_NOW - 12 * HOUR,
    updatedAt: T_NOW - 12 * HOUR,
  },
];

// ---------------------------------------------------------------------------
// VALIDATION QUEUE  ->  listValidationQueue (submission + computed vote counts)
// Rows the ValidationRunner renders. Raw SUBMISSIONS above are what
// getValidationBundle / getSubmission return.
// ---------------------------------------------------------------------------

export const CHANGA_TEST_VALIDATION_QUEUE = [
  // EDGE: 2 accepts, no rejects -> one more accept would auto-validate
  {
    ...CHANGA_TEST_SUBMISSIONS[3],
    voteCount: 2,
    acceptCount: 2,
    rejectCount: 0,
    hasCurrentUserVote: false,
    requiresModerator: false,
  },
  // EDGE: split votes -> disagreement, forces moderator escalation
  {
    ...CHANGA_TEST_SUBMISSIONS[4],
    voteCount: 2,
    acceptCount: 1,
    rejectCount: 1,
    hasCurrentUserVote: false,
    requiresModerator: true,
  },
  {
    ...CHANGA_TEST_SUBMISSIONS[5],
    voteCount: 1,
    acceptCount: 1,
    rejectCount: 0,
    hasCurrentUserVote: false,
    requiresModerator: false,
  },
  // EDGE: zero votes -> brand new in queue
  {
    ...CHANGA_TEST_SUBMISSIONS[20],
    voteCount: 0,
    acceptCount: 0,
    rejectCount: 0,
    hasCurrentUserVote: false,
    requiresModerator: false,
  },
  // EDGE: the current user already voted -> filtered OUT of the rendered queue
  {
    ...CHANGA_TEST_SUBMISSIONS[3],
    voteCount: 3,
    acceptCount: 3,
    rejectCount: 0,
    hasCurrentUserVote: true,
    requiresModerator: false,
  },
];

// ---------------------------------------------------------------------------
// SUBMISSION ASSETS  ->  getValidationBundle (audio player) / attachSubmissionAsset
// ---------------------------------------------------------------------------

export const CHANGA_TEST_SUBMISSION_ASSETS = [
  // EDGE: clean recording — passes every audio gate
  {
    _id: 't_asset_a01',
    submissionId: 't_sub_s12',
    storageId: 't_storage_audio_01',
    assetType: 'audio',
    mimeType: 'audio/webm;codecs=opus',
    durationMs: 4200,
    sampleRate: 48000,
    channels: 1,
    sizeBytes: 68_400,
    waveformPreview: '0,3,7,12,9,5,2,0,4,8,11,6,3,1',
    asrText: 'Niaje msee, uko poa?',
    asrConfidence: 0.93,
    snrScore: 22.4,
    clippingScore: 0.02,
    createdAt: T_NOW - 3 * HOUR,
  },
  // EDGE: noisy/clipped recording — audio_quality fails, SR sees soft flags
  {
    _id: 't_asset_a02',
    submissionId: 't_sub_s13',
    storageId: 't_storage_audio_02',
    assetType: 'audio',
    mimeType: 'audio/mp4',
    durationMs: 2600,
    sampleRate: 16000,
    channels: 2,
    sizeBytes: 154_800,
    waveformPreview: '0,14,15,15,13,15,15,9,2,0,0,1',
    asrText: 'idhi nade idhi nade',
    asrConfidence: 0.51,
    snrScore: 6.1,
    clippingScore: 0.41,
    createdAt: T_NOW - 4 * HOUR,
  },
  // EDGE: non-audio asset (image upload path, e.g. totem/photograph evidence)
  {
    _id: 't_asset_a03',
    submissionId: 't_sub_s15',
    storageId: 't_storage_image_03',
    assetType: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 1_248_000,
    createdAt: T_NOW - 20 * HOUR,
  },
];

// ---------------------------------------------------------------------------
// PROCESSING RUNS  ->  getSubmissionProcessingRuns / getSubmissionStatus
// One row per processor per submission, across all 4 run statuses.
// ---------------------------------------------------------------------------

export const CHANGA_TEST_PROCESSING_RUNS = [
  {
    _id: 't_run_01',
    submissionId: 't_sub_s10',
    processor: 'basic_task_check',
    status: 'completed',
    result: {
      passed: true,
      checks: ['duplicate_detection', 'language_id', 'pii_scan'],
      languageConfidence: 0.97,
      duplicateScore: 0.03,
      wordsFound: 4,
    },
    modelVersion: 'samiati-pipeline-v1.2',
    configVersion: 'cfg-003',
    inputRef: 't_sub_s10#rev1',
    createdAt: T_NOW - 9 * DAY,
    completedAt: T_NOW - 9 * DAY + 40_000,
  },
  {
    _id: 't_run_02',
    submissionId: 't_sub_s10',
    processor: 'language_id',
    status: 'completed',
    result: { language: 'sheng', confidence: 0.97, runnerUp: { language: 'sw', confidence: 0.02 } },
    modelVersion: 'lid-v2',
    configVersion: 'cfg-003',
    createdAt: T_NOW - 9 * DAY,
    completedAt: T_NOW - 9 * DAY + 55_000,
  },
  {
    _id: 't_run_03',
    submissionId: 't_sub_s10',
    processor: 'duplicate_detection',
    status: 'completed',
    result: { duplicateScore: 0.03, nearestId: null },
    modelVersion: 'dedupe-v1',
    configVersion: 'cfg-003',
    createdAt: T_NOW - 9 * DAY,
    completedAt: T_NOW - 9 * DAY + 60_000,
  },
  // EDGE: still queued -> getSubmissionStatus must report "received"
  {
    _id: 't_run_04',
    submissionId: 't_sub_s02',
    processor: 'basic_task_check',
    status: 'queued',
    createdAt: T_NOW - 5 * HOUR,
  },
  // EDGE: currently running -> progress UI must show an in-flight state
  {
    _id: 't_run_05',
    submissionId: 't_sub_s12',
    processor: 'asr',
    status: 'running',
    inputRef: 't_asset_a01',
    modelVersion: 'whisper-large-v3',
    configVersion: 'cfg-004',
    createdAt: T_NOW - 2 * HOUR,
  },
  // EDGE: failed run with an error string -> must surface an operator-visible reason
  {
    _id: 't_run_06',
    submissionId: 't_sub_s13',
    processor: 'audio_quality',
    status: 'failed',
    error: 'signal_to_noise_below_threshold (snr=6.1, min=10.0)',
    modelVersion: 'audio-q-v1',
    configVersion: 'cfg-004',
    inputRef: 't_asset_a02',
    createdAt: T_NOW - 4 * HOUR,
    completedAt: T_NOW - 4 * HOUR + 12_000,
  },
  {
    _id: 't_run_07',
    submissionId: 't_sub_s13',
    processor: 'audio_quality',
    status: 'completed',
    result: { snrScore: 6.1, clippingScore: 0.41, passed: false },
    modelVersion: 'audio-q-v1',
    configVersion: 'cfg-004',
    createdAt: T_NOW - 4 * HOUR,
    completedAt: T_NOW - 4 * HOUR + 20_000,
  },
  // EDGE: moderation flagged (soft flag, not a hard block)
  {
    _id: 't_run_08',
    submissionId: 't_sub_s17',
    processor: 'moderation',
    status: 'completed',
    result: {
      flagged: true,
      reasons: ['pii_risk', 'sensitive_context'],
      severity: 'medium',
      scores: { toxicity: 0.31, pii: 0.55 },
    },
    modelVersion: 'toxic-bert',
    configVersion: 'cfg-005',
    createdAt: T_NOW - 8 * DAY,
    completedAt: T_NOW - 8 * DAY + 30_000,
  },
  // EDGE: bulk document categorization run (document pipeline, not submission)
  {
    _id: 't_run_09',
    submissionId: 't_sub_s21',
    processor: 'bulk_categorize',
    status: 'completed',
    result: { autoCategory: 'weather', confidence: 0.81, detectedLanguage: 'ki' },
    modelVersion: 'cat-v1',
    configVersion: 'cfg-006',
    createdAt: T_NOW - 12 * HOUR,
    completedAt: T_NOW - 12 * HOUR + 18_000,
  },
  // EDGE: language_id disagrees with the declared language
  {
    _id: 't_run_10',
    submissionId: 't_sub_s19',
    processor: 'language_id',
    status: 'completed',
    result: { language: 'ig', confidence: 0.44, declaredLanguage: 'ig', mismatch: true },
    modelVersion: 'lid-v2',
    configVersion: 'cfg-003',
    createdAt: T_NOW - 11 * DAY,
    completedAt: T_NOW - 11 * DAY + 50_000,
  },
];

// ---------------------------------------------------------------------------
// VALIDATION VOTES  ->  submitValidationVote / getValidationBundle
// All 7 vote values x the 3 validator roles, with confidence + issue codes.
// ---------------------------------------------------------------------------

export const CHANGA_TEST_VALIDATION_VOTES = [
  {
    _id: 't_vote_01',
    submissionId: 't_sub_s04',
    validatorId: CHANGA_TEST_USERS.otieno._id,
    validatorRole: 'peer',
    vote: 'accept',
    confidence: 85,
    issueCodes: [],
    comment: 'Natural Sheng. I would say it the same way.',
    trustSnapshot: 61,
    createdAt: T_NOW - 1 * DAY,
  },
  {
    _id: 't_vote_02',
    submissionId: 't_sub_s04',
    validatorId: CHANGA_TEST_USERS.amina._id,
    validatorRole: 'peer',
    vote: 'accept',
    confidence: 70,
    comment: 'Sounds right to me.',
    trustSnapshot: 12,
    createdAt: T_NOW - 30 * HOUR,
  },
  // EDGE: disagreeing pair -> escalates to a moderator
  {
    _id: 't_vote_03',
    submissionId: 't_sub_s05',
    validatorId: CHANGA_TEST_USERS.wanjiku._id,
    validatorRole: 'peer',
    vote: 'accept',
    confidence: 90,
    trustSnapshot: 104,
    createdAt: T_NOW - 20 * HOUR,
  },
  {
    _id: 't_vote_04',
    submissionId: 't_sub_s05',
    validatorId: CHANGA_TEST_USERS.njeri._id,
    validatorRole: 'moderator',
    vote: 'minor_fix',
    confidence: 80,
    issueCodes: ['orthography'],
    comment: "Prefer 'Habari ya asubuhi' in formal Kiswahili.",
    trustSnapshot: 240,
    createdAt: T_NOW - 18 * HOUR,
  },
  {
    _id: 't_vote_05',
    submissionId: 't_sub_s06',
    validatorId: CHANGA_TEST_USERS.kevin._id,
    validatorRole: 'expert',
    vote: 'accept',
    confidence: 96,
    trustSnapshot: 300,
    createdAt: T_NOW - 16 * HOUR,
  },
  {
    _id: 't_vote_06',
    submissionId: 't_sub_s09',
    validatorId: CHANGA_TEST_USERS.njeri._id,
    validatorRole: 'moderator',
    vote: 'reject',
    confidence: 88,
    issueCodes: ['profanity'],
    comment: 'Pejorative slang; not suitable for the training set.',
    trustSnapshot: 240,
    createdAt: T_NOW - 3 * DAY,
  },
  {
    _id: 't_vote_07',
    submissionId: 't_sub_s09',
    validatorId: CHANGA_TEST_USERS.otieno._id,
    validatorRole: 'peer',
    vote: 'duplicate',
    confidence: 60,
    issueCodes: ['duplicate'],
    comment: "This sense is already covered by the 'chai' entry.",
    trustSnapshot: 61,
    createdAt: T_NOW - 3 * DAY,
  },
  {
    _id: 't_vote_08',
    submissionId: 't_sub_s13',
    validatorId: CHANGA_TEST_USERS.kevin._id,
    validatorRole: 'expert',
    vote: 'unclear_audio',
    confidence: 75,
    issueCodes: ['noisy_recording', 'clipping'],
    comment: 'Too much background noise to judge pronunciation.',
    trustSnapshot: 300,
    createdAt: T_NOW - 3 * HOUR,
  },
  {
    _id: 't_vote_09',
    submissionId: 't_sub_s17',
    validatorId: CHANGA_TEST_USERS.njeri._id,
    validatorRole: 'moderator',
    vote: 'unsafe',
    confidence: 92,
    issueCodes: ['pii', 'sensitive_content'],
    comment: "Contains a real person's name and location.",
    trustSnapshot: 240,
    createdAt: T_NOW - 7 * DAY,
  },
  {
    _id: 't_vote_10',
    submissionId: 't_sub_s18',
    validatorId: CHANGA_TEST_USERS.wanjiku._id,
    validatorRole: 'peer',
    vote: 'wrong_language',
    confidence: 68,
    issueCodes: ['wrong_language'],
    comment: 'This is Yoruba, but the task was tagged Swahili.',
    trustSnapshot: 104,
    createdAt: T_NOW - 28 * HOUR,
  },
  {
    _id: 't_vote_11',
    submissionId: 't_sub_s15',
    validatorId: CHANGA_TEST_USERS.otieno._id,
    validatorRole: 'peer',
    vote: 'minor_fix',
    confidence: 55,
    issueCodes: ['culture_sensitivity'],
    trustSnapshot: 61,
    createdAt: T_NOW - 19 * HOUR,
  },
  {
    _id: 't_vote_12',
    submissionId: 't_sub_s07',
    validatorId: CHANGA_TEST_USERS.wanjiku._id,
    validatorRole: 'peer',
    vote: 'accept',
    confidence: 94,
    trustSnapshot: 104,
    createdAt: T_NOW - 5 * DAY,
  },
];

// changaValidationAssignments -> listValidationQueue moderator lane / escalateSubmission
export const CHANGA_TEST_VALIDATION_ASSIGNMENTS = [
  // EDGE: open + unassigned -> every moderator sees it in the escalation lane
  {
    _id: 't_assign_01',
    submissionId: 't_sub_s15',
    roleRequired: 'moderator',
    status: 'open',
    assignedAt: T_NOW - 18 * HOUR,
  },
  // EDGE: assigned to a specific moderator
  {
    _id: 't_assign_02',
    submissionId: 't_sub_s05',
    assignedTo: CHANGA_TEST_USERS.njeri._id,
    roleRequired: 'moderator',
    status: 'assigned',
    assignedAt: T_NOW - 17 * HOUR,
  },
  {
    _id: 't_assign_03',
    submissionId: 't_sub_s07',
    assignedTo: CHANGA_TEST_USERS.kevin._id,
    roleRequired: 'expert',
    status: 'completed',
    assignedAt: T_NOW - 6 * DAY,
    completedAt: T_NOW - 5 * DAY,
  },
  // EDGE: skipped -> reviewer could not judge (outside their dialect)
  {
    _id: 't_assign_04',
    submissionId: 't_sub_s11',
    assignedTo: CHANGA_TEST_USERS.amina._id,
    roleRequired: 'peer',
    status: 'skipped',
    assignedAt: T_NOW - 4 * DAY,
    completedAt: T_NOW - 4 * DAY + HOUR,
  },
];

// changaDecisions -> the moderation/curation audit trail (all 5 outcomes)
export const CHANGA_TEST_DECISIONS = [
  {
    _id: 't_decision_01',
    submissionId: 't_sub_s10',
    decision: 'accepted',
    reason: 'Unanimous peer acceptance; no quality flags.',
    resolverId: CHANGA_TEST_USERS.njeri._id,
    evidenceVersion: 'votes-v1',
    createdAt: T_NOW - 8 * DAY,
  },
  {
    _id: 't_decision_02',
    submissionId: 't_sub_s09',
    decision: 'rejected',
    reason: 'Profanity plus a duplicate of an existing lexicon entry.',
    resolverId: CHANGA_TEST_USERS.njeri._id,
    evidenceVersion: 'votes-v1',
    createdAt: T_NOW - 3 * DAY,
  },
  {
    _id: 't_decision_03',
    submissionId: 't_sub_s03',
    decision: 'needs_fix',
    reason: 'Missing context note; language confidence below threshold.',
    resolverId: CHANGA_TEST_USERS.njeri._id,
    evidenceVersion: 'votes-v1',
    createdAt: T_NOW - 1 * DAY,
  },
  // EDGE: escalated -> stays in the moderator queue, no terminal outcome yet
  {
    _id: 't_decision_04',
    submissionId: 't_sub_s15',
    decision: 'escalated',
    reason: 'Reviewers disagree on cultural sensitivity.',
    resolverId: CHANGA_TEST_USERS.njeri._id,
    evidenceVersion: 'votes-v1',
    createdAt: T_NOW - 18 * HOUR,
  },
  // EDGE: retired -> was live, later pulled from the dataset
  {
    _id: 't_decision_05',
    submissionId: 't_sub_s07',
    decision: 'retired',
    reason: 'Superseded by a higher-quality submission for the same phrase.',
    resolverId: CHANGA_TEST_USERS.njeri._id,
    evidenceVersion: 'votes-v1',
    createdAt: T_NOW - 4 * DAY,
  },
];

// ---------------------------------------------------------------------------
// CURATED EXAMPLES  ->  listDatasetReleaseCandidates / listCuratedCandidates
// All 6 example types, all 4 split recommendations, all 5 release statuses.
// NOTE: t_ce_1 / t_ce_2 are referenced by submissions s10 / s07 above, and
// t_ce_3 belongs to dataset release t_release_02.
// ---------------------------------------------------------------------------

export const CHANGA_TEST_CURATED_EXAMPLES = [
  {
    _id: 't_ce_1',
    sourceSubmissionId: 't_sub_s10',
    exampleType: 'parallel_text',
    languageCode: 'sheng',
    sourceText: 'Where are you going?',
    targetText: 'Unakwenda wapi?',
    contextText: 'Common greeting-time question between friends.',
    qualityScore: 0.92,
    reviewSummary: 'Natural Sheng phrasing; two peer accepts, no flags.',
    splitRecommendation: 'train',
    releaseStatus: 'candidate',
    createdAt: T_NOW - 8 * DAY,
  },
  {
    _id: 't_ce_2',
    sourceSubmissionId: 't_sub_s07',
    exampleType: 'parallel_text',
    languageCode: 'sheng',
    sourceText: 'How are you doing?',
    targetText: 'Mambo vipi?',
    qualityScore: 0.88,
    reviewSummary: 'Widely used greeting.',
    splitRecommendation: 'dev',
    releaseStatus: 'approved',
    createdAt: T_NOW - 5 * DAY,
  },
  // EDGE: audio-linked example on the holdout split, already exported into a release
  {
    _id: 't_ce_3',
    sourceSubmissionId: 't_sub_s12',
    exampleType: 'audio_transcript',
    languageCode: 'sheng',
    sourceText: 'Read this Sheng sentence aloud in your natural voice.',
    transcriptText: 'Niaje msee, uko poa?',
    audioAssetId: 't_asset_a01',
    qualityScore: 0.81,
    reviewSummary: 'Clean recording; ASR agrees with the written text.',
    splitRecommendation: 'holdout',
    releaseStatus: 'exported',
    datasetReleaseId: 't_release_02',
    createdAt: T_NOW - 3 * HOUR,
  },
  // EDGE: gold example — hand-verified benchmark, never used for training
  {
    _id: 't_ce_4',
    sourceSubmissionId: 't_sub_s06',
    exampleType: 'lexicon_entry',
    languageCode: 'ki',
    sourceText: 'mother (noun)',
    targetText: 'nyina',
    contextText: 'Standard Kikuyu kinship term.',
    qualityScore: 0.99,
    reviewSummary: 'Expert-verified against the Kikuyu dictionary.',
    splitRecommendation: 'test',
    releaseStatus: 'gold',
    createdAt: T_NOW - 16 * HOUR,
  },
  // EDGE: retired example — pulled after a later correction
  {
    _id: 't_ce_5',
    sourceSubmissionId: 't_sub_s08',
    exampleType: 'lexicon_entry',
    languageCode: 'sw',
    sourceText: 'grandmother (noun)',
    targetText: 'nyanya',
    contextText: "Retired: 'bibi' is preferred in the target region.",
    qualityScore: 0.42,
    reviewSummary: 'Regional variance caused an expert override.',
    splitRecommendation: 'train',
    releaseStatus: 'retired',
    createdAt: T_NOW - 3 * DAY,
  },
  // EDGE: cultural note (no direct translation) — contextText is the whole payload
  {
    _id: 't_ce_6',
    sourceSubmissionId: 't_sub_s15',
    exampleType: 'cultural_note',
    languageCode: 'sheng',
    contextText:
      'Ushamba describes being naive about city life; it can be affectionate or pejorative depending on tone.',
    qualityScore: 0.76,
    reviewSummary: 'Flagged sensitive, approved with a usage warning.',
    splitRecommendation: 'train',
    releaseStatus: 'candidate',
    createdAt: T_NOW - 4 * HOUR,
  },
  // EDGE: audio_translation example (audio + both texts), poor quality score
  {
    _id: 't_ce_7',
    sourceSubmissionId: 't_sub_s13',
    exampleType: 'audio_translation',
    languageCode: 'luo',
    sourceText: 'Read this Dholuo greeting aloud.',
    targetText: 'Idhi nade?',
    transcriptText: 'idhi nade',
    audioAssetId: 't_asset_a02',
    qualityScore: 0.34,
    reviewSummary: 'Noisy; not recommended for training without a re-recording.',
    splitRecommendation: 'dev',
    releaseStatus: 'candidate',
    createdAt: T_NOW - 4 * HOUR,
  },
  // EDGE: validation_gold example — calibrates reviewers, excluded from training
  {
    _id: 't_ce_8',
    sourceSubmissionId: 't_sub_s16',
    exampleType: 'validation_gold',
    languageCode: 'sw',
    sourceText: 'Welcome',
    targetText: 'Karibu',
    contextText: 'Known-good item used for reviewer calibration.',
    qualityScore: 0.95,
    reviewSummary: 'Curator-verified gold label.',
    splitRecommendation: 'test',
    releaseStatus: 'gold',
    createdAt: T_NOW - 6 * DAY,
  },
];

// changaDatasetReleases -> listDatasetReleaseCandidates / createDatasetRelease
export const CHANGA_TEST_DATASET_RELEASES = [
  // EDGE: empty release -> exampleCount 0, must not divide by anything
  {
    _id: 't_release_01',
    name: 'Sheng Parallel Text v0.1',
    version: 'sheng-0.1.0',
    languageScope: ['sheng', 'sw'],
    criteria: 'validated submissions with allowTraining=true and no PII flags',
    exampleCount: 0,
    releaseNotes: 'Initial pilot export.',
    createdAt: T_NOW - 6 * DAY,
    createdBy: CHANGA_TEST_USERS.njeri._id,
  },
  // EDGE: already-exported release -> exampleCount must match its members
  {
    _id: 't_release_02',
    name: 'Sheng Audio Holdout v1',
    version: 'sheng-audio-1.0.0',
    languageScope: ['sheng'],
    criteria: 'holdout split only; clean audio (snr > 15)',
    exampleCount: 2,
    releaseNotes: 'Benchmark holdout for ASR evaluation.',
    createdAt: T_NOW - 2 * DAY,
    createdBy: CHANGA_TEST_USERS.njeri._id,
  },
  // EDGE: multi-language release with an empty languageScope array
  {
    _id: 't_release_03',
    name: 'Internal Review Dump',
    version: 'internal-0.0.1',
    languageScope: [],
    criteria: 'internal licence only',
    exampleCount: 1,
    releaseNotes: 'Never exported externally.',
    createdAt: T_NOW - 1 * DAY,
    createdBy: CHANGA_TEST_USERS.njeri._id,
  },
];

// changaReleaseMembers -> listReleaseMembers / addReleaseMember
export const CHANGA_TEST_RELEASE_MEMBERS = [
  {
    _id: 't_member_01',
    releaseId: 't_release_02',
    exampleId: 't_ce_3',
    split: 'holdout',
    addedAt: T_NOW - 2 * DAY,
  },
  {
    _id: 't_member_02',
    releaseId: 't_release_03',
    exampleId: 't_ce_4',
    split: 'test',
    addedAt: T_NOW - 1 * DAY,
  },
];

// changaEvaluationSets / Items -> listEvaluationSets
export const CHANGA_TEST_EVALUATION_SETS = [
  {
    _id: 't_evalset_01',
    name: 'Sheng v1 Benchmark',
    languageCode: 'sheng',
    description: 'Frozen benchmark for the Sheng translation track.',
    accessRole: 'admin',
    isFrozen: true,
    createdAt: T_NOW - 7 * DAY,
    createdBy: CHANGA_TEST_USERS.njeri._id,
  },
  // EDGE: not frozen -> items may still be added/removed
  {
    _id: 't_evalset_02',
    name: 'Kikuyu Lexicon Draft',
    languageCode: 'ki',
    description: 'Work in progress; experts only.',
    accessRole: 'expert',
    isFrozen: false,
    createdAt: T_NOW - 2 * DAY,
    createdBy: CHANGA_TEST_USERS.kevin._id,
  },
];

export const CHANGA_TEST_EVALUATION_ITEMS = [
  {
    _id: 't_evalitem_01',
    evaluationSetId: 't_evalset_01',
    exampleId: 't_ce_1',
    split: 'test',
    addedAt: T_NOW - 7 * DAY,
    addedBy: CHANGA_TEST_USERS.njeri._id,
  },
  {
    _id: 't_evalitem_02',
    evaluationSetId: 't_evalset_01',
    exampleId: 't_ce_8',
    split: 'test',
    addedAt: T_NOW - 6 * DAY,
    addedBy: CHANGA_TEST_USERS.njeri._id,
  },
  {
    _id: 't_evalitem_03',
    evaluationSetId: 't_evalset_02',
    exampleId: 't_ce_4',
    split: 'dev',
    addedAt: T_NOW - 2 * DAY,
    addedBy: CHANGA_TEST_USERS.kevin._id,
  },
];

// ---------------------------------------------------------------------------
// BULK DOCUMENTS  ->  listUserDocuments / getDocument / createDocument
// All 6 kinds, all 5 statuses, plus detected-kind/auto-category disagreements.
// ---------------------------------------------------------------------------

export const CHANGA_TEST_DOCUMENTS = [
  // EDGE: fully imported dictionary -> completed + finalizedAt set
  {
    _id: 't_doc_1',
    ownerId: CHANGA_TEST_USERS.njeri._id,
    title: 'Kikuyu-English Dictionary (scan)',
    kind: 'dictionary',
    languageCode: 'ki',
    dialectCode: 'mugikuyu',
    regionCode: 'nyeri',
    totalEntries: 120,
    importedEntries: 120,
    bytesUploaded: 8_912_400,
    status: 'completed',
    detectedKind: 'dictionary',
    detectedLanguage: 'ki',
    autoCategory: 'kinship',
    autoConfidence: 0.9,
    createdAt: T_NOW - 9 * DAY,
    updatedAt: T_NOW - 8 * DAY,
    finalizedAt: T_NOW - 8 * DAY,
  },
  // EDGE: mid-parse -> progress UI must show a partial import
  {
    _id: 't_doc_2',
    ownerId: CHANGA_TEST_USERS.amina._id,
    title: 'Swahili Short Stories',
    kind: 'novel',
    languageCode: 'sw',
    totalEntries: 340,
    importedEntries: 96,
    bytesUploaded: 4_200_000,
    status: 'parsing',
    autoConfidence: 0.64,
    createdAt: T_NOW - 2 * DAY,
    updatedAt: T_NOW - 1 * DAY,
  },
  // EDGE: declared kind is wrong; the detector disagrees
  {
    _id: 't_doc_3',
    ownerId: CHANGA_TEST_USERS.otieno._id,
    title: 'Dholuo Songs (mixed)',
    kind: 'novel',
    languageCode: 'luo',
    totalEntries: 58,
    importedEntries: 58,
    bytesUploaded: 2_048_000,
    status: 'ready',
    detectedKind: 'song_collection',
    detectedLanguage: 'luo',
    autoCategory: 'music',
    autoConfidence: 0.72,
    createdAt: T_NOW - 5 * DAY,
    updatedAt: T_NOW - 4 * DAY,
  },
  // EDGE: website link -> no file, sourceUrl instead
  {
    _id: 't_doc_4',
    ownerId: CHANGA_TEST_USERS.wanjiku._id,
    title: 'Sheng slang blog archive',
    kind: 'website_link',
    sourceUrl: 'https://example.org/sheng-slang-archive',
    languageCode: 'sheng',
    totalEntries: 25,
    importedEntries: 25,
    status: 'in_review',
    autoCategory: 'other',
    autoConfidence: 0.41,
    createdAt: T_NOW - 3 * DAY,
    updatedAt: T_NOW - 2 * DAY,
  },
  // EDGE: still uploading -> no entries imported yet
  {
    _id: 't_doc_5',
    ownerId: CHANGA_TEST_USERS.wanjiku._id,
    title: 'Sheng interview transcript',
    kind: 'transcript',
    languageCode: 'sheng',
    totalEntries: 40,
    importedEntries: 0,
    bytesUploaded: 512_000,
    status: 'uploading',
    createdAt: T_NOW - 20 * MIN,
    updatedAt: T_NOW - 20 * MIN,
  },
  // EDGE: "other" kind with no detected metadata at all (sparse document)
  {
    _id: 't_doc_6',
    ownerId: CHANGA_TEST_USERS.ghost._id,
    title: 'Unsorted notes',
    kind: 'other',
    languageCode: 'sw',
    totalEntries: 0,
    importedEntries: 0,
    status: 'ready',
    createdAt: T_NOW - 1 * DAY,
    updatedAt: T_NOW - 1 * DAY,
  },
];

// changaDocumentEntries -> getDocument / updateDocumentEntry / applyAutoCategory
export const CHANGA_TEST_DOCUMENT_ENTRIES = [
  // EDGE: needs_fix + reviewer assigned + a low PII risk
  {
    _id: 't_doc_entry_ki_001',
    documentId: 't_doc_1',
    index: 1,
    sourceText: 'mũtumia',
    targetText: 'woman',
    metadata: { page: 12, partOfSpeech: 'noun', gloss: 'adult female' },
    autoCategory: 'kinship',
    autoConfidence: 0.94,
    detectedLanguage: 'ki',
    piiRiskScore: 0.02,
    profanityRiskScore: 0.0,
    status: 'needs_fix',
    reviewAssignedTo: CHANGA_TEST_USERS.njeri._id,
    createdAt: T_NOW - 9 * DAY,
    updatedAt: T_NOW - 7 * DAY,
  },
  // EDGE: approved entry with an accepted suggested target
  {
    _id: 't_doc_entry_ki_002',
    documentId: 't_doc_1',
    index: 2,
    sourceText: 'mbura',
    targetText: 'rain',
    metadata: { page: 14, partOfSpeech: 'noun' },
    autoCategory: 'weather',
    autoConfidence: 0.88,
    detectedLanguage: 'ki',
    piiRiskScore: 0.0,
    profanityRiskScore: 0.0,
    suggestedTarget: 'rain (noun)',
    status: 'approved',
    createdAt: T_NOW - 9 * DAY,
    updatedAt: T_NOW - 8 * DAY,
  },
  // EDGE: rejected entry (OCR garbage, very low confidence)
  {
    _id: 't_doc_entry_ki_003',
    documentId: 't_doc_1',
    index: 3,
    sourceText: 'xyz###',
    metadata: { page: 15 },
    autoConfidence: 0.12,
    status: 'rejected',
    reviewAssignedTo: CHANGA_TEST_USERS.njeri._id,
    createdAt: T_NOW - 9 * DAY,
    updatedAt: T_NOW - 8 * DAY,
  },
  // EDGE: pending entry — already promoted into submission s21
  {
    _id: 't_doc_entry_ki_004',
    documentId: 't_doc_1',
    index: 4,
    sourceText: 'rain (noun)',
    targetText: 'mbura',
    metadata: { page: 16, chapter: 'Weather', partOfSpeech: 'noun', gloss: 'rainfall' },
    autoCategory: 'weather',
    autoConfidence: 0.81,
    detectedLanguage: 'ki',
    piiRiskScore: 0.0,
    profanityRiskScore: 0.0,
    status: 'pending',
    createdAt: T_NOW - 9 * DAY,
    updatedAt: T_NOW - 12 * HOUR,
  },
  // EDGE: profanity risk -> must be blocked from auto-approval
  {
    _id: 't_doc_entry_sw_001',
    documentId: 't_doc_2',
    index: 7,
    sourceText: 'usiku mrefu',
    targetText: 'a long night',
    metadata: { chapter: 'Chapter 2', page: 31 },
    autoCategory: 'time',
    autoConfidence: 0.7,
    detectedLanguage: 'sw',
    piiRiskScore: 0.09,
    profanityRiskScore: 0.66,
    status: 'needs_fix',
    createdAt: T_NOW - 2 * DAY,
    updatedAt: T_NOW - 1 * DAY,
  },
  // EDGE: PII-bearing entry (real name + place) -> manual review mandatory
  {
    _id: 't_doc_entry_sw_002',
    documentId: 't_doc_2',
    index: 8,
    sourceText: "Jina langu ni Achieng' wa Kisumu.",
    targetText: "My name is Achieng', from Kisumu.",
    autoCategory: 'place',
    autoConfidence: 0.55,
    detectedLanguage: 'sw',
    piiRiskScore: 0.83,
    profanityRiskScore: 0.01,
    status: 'pending',
    createdAt: T_NOW - 2 * DAY,
    updatedAt: T_NOW - 2 * DAY,
  },
  // EDGE: song entry detected as `music` even though the document declared `novel`
  {
    _id: 't_doc_entry_luo_001',
    documentId: 't_doc_3',
    index: 1,
    sourceText: 'Wadhi wuon od',
    targetText: 'Song of the homestead',
    metadata: { chapter: 'Opening song' },
    autoCategory: 'music',
    autoConfidence: 0.78,
    detectedLanguage: 'luo',
    piiRiskScore: 0.0,
    profanityRiskScore: 0.0,
    status: 'approved',
    createdAt: T_NOW - 5 * DAY,
    updatedAt: T_NOW - 4 * DAY,
  },
];

// ---------------------------------------------------------------------------
// CUSTOM TASK TEMPLATES  ->  createCustomTemplate / listCustomTemplatesForCampaign
// Input schemas exercise all 5 input types, required + optional fields.
// ---------------------------------------------------------------------------

export const CHANGA_TEST_CUSTOM_TEMPLATES = [
  {
    _id: 't_custom_tpl_1',
    creatorId: CHANGA_TEST_USERS.wanjiku._id,
    campaignId: 't_campaign_sheng',
    title: 'Sheng Proverb Collector',
    description: 'Share a Sheng proverb and when you would use it.',
    taskType: 'cultural_context',
    languageCode: 'sheng',
    inputSchema: [
      { id: 'proverb', label: 'Proverb', inputType: 'text', required: true },
      { id: 'meaning', label: 'What it means', inputType: 'textarea', required: true },
      { id: 'situation', label: 'When it is used', inputType: 'textarea', required: false },
      {
        id: 'register',
        label: 'Register',
        inputType: 'select',
        required: true,
        options: ['street', 'formal', 'sarcastic', 'respectful'],
      },
      { id: 'has_recording', label: 'I also recorded it', inputType: 'checkbox', required: false },
      { id: 'recording', label: 'Audio recording', inputType: 'audio', required: false },
    ],
    successCriteria: 'A native speaker recognises the proverb and agrees with the meaning.',
    createdAt: T_NOW - 6 * DAY,
  },
  // EDGE: no campaignId (standalone template) and a single required field
  {
    _id: 't_custom_tpl_2',
    creatorId: CHANGA_TEST_USERS.kevin._id,
    title: 'Rare Word Spotlight',
    description: 'Submit one endangered-language word per day.',
    taskType: 'lexicon_entry',
    languageCode: 'El Molo',
    inputSchema: [{ id: 'word', label: 'Word', inputType: 'text', required: true }],
    createdAt: T_NOW - 2 * DAY,
  },
  // EDGE: audio-only template -> the submit button must stay disabled
  {
    _id: 't_custom_tpl_3',
    creatorId: CHANGA_TEST_USERS.amina._id,
    campaignId: 't_campaign_luo',
    title: 'Dholuo Greeting Recording',
    description: "Record your dialect's greeting.",
    taskType: 'audio_reading',
    languageCode: 'luo',
    inputSchema: [
      { id: 'greeting', label: 'Greeting audio', inputType: 'audio', required: true },
      { id: 'dialect_notes', label: 'Dialect notes', inputType: 'textarea', required: false },
    ],
    successCriteria: 'Recording is audible and at least 2 seconds long.',
    createdAt: T_NOW - 1 * DAY,
  },
];

// ---------------------------------------------------------------------------
// CONTRIBUTOR STATS  ->  getUserContributionStats / getMyXPProfile
// trustScore follows buildTrustScore() in convex/changa/stats.ts.
// NOTE: CHANGA_TEST_USERS.ghost deliberately has NO stats row (edge case):
// getUserContributionStats must fall back to computed zeros for it.
// ---------------------------------------------------------------------------

export const CHANGA_TEST_USER_STATS = [
  // EDGE: healthy mid-tier contributor, streak 7
  {
    _id: 't_stats_wanjiku',
    userId: CHANGA_TEST_USERS.wanjiku._id,
    contributionCount: 6,
    validationCount: 14,
    acceptRate: 0.83,
    reviewAgreementRate: 0.71,
    trustScore: 104,
    streakDays: 7,
    lastActiveDate: '2026-09-16',
    topLanguages: ['sheng', 'sw'],
    badges: ['first_contribution', 'audio_contributor', 'streak_7'],
  },
  // EDGE: low trust, only the first badge
  {
    _id: 't_stats_otieno',
    userId: CHANGA_TEST_USERS.otieno._id,
    contributionCount: 3,
    validationCount: 4,
    acceptRate: 0.6,
    reviewAgreementRate: 0.5,
    trustScore: 61,
    streakDays: 3,
    lastActiveDate: '2026-09-15',
    topLanguages: ['sw'],
    badges: ['first_contribution'],
  },
  // EDGE: brand-new — every counter at zero, empty arrays (never null)
  {
    _id: 't_stats_amina',
    userId: CHANGA_TEST_USERS.amina._id,
    contributionCount: 0,
    validationCount: 0,
    acceptRate: 0,
    reviewAgreementRate: 0,
    trustScore: 0,
    streakDays: 0,
    lastActiveDate: '2026-09-16',
    topLanguages: [],
    badges: [],
  },
  // EDGE: moderator — high trust, calibrates other reviewers
  {
    _id: 't_stats_njeri',
    userId: CHANGA_TEST_USERS.njeri._id,
    contributionCount: 41,
    validationCount: 96,
    acceptRate: 0.9,
    reviewAgreementRate: 0.88,
    trustScore: 240,
    streakDays: 14,
    lastActiveDate: '2026-09-16',
    topLanguages: ['ki', 'sw'],
    badges: ['first_contribution', 'ten_contributions', 'validator', 'streak_7'],
  },
  // EDGE: max-level rare-language champion, streak 30 (all 8 badges)
  {
    _id: 't_stats_kevin',
    userId: CHANGA_TEST_USERS.kevin._id,
    contributionCount: 152,
    validationCount: 88,
    acceptRate: 0.94,
    reviewAgreementRate: 0.91,
    trustScore: 300,
    streakDays: 30,
    lastActiveDate: '2026-09-16',
    topLanguages: ['El Molo', 'luo', 'sheng'],
    badges: [
      'first_contribution',
      'ten_contributions',
      'audio_contributor',
      'rare_language_champion',
      'streak_7',
      'streak_30',
      'validator',
      'language_master',
    ],
  },
];

// ---------------------------------------------------------------------------
// ROLE GRANTS  ->  getMyChangaRole / grantChangaRole
// All 6 progression roles, all 3 grant statuses, language-scoped + global.
// ---------------------------------------------------------------------------

export const CHANGA_TEST_ROLE_GRANTS = [
  // EDGE: expired grant must be ignored when resolving the highest role
  {
    _id: 't_grant_01',
    userId: CHANGA_TEST_USERS.wanjiku._id,
    languageCode: 'sheng',
    role: 'trusted_contributor',
    grantedBy: CHANGA_TEST_USERS.njeri._id,
    status: 'expired',
    grantedAt: T_NOW - 60 * DAY,
    expiresAt: T_NOW - 1 * DAY,
  },
  // EDGE: active, language-scoped, no expiry
  {
    _id: 't_grant_02',
    userId: CHANGA_TEST_USERS.wanjiku._id,
    languageCode: 'sheng',
    role: 'community_reviewer',
    grantedBy: CHANGA_TEST_USERS.njeri._id,
    status: 'active',
    grantedAt: T_NOW - 5 * DAY,
  },
  // EDGE: revoked grant -> must not unlock anything
  {
    _id: 't_grant_03',
    userId: CHANGA_TEST_USERS.otieno._id,
    languageCode: 'sw',
    role: 'contributor',
    grantedBy: CHANGA_TEST_USERS.njeri._id,
    status: 'revoked',
    grantedAt: T_NOW - 40 * DAY,
  },
  {
    _id: 't_grant_04',
    userId: CHANGA_TEST_USERS.otieno._id,
    languageCode: 'sw',
    role: 'trusted_contributor',
    grantedBy: CHANGA_TEST_USERS.njeri._id,
    status: 'active',
    grantedAt: T_NOW - 12 * DAY,
  },
  {
    _id: 't_grant_05',
    userId: CHANGA_TEST_USERS.njeri._id,
    languageCode: 'ki',
    role: 'language_moderator',
    grantedBy: CHANGA_TEST_USERS.njeri._id,
    status: 'active',
    grantedAt: T_NOW - 90 * DAY,
  },
  // EDGE: verified expert for a rare language (drives expert-lane reviews)
  {
    _id: 't_grant_06',
    userId: CHANGA_TEST_USERS.kevin._id,
    languageCode: 'El Molo',
    role: 'verified_expert',
    grantedBy: CHANGA_TEST_USERS.njeri._id,
    status: 'active',
    grantedAt: T_NOW - 30 * DAY,
  },
  // EDGE: global (no languageCode) new-contributor grant
  {
    _id: 't_grant_07',
    userId: CHANGA_TEST_USERS.amina._id,
    role: 'new_contributor',
    grantedBy: CHANGA_TEST_USERS.njeri._id,
    status: 'active',
    grantedAt: T_NOW - 10 * DAY,
  },
];

// ---------------------------------------------------------------------------
// CONSENT  ->  getActiveConsentPolicy / recordConsent / revokeConsent
// ---------------------------------------------------------------------------

export const CHANGA_TEST_CONSENT_POLICIES = [
  {
    _id: 't_policy_1',
    policyVersion: '2026-01',
    effectiveAt: T_NOW - 120 * DAY,
    summaryText: 'We store your contribution and may use it to train Samiati models.',
    fullText: 'Full text of the January 2026 contributor consent policy...',
    requiredScopes: ['collection_storage', 'training', 'research'],
    isActive: false,
    createdBy: CHANGA_TEST_USERS.njeri._id,
    createdAt: T_NOW - 121 * DAY,
  },
  // EDGE: the currently active policy
  {
    _id: 't_policy_2',
    policyVersion: '2026-06',
    effectiveAt: T_NOW - 60 * DAY,
    summaryText: 'Adds optional voice use and commercial use scopes.',
    fullText: 'Full text of the June 2026 contributor consent policy...',
    requiredScopes: ['collection_storage', 'training', 'research', 'voice_use'],
    isActive: true,
    createdBy: CHANGA_TEST_USERS.njeri._id,
    createdAt: T_NOW - 61 * DAY,
  },
];

export const CHANGA_TEST_CONSENT_RECORDS = [
  {
    _id: 't_record_1',
    userId: CHANGA_TEST_USERS.wanjiku._id,
    submissionId: 't_sub_s10',
    policyVersion: '2026-06',
    scopes: ['collection_storage', 'training', 'research', 'voice_use'],
    attributionPreference: 'pseudonymous',
    grantedAt: T_NOW - 10 * DAY,
  },
  // EDGE: public attribution granted
  {
    _id: 't_record_2',
    userId: CHANGA_TEST_USERS.kevin._id,
    submissionId: 't_sub_s15',
    policyVersion: '2026-06',
    scopes: ['collection_storage', 'training', 'research', 'public_release'],
    attributionPreference: 'public',
    grantedAt: T_NOW - 20 * HOUR,
  },
  // EDGE: research-only, no training scope
  {
    _id: 't_record_3',
    userId: CHANGA_TEST_USERS.amina._id,
    submissionId: 't_sub_s18',
    policyVersion: '2026-01',
    scopes: ['collection_storage', 'research'],
    attributionPreference: 'private',
    grantedAt: T_NOW - 30 * HOUR,
  },
  // EDGE: consent later revoked -> training/release must exclude this submission
  {
    _id: 't_record_4',
    userId: CHANGA_TEST_USERS.ghost._id,
    submissionId: 't_sub_s19',
    policyVersion: '2026-01',
    scopes: ['collection_storage'],
    attributionPreference: 'private',
    grantedAt: T_NOW - 30 * DAY,
    revokedAt: T_NOW - 10 * DAY,
  },
];

// ---------------------------------------------------------------------------
// INVITES  ->  getMyInviteCode / getInviteStats
// ---------------------------------------------------------------------------

export const CHANGA_TEST_INVITES = [
  {
    _id: 't_invite_1',
    inviterUserId: CHANGA_TEST_USERS.wanjiku._id,
    inviteCode: 'SAMI-TEST42',
    channel: 'whatsapp',
    clickedAt: T_NOW - 9 * DAY,
    clickedByUserId: CHANGA_TEST_USERS.amina._id,
    firstContributionAt: T_NOW - 8 * DAY,
    createdAt: T_NOW - 10 * DAY,
  },
  {
    _id: 't_invite_2',
    inviterUserId: CHANGA_TEST_USERS.wanjiku._id,
    inviteCode: 'SAMI-TEST43',
    channel: 'twitter',
    clickedAt: T_NOW - 5 * DAY,
    clickedByUserId: CHANGA_TEST_USERS.otieno._id,
    createdAt: T_NOW - 6 * DAY,
  },
  {
    _id: 't_invite_3',
    inviterUserId: CHANGA_TEST_USERS.wanjiku._id,
    inviteCode: 'SAMI-TEST44',
    channel: 'sms',
    createdAt: T_NOW - 3 * DAY,
  },
  // EDGE: clicked but never converted
  {
    _id: 't_invite_4',
    inviterUserId: CHANGA_TEST_USERS.wanjiku._id,
    inviteCode: 'SAMI-TEST45',
    channel: 'clipboard',
    clickedAt: T_NOW - 2 * DAY,
    clickedByUserId: CHANGA_TEST_USERS.ghost._id,
    createdAt: T_NOW - 2 * DAY,
  },
  // EDGE: anonymous click (no signed-in user yet)
  {
    _id: 't_invite_5',
    inviterUserId: CHANGA_TEST_USERS.wanjiku._id,
    inviteCode: 'SAMI-TEST46',
    channel: 'qr',
    clickedAt: T_NOW - 1 * DAY,
    createdAt: T_NOW - 1 * DAY,
  },
];

// getInviteStats() computed shape (must match the query's return).
export const CHANGA_TEST_INVITE_STATS = {
  totalInvites: 5,
  clickedInvites: 4,
  convertedInvites: 1,
  conversionRate: 20,
};

// getMyInviteCode() returns the most recent code (or null when signed out).
export const CHANGA_TEST_MY_INVITE_CODE = 'SAMI-TEST46';

// ---------------------------------------------------------------------------
// XP / LEVEL PROFILES  ->  getMyXPProfile
// LEVEL_THRESHOLDS: [0,17,67,150,283,483,750,1083,1583,2416] (level = index+1).
// ---------------------------------------------------------------------------

export const CHANGA_TEST_XP_PROFILES = {
  // EDGE: mid-level -> partial percentage (xp=145, band 67..150 -> 94%)
  midLevel: {
    xp: 145,
    level: 3,
    progress: 94,
    nextLevelXP: 150,
    streakDays: 7,
    trustScore: 104,
    contributionCount: 6,
    badges: ['first_contribution', 'audio_contributor', 'streak_7'],
  },
  // EDGE: maximum level -> progress pinned at 100
  maxLevel: {
    xp: 2600,
    level: 10,
    progress: 100,
    nextLevelXP: 2416,
    streakDays: 30,
    trustScore: 300,
    contributionCount: 152,
    badges: [
      'first_contribution',
      'ten_contributions',
      'audio_contributor',
      'rare_language_champion',
      'streak_7',
      'streak_30',
      'validator',
      'language_master',
    ],
  },
  // EDGE: brand-new -> xp 0, level 1, 0% progress, streak 0
  newUser: {
    xp: 0,
    level: 1,
    progress: 0,
    nextLevelXP: 17,
    streakDays: 0,
    trustScore: 0,
    contributionCount: 0,
    badges: [],
  },
  // EDGE: signed-out -> the query returns null (UI shows the sign-in prompt)
  guest: null,
} as const;

// XP awards the mutation layer should produce for each submission type
// (mirrors calculateXPLocal in convex/changa/xp.ts).
export const CHANGA_TEST_XP_AWARDS = [
  {
    taskType: 'lexicon_entry',
    baseXp: 5,
    audioBonus: 0,
    rareMultiplier: false,
    expectedTotalXp: 5,
  },
  {
    taskType: 'phrase_translation',
    baseXp: 8,
    audioBonus: 0,
    rareMultiplier: false,
    expectedTotalXp: 8,
  },
  {
    taskType: 'sentence_translation',
    baseXp: 8,
    audioBonus: 0,
    rareMultiplier: false,
    expectedTotalXp: 8,
  },
  {
    taskType: 'cultural_context',
    baseXp: 10,
    audioBonus: 0,
    rareMultiplier: false,
    expectedTotalXp: 10,
  },
  { taskType: 'story', baseXp: 25, audioBonus: 0, rareMultiplier: false, expectedTotalXp: 25 },
  // EDGE: audio reading adds the +7 audio bonus
  {
    taskType: 'audio_reading',
    baseXp: 5,
    audioBonus: 7,
    rareMultiplier: false,
    expectedTotalXp: 12,
  },
  // EDGE: rare language multiplies by 1.5 -> 5 * 1.5 = 7.5 -> rounds to 8
  { taskType: 'lexicon_entry', baseXp: 5, audioBonus: 0, rareMultiplier: true, expectedTotalXp: 8 },
  {
    taskType: 'unsupported_custom_type',
    baseXp: 10,
    audioBonus: 0,
    rareMultiplier: false,
    expectedTotalXp: 10,
  },
];

// ---------------------------------------------------------------------------
// BADGES  ->  listBadges (verbatim BADGE_CATALOG from convex/changa/badges.ts)
// ---------------------------------------------------------------------------

export const CHANGA_TEST_BADGES = [
  {
    id: 'first_contribution',
    title: 'First Step',
    description: 'Submitted your first Changa contribution.',
    icon: 'footprint',
    criterion: 'contributionCount >= 1',
  },
  {
    id: 'ten_contributions',
    title: '10 Contributions',
    description: 'Contributed ten times to your language.',
    icon: 'auto_awesome',
    criterion: 'contributionCount >= 10',
  },
  {
    id: 'audio_contributor',
    title: 'Voice Carrier',
    description: 'Recorded at least one audio reading.',
    icon: 'mic',
    criterion: 'any audio_reading submission',
  },
  {
    id: 'rare_language_champion',
    title: 'Rare Language Champion',
    description: 'Contributed in a rare or endangered language.',
    icon: 'language',
    criterion: 'any submission with a rare language code',
  },
  {
    id: 'streak_7',
    title: 'Week-Long Streak',
    description: 'Contributed seven days in a row.',
    icon: 'local_fire_department',
    criterion: 'streakDays >= 7',
  },
  {
    id: 'streak_30',
    title: '30-Day Streak',
    description: 'A whole month of daily contributions.',
    icon: 'whatshot',
    criterion: 'streakDays >= 30',
  },
  {
    id: 'validator',
    title: 'Validator',
    description: 'Cast at least five validation votes.',
    icon: 'fact_check',
    criterion: 'validationCount >= 5',
  },
  {
    id: 'language_master',
    title: 'Language Master',
    description: 'Reached the highest Changa level.',
    icon: 'workspace_premium',
    criterion: 'level >= 10',
  },
];

// Earned-badge states to render the badge shelf in three conditions.
export const CHANGA_TEST_EARNED_BADGES = {
  partiallyEarned: ['first_contribution', 'audio_contributor', 'streak_7'],
  noneEarned: [],
  allEarned: CHANGA_TEST_BADGES.map((badge) => badge.id),
} as const;

// ---------------------------------------------------------------------------
// LEADERBOARDS
// getCampaignWithLeaderboard -> { campaign, leaderboard[] }
// getCampaignLeaderboard    -> [{ userId, submissionCount }]  (raw, no names)
// ---------------------------------------------------------------------------

export const CHANGA_TEST_CAMPAIGN_LEADERBOARD = {
  campaign: {
    _id: 't_campaign_sw',
    title: 'Kiswahili Phrase Harvest',
    description: 'Collect everyday Kiswahili phrases and their translations.',
    languageCode: 'sw',
    goalCount: 1000,
    currentCount: 412,
    status: 'active',
    startAt: T_NOW - 21 * DAY,
    endAt: undefined,
    taskTypes: ['phrase_translation', 'lexicon_entry'],
  },
  leaderboard: [
    {
      rank: 1,
      userId: CHANGA_TEST_USERS.amina._id,
      name: 'Amina Hassan',
      avatar: '',
      submissionCount: 4,
    },
    {
      rank: 2,
      userId: CHANGA_TEST_USERS.wanjiku._id,
      name: 'Wanjiku Mwangi',
      avatar: '',
      submissionCount: 3,
    },
    // EDGE: tie on submissionCount -> ranks must stay sequential (2, 3, 4)
    {
      rank: 3,
      userId: CHANGA_TEST_USERS.otieno._id,
      name: 'Otieno Ochieng',
      avatar: '',
      submissionCount: 3,
    },
    // EDGE: contributor whose user doc was deleted -> name falls back to "Unknown"
    { rank: 4, userId: 't_user_deleted', name: 'Unknown', avatar: '', submissionCount: 1 },
  ],
} as const;

export const CHANGA_TEST_RAW_CAMPAIGN_LEADERBOARD = [
  { userId: CHANGA_TEST_USERS.amina._id, submissionCount: 4 },
  { userId: CHANGA_TEST_USERS.wanjiku._id, submissionCount: 3 },
  { userId: CHANGA_TEST_USERS.otieno._id, submissionCount: 3 },
  { userId: 't_user_deleted', submissionCount: 1 },
];

// ---------------------------------------------------------------------------
// AGGREGATE STATS  ->  getLanguageProgressStats / getPlatformStats
// ---------------------------------------------------------------------------

export const CHANGA_TEST_LANGUAGE_PROGRESS = {
  // EDGE: a language with tasks, submissions, curated examples and campaigns
  rich: {
    languageCode: 'sheng',
    openTasks: 8,
    submissions: 11,
    curatedExamples: 4,
    activeCampaigns: 2,
  },
  // EDGE: a language with nothing yet -> all zeros (views must not crash)
  empty: {
    languageCode: 'ig',
    openTasks: 1,
    submissions: 0,
    curatedExamples: 0,
    activeCampaigns: 0,
  },
  // EDGE: rare language with a single open task
  rare: {
    languageCode: 'El Molo',
    openTasks: 1,
    submissions: 0,
    curatedExamples: 0,
    activeCampaigns: 0,
  },
} as const;

export const CHANGA_TEST_PLATFORM_STATS = {
  totalContributions: 5,
  // NOTE: convex/changa/stats.ts queries `releaseStatus: "published"`, which is
  // NOT in changaReleaseStatusValidator, so the real query always yields 0 here.
  wordsPreserved: 0,
  activeCampaigns: 7,
  distinctLanguages: 9,
  languagesCountIsApprox: false,
  updatedAt: T_NOW,
};

// ---------------------------------------------------------------------------
// QUERY-MOCK WIRING MAP
// Optional convenience: keys are the canonical Convex function names used by
// the fallback resolvers in src/hooks/useChangaData.ts, so these fixtures can
// be dropped behind the existing probe-gated mock layer without touching any
// component code. Client-side reads only — nothing here writes to a database.
// ---------------------------------------------------------------------------

// Typed predicates the map filters with. Each parameter type is a supertype of
// the heterogeneous fixture rows, so TypeScript accepts them without casts.
const isOpenUnexpiredTask = (task: { status?: string; expiresAt?: number }) =>
  task.status === 'open' && (!task.expiresAt || task.expiresAt > T_NOW);
const isWanjikuSubmission = (submission: { _id: string; userId?: string }) =>
  submission.userId === CHANGA_TEST_USERS.wanjiku._id;
const hasNoCurrentUserVote = (row: { hasCurrentUserVote?: boolean }) => !row.hasCurrentUserVote;
const isValidatedSubmission = (submission: { status?: string }) =>
  submission.status === 'validated';
const isCandidateExample = (example: { releaseStatus?: string }) =>
  example.releaseStatus === 'candidate';

export const CHANGA_TEST_QUERY_MOCKS: Record<string, unknown> = {
  'changa/badges:listBadges': CHANGA_TEST_BADGES,
  'changa/campaigns:listActiveCampaigns': CHANGA_TEST_CAMPAIGNS.filter(
    (campaign) => campaign.status === 'active'
  ),
  'changa/campaigns:listEndedCampaigns': CHANGA_TEST_CAMPAIGNS.filter(
    (campaign) => campaign.status === 'completed' || campaign.status === 'archived'
  ),
  'changa/campaigns:listCampaignProposals': CHANGA_TEST_CAMPAIGN_PROPOSALS,
  'changa/campaigns:getCampaignWithLeaderboard': CHANGA_TEST_CAMPAIGN_LEADERBOARD,
  'changa/campaigns:getCampaignLeaderboard': CHANGA_TEST_RAW_CAMPAIGN_LEADERBOARD,
  'changa/tasks:listAvailableTasks': CHANGA_TEST_TASKS.filter(isOpenUnexpiredTask),
  'changa/tasks:getTask': CHANGA_TEST_TASKS[0],
  'changa/tasks:getActiveTaskClaim': CHANGA_TEST_TASK_CLAIMS[0],
  'changa/submissions:listUserSubmissions': CHANGA_TEST_SUBMISSIONS.filter(isWanjikuSubmission),
  'changa/submissions:listAllSubmissions': CHANGA_TEST_SUBMISSIONS,
  'changa/submissions:getSubmission': CHANGA_TEST_SUBMISSIONS[3],
  'changa/submissions:getSubmissionProcessingRuns': CHANGA_TEST_PROCESSING_RUNS,
  'changa/processing:getSubmissionStatus': CHANGA_TEST_SUBMISSIONS[3],
  'changa/validation:listValidationQueue':
    CHANGA_TEST_VALIDATION_QUEUE.filter(hasNoCurrentUserVote),
  'changa/curation:listCuratedCandidates': CHANGA_TEST_SUBMISSIONS.filter(isValidatedSubmission),
  'changa/curation:listDatasetReleaseCandidates':
    CHANGA_TEST_CURATED_EXAMPLES.filter(isCandidateExample),
  'changa/documents:listUserDocuments': CHANGA_TEST_DOCUMENTS,
  'changa/documents:getDocument': CHANGA_TEST_DOCUMENTS[0],
  'changa/customTasks:listCustomTemplatesForCampaign': CHANGA_TEST_CUSTOM_TEMPLATES,
  'changa/evaluation:listEvaluationSets': CHANGA_TEST_EVALUATION_SETS,
  'changa/evaluation:listReleaseMembers': CHANGA_TEST_RELEASE_MEMBERS,
  'changa/stats:getUserContributionStats': CHANGA_TEST_USER_STATS[0],
  'changa/stats:getLanguageProgressStats': CHANGA_TEST_LANGUAGE_PROGRESS.rich,
  'changa/stats:getPlatformStats': CHANGA_TEST_PLATFORM_STATS,
  'changa/invites:getInviteStats': CHANGA_TEST_INVITE_STATS,
  'changa/invites:getMyInviteCode': CHANGA_TEST_MY_INVITE_CODE,
  'changa/xp:getMyXPProfile': CHANGA_TEST_XP_PROFILES.midLevel,
  'changa/reputation:getMyChangaRole': 'community_reviewer',
};
