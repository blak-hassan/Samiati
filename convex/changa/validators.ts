import { v } from "convex/values";

export const changaTaskTypeValues = [
    "lexicon_entry",
    "phrase_translation",
    "sentence_translation",
    "audio_reading",
    "transcription",
    "cultural_context",
    "dialect_mapping",
    "validation",
] as const;

export const changaTaskTypeValidator = v.union(
    v.literal("lexicon_entry"),
    v.literal("phrase_translation"),
    v.literal("sentence_translation"),
    v.literal("audio_reading"),
    v.literal("transcription"),
    v.literal("cultural_context"),
    v.literal("dialect_mapping"),
    v.literal("validation"),
);

export const changaSourceModeValidator = v.union(
    v.literal("prompted"),
    v.literal("freeform"),
    v.literal("challenge"),
);

export const changaSchemaFieldValidator = v.object({
    id: v.string(),
    label: v.string(),
    inputType: v.union(
        v.literal("text"),
        v.literal("textarea"),
        v.literal("audio"),
        v.literal("select"),
        v.literal("checkbox"),
    ),
    required: v.boolean(),
    options: v.optional(v.array(v.string())),
});

export const changaInputFieldValidator = v.object({
    id: v.string(),
    label: v.string(),
    inputType: v.union(
        v.literal("text"),
        v.literal("textarea"),
        v.literal("audio"),
        v.literal("select"),
        v.literal("checkbox"),
    ),
    required: v.boolean(),
    options: v.optional(v.array(v.string())),
});

export const changaPriorityValidator = v.union(
    v.literal("low"),
    v.literal("normal"),
    v.literal("high"),
    v.literal("critical"),
);

export const changaTaskStatusValidator = v.union(
    v.literal("open"),
    v.literal("paused"),
    v.literal("full"),
    v.literal("closed"),
);

export const changaRewardProfileValidator = v.object({
    baseXp: v.number(),
    bonusXp: v.optional(v.number()),
    scarceLanguageMultiplier: v.optional(v.number()),
    streakMultiplier: v.optional(v.number()),
    validationXp: v.optional(v.number()),
});

export const changaSpeakerProfileValidator = v.object({
    regionCode: v.optional(v.string()),
    ageBand: v.optional(v.string()),
    gender: v.optional(v.string()),
    selfReportedFluency: v.optional(v.string()),
});

export const changaConsentValidator = v.object({
    isGranted: v.boolean(),
    allowTraining: v.boolean(),
    allowResearch: v.boolean(),
    allowPublicAttribution: v.boolean(),
    grantedAt: v.number(),
});

export const changaLicenseValidator = v.union(
    v.literal("community"),
    v.literal("cc-by-4.0"),
    v.literal("cc-by-sa-4.0"),
    v.literal("internal"),
);

export const changaAutoChecksValidator = v.object({
    duplicateScore: v.optional(v.number()),
    languageConfidence: v.optional(v.number()),
    transcriptionConfidence: v.optional(v.number()),
    piiRiskScore: v.optional(v.number()),
    profanityRiskScore: v.optional(v.number()),
    audioQualityScore: v.optional(v.number()),
    passed: v.optional(v.boolean()),
});

export const changaSubmissionStatusValidator = v.union(
    v.literal("draft"),
    v.literal("submitted"),
    v.literal("needs_fix"),
    v.literal("in_validation"),
    v.literal("validated"),
    v.literal("rejected"),
    v.literal("curated"),
);

export const changaValidatorRoleValidator = v.union(
    v.literal("peer"),
    v.literal("moderator"),
    v.literal("expert"),
);

export const changaValidationVoteValidator = v.union(
    v.literal("accept"),
    v.literal("minor_fix"),
    v.literal("reject"),
    v.literal("duplicate"),
    v.literal("unsafe"),
    v.literal("unclear_audio"),
    v.literal("wrong_language"),
);

export const changaAssignmentStatusValidator = v.union(
    v.literal("open"),
    v.literal("assigned"),
    v.literal("completed"),
    v.literal("skipped"),
);

export const changaExampleTypeValidator = v.union(
    v.literal("parallel_text"),
    v.literal("audio_transcript"),
    v.literal("audio_translation"),
    v.literal("lexicon_entry"),
    v.literal("cultural_note"),
    v.literal("validation_gold"),
);

export const changaSplitRecommendationValidator = v.union(
    v.literal("train"),
    v.literal("dev"),
    v.literal("test"),
    v.literal("holdout"),
);

export const changaReleaseStatusValidator = v.union(
    v.literal("candidate"),
    v.literal("approved"),
    v.literal("exported"),
    v.literal("retired"),
);

export const changaCampaignStatusValidator = v.union(
    v.literal("draft"),
    v.literal("active"),
    v.literal("paused"),
    v.literal("completed"),
    v.literal("archived"),
);
