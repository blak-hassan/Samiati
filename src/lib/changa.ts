export {
    CHANGA_QUICK_TASK_TYPES,
    isChangaQuickTaskType,
} from "../../convex/changa/constants";
export type { ChangaQuickTaskType } from "../../convex/changa/constants";

// Verb-style labels used on the quick-contribute card ("Add a word").
export const CHANGA_TASK_TYPE_LABELS: Record<string, string> = {
    lexicon_entry: "Add a word",
    phrase_translation: "Translate a phrase",
    sentence_translation: "Translate a sentence",
    transcription: "Write what you hear",
    audio_reading: "Record a phrase",
    validation: "Validate an entry",
    cultural_context: "Cultural context",
    dialect_mapping: "Dialect mapping",
};

// Compact labels used in the activity list ("Word").
export const CHANGA_TASK_TYPE_SHORT_LABELS: Record<string, string> = {
    lexicon_entry: "Word",
    phrase_translation: "Phrase",
    sentence_translation: "Sentence",
    transcription: "Transcription",
    audio_reading: "Recording",
    validation: "Validation",
    cultural_context: "Cultural context",
    dialect_mapping: "Dialect mapping",
};

// Plural labels used for campaign task-type chips ("Words").
export const CHANGA_CAMPAIGN_TASK_TYPE_LABELS: Record<string, string> = {
    lexicon_entry: "Words",
    phrase_translation: "Phrases",
    sentence_translation: "Sentences",
    audio_reading: "Audio",
    transcription: "Transcription",
    cultural_context: "Culture",
    dialect_mapping: "Dialects",
};

export function changaTaskLabel(taskType: string | undefined): string {
    return (taskType && CHANGA_TASK_TYPE_LABELS[taskType]) || "Quick task";
}

export function changaTaskShortLabel(taskType: string | undefined): string {
    return (taskType && CHANGA_TASK_TYPE_SHORT_LABELS[taskType]) || "Changa task";
}

export function changaCampaignTaskLabel(taskType: string | undefined): string {
    return (taskType && CHANGA_CAMPAIGN_TASK_TYPE_LABELS[taskType]) || "Tasks";
}

/** Keep selection stable while a reactive queue removes completed reviews. */
export function nextUnreviewedSubmission<T extends { _id: string }>(
    queue: readonly T[] | undefined,
    reviewedIds: ReadonlySet<string>,
    activeId: string | null = null,
): T | undefined {
    const eligible = (submission: T) => !reviewedIds.has(submission._id);
    return queue?.find((submission) => submission._id === activeId && eligible(submission))
        ?? queue?.find(eligible);
}

/** The languages the quick-contribute flow offers today. */
export const CHANGA_LANGUAGE_OPTIONS = [
    { id: "sheng", label: "Sheng", emoji: "🔥" },
    { id: "sw", label: "Kiswahili", emoji: "🇰🇪" },
    { id: "en", label: "English", emoji: "🌍" },
] as const;

export const CHANGA_SHENG_DIALECTS = [
    { id: "nairobi_eastlands", label: "Nairobi Eastlands" },
    { id: "nairobi_westlands", label: "Nairobi Westlands" },
    { id: "coast", label: "Coast (Mombasa)" },
    { id: "kisumu", label: "Kisumu" },
    { id: "eldoret", label: "Eldoret" },
    { id: "general", label: "General Sheng" },
] as const;
