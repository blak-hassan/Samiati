// Shared feedback vocabulary.
//
// This module deliberately has no Convex server imports so the same rules can
// be used by the Convex backend, the browser client and the unit tests —
// the same arrangement as `convex/changa/constants.ts`.
//
// Two things live here:
//
//   1. The short public reference code a user can quote to support or a
//      moderator when reporting a bad answer (T3 Chat exposes a comparable
//      copyable feedback ID).
//   2. The rule that decides which Changa task type a correction is filed
//      under, so the client can preview it before the user commits.

// Prefix that makes a feedback code recognisable when it is read out loud.
export const FEEDBACK_CODE_PREFIX = "FB";

// Maximum length of the text a user may correct. The original response is
// capped at the same length, so a correction is never longer than the answer
// it replaces.
export const FEEDBACK_TEXT_MAX_LENGTH = 2000;

// Length of the shortest code suffix considered. The code is derived from a
// unique document id, so this is a uniqueness fallback rather than the norm.
export const FEEDBACK_CODE_MIN_LENGTH = 8;
export const FEEDBACK_CODE_MAX_LENGTH = 16;

// A correction at or below this word count is treated as a phrase; above it,
// as a full sentence. A single word is a lexicon entry.
export const FEEDBACK_PHRASE_WORD_LIMIT = 12;

/**
 * The Changa task types a correction can be filed under.
 *
 * `lexicon_entry` — a single word or term.
 * `phrase_translation` — a short phrase.
 * `sentence_translation` — a full sentence.
 */
export type FeedbackCorrectionType =
    | "lexicon_entry"
    | "phrase_translation"
    | "sentence_translation";

/**
 * Classify a correction by its shape.
 *
 * The Changa curator picks the final curated-example type when the submission
 * is promoted, so this classification is a filing hint, not a binding
 * decision. It still matters: it decides which processing profile runs and
 * how the item is labelled while it waits for peer review.
 */
export function classifyFeedbackCorrection(text: string): FeedbackCorrectionType {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length <= 1) return "lexicon_entry";
    if (words.length <= FEEDBACK_PHRASE_WORD_LIMIT) return "phrase_translation";
    return "sentence_translation";
}

/**
 * Feedback contexts whose correction is a text correction and can therefore be
 * filed as a Changa contribution.
 *
 * `voice` corrections are transcripts (the Changa transcription pipeline
 * expects an audio asset) and `tts` corrections are about pronunciation
 * rather than wording, so neither is a text contribution.
 */
export const PROMOTABLE_FEEDBACK_CONTEXTS = ["chat", "translate", "search"] as const;

export type PromotableFeedbackContext = (typeof PROMOTABLE_FEEDBACK_CONTEXTS)[number];

export function isPromotableFeedbackContext(
    contextType: string | undefined,
): contextType is PromotableFeedbackContext {
    return (
        typeof contextType === "string" &&
        (PROMOTABLE_FEEDBACK_CONTEXTS as readonly string[]).includes(contextType)
    );
}

/**
 * Build the candidate codes for a feedback document id, shortest first.
 *
 * The document id is unique, so the candidates are derived from it rather
 * than generated randomly. The caller checks each candidate against the
 * `by_code` index and takes the first that is free.
 */
export function feedbackCodeCandidates(documentId: string): string[] {
    const normalized = documentId.replace(/[^a-zA-Z0-9]/g, "");
    const candidates: string[] = [];
    for (
        let length = FEEDBACK_CODE_MIN_LENGTH;
        length <= Math.min(FEEDBACK_CODE_MAX_LENGTH, normalized.length);
        length += 2
    ) {
        candidates.push(`${FEEDBACK_CODE_PREFIX}-${normalized.slice(-length).toUpperCase()}`);
    }
    return candidates;
}

/**
 * The name of the task template that feedback corrections are filed under.
 *
 * Every promoted correction hangs off a task, because Changa is task-first:
 * a submission without a task has no contract to be reviewed against. One
 * template is shared by every correction so the contract stays consistent.
 */
export const AI_CORRECTION_TEMPLATE_NAME = "AI Correction";

/** The domain marker set on tasks created from feedback corrections. */
export const AI_CORRECTION_DOMAIN = "ai_correction";

/**
 * Why the user reported the answer, per feedback context.
 *
 * The vocabulary lives here — not in the feedback bar — so the reason shown
 * to a reviewer is the same one the contributor picked, and the server can
 * write it into the submission's context note.
 */
export const FEEDBACK_REASONS: Record<
    string,
    { id: string; label: string }[]
> = {
    chat: [
        { id: "incorrect", label: "Incorrect" },
        { id: "not_natural", label: "Not natural" },
        { id: "offensive", label: "Offensive" },
        { id: "wrong_language", label: "Wrong language" },
        { id: "missing_context", label: "Missing context" },
        { id: "other", label: "Other" },
    ],
    translate: [
        { id: "bad_translation", label: "Bad translation" },
        { id: "not_natural", label: "Not natural" },
        { id: "wrong_register", label: "Wrong formality" },
        { id: "missing_meaning", label: "Lost meaning" },
        { id: "wrong_dialect", label: "Wrong dialect" },
        { id: "other", label: "Other" },
    ],
    voice: [
        { id: "wrong_transcript", label: "Wrong transcript" },
        { id: "wrong_language", label: "Wrong language" },
        { id: "misheard", label: "Misheard words" },
        { id: "other", label: "Other" },
    ],
    tts: [
        { id: "bad_pronunciation", label: "Bad pronunciation" },
        { id: "unnatural", label: "Unnatural voice" },
        { id: "wrong_language", label: "Wrong language accent" },
        { id: "other", label: "Other" },
    ],
    search: [
        { id: "incorrect", label: "Incorrect answer" },
        { id: "outdated", label: "Outdated info" },
        { id: "hallucination", label: "Hallucination" },
        { id: "irrelevant", label: "Irrelevant" },
        { id: "other", label: "Other" },
    ],
};

/**
 * The label for a reason id, or the id itself when it is not one we know.
 *
 * A reason is free text on the wire, so an unknown id must not break the
 * submission — it is shown verbatim instead.
 */
export function feedbackReasonLabel(contextType: string, reasonId: string): string {
    const reasons = FEEDBACK_REASONS[contextType];
    if (!reasons) return reasonId;
    return reasons.find((reason) => reason.id === reasonId)?.label ?? reasonId;
}
