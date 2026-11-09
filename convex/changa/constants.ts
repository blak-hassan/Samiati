// Shared Changa constants.
//
// This module is imported by BOTH the Convex backend and the browser client,
// so it must stay free of server-only imports (no `convex/_generated/server`).

// Consent policy version used while no policy has been published yet. It keeps
// the pilot install working; once a data steward publishes a policy, the
// published version becomes authoritative (see `getActiveConsentPolicyVersion`
// in ./consent.ts).
export const FALLBACK_CONSENT_POLICY_VERSION = "changa-pilot-v1";

// Task types the quick-contribute flow can actually complete today.
//
// `audio_reading` is included because the contributor records their own voice
// and uploads it. `transcription` is deliberately excluded: it requires playing
// a prompt audio clip, but `changaTasks.promptAudioAssetId` is not a playable
// storage reference yet, so offering it would let a contributor echo the
// prompt back verbatim. `validation` has its own runner, and
// `cultural_context` / `dialect_mapping` have no dedicated input form yet.
export const CHANGA_QUICK_TASK_TYPES = [
    "lexicon_entry",
    "phrase_translation",
    "sentence_translation",
    "audio_reading",
] as const;

export type ChangaQuickTaskType = (typeof CHANGA_QUICK_TASK_TYPES)[number];

export function isChangaQuickTaskType(value: unknown): value is ChangaQuickTaskType {
    return (
        typeof value === "string" &&
        (CHANGA_QUICK_TASK_TYPES as readonly string[]).includes(value)
    );
}

// Anti-abuse velocity limits. These are deliberately conservative for the
// pilot; they prevent a single account from flooding the review queue.
//
// They live here so every path that creates a Changa submission — the
// task-contribution flow and the feedback-correction promotion — is bounded by
// the same budget.
export const MAX_SUBMISSIONS_PER_HOUR = 50;
export const MAX_SUBMISSIONS_PER_DAY = 300;
export const VELOCITY_WINDOW_MS = 60 * 60 * 1000;
export const DAY_WINDOW_MS = 24 * 60 * 60 * 1000;
