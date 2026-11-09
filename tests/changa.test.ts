import { describe, it, expect } from "vitest";
import {
    classifyFeedbackCorrection,
    feedbackCodeCandidates,
    feedbackReasonLabel,
    isPromotableFeedbackContext,
    FEEDBACK_REASONS,
} from "../convex/feedbackConstants";
import {
    buildTrustScore,
    computeStreakDays,
    DAY_MS,
} from "../convex/changa/statsUtils";
import {
    CHANGA_QUICK_TASK_TYPES,
    FALLBACK_CONSENT_POLICY_VERSION,
    isChangaQuickTaskType,
} from "../convex/changa/constants";
import {
    changaCampaignTaskLabel,
    changaTaskLabel,
    changaTaskShortLabel,
} from "../src/lib/changa";

describe("classifyFeedbackCorrection", () => {
    it("treats a single word as a lexicon entry", () => {
        expect(classifyFeedbackCorrection("mũgithi")).toBe("lexicon_entry");
    });

    it("treats a short phrase as a phrase translation", () => {
        expect(classifyFeedbackCorrection("habari za asubuhi")).toBe("phrase_translation");
    });

    it("treats a long sentence as a sentence translation", () => {
        const sentence =
            "Nakuletea habari za asubuhi kwa sababu nilikuwa nafika mapema na kutaka kukutangulia vizuri wote";
        expect(classifyFeedbackCorrection(sentence)).toBe("sentence_translation");
    });

    it("ignores surrounding whitespace when counting words", () => {
        expect(classifyFeedbackCorrection("  mũgithi  ")).toBe("lexicon_entry");
    });

    it("classifies an empty correction as a lexicon entry rather than throwing", () => {
        expect(classifyFeedbackCorrection("")).toBe("lexicon_entry");
    });

    it("only produces task types the Changa schema accepts", () => {
        const types = [
            classifyFeedbackCorrection("mũgithi"),
            classifyFeedbackCorrection("habari za asubuhi"),
            classifyFeedbackCorrection(
                "Nakuletea habari za asubuhi kwa sababu nilikuwa nafika mapema na kutaka kukutangulia",
            ),
        ];
        for (const type of types) {
            expect([
                "lexicon_entry",
                "phrase_translation",
                "sentence_translation",
            ]).toContain(type);
        }
    });
});

describe("isPromotableFeedbackContext", () => {
    it("accepts the text contexts a correction can be filed under", () => {
        expect(isPromotableFeedbackContext("translate")).toBe(true);
        expect(isPromotableFeedbackContext("chat")).toBe(true);
        expect(isPromotableFeedbackContext("search")).toBe(true);
    });

    it("rejects contexts whose correction is not a text correction", () => {
        // A voice correction is a transcript and needs an audio asset; a tts
        // correction is about pronunciation rather than wording.
        expect(isPromotableFeedbackContext("voice")).toBe(false);
        expect(isPromotableFeedbackContext("tts")).toBe(false);
    });

    it("rejects a missing context", () => {
        expect(isPromotableFeedbackContext(undefined)).toBe(false);
    });
});

describe("feedbackReasonLabel", () => {
    it("returns the label the user picked", () => {
        expect(feedbackReasonLabel("translate", "wrong_dialect")).toBe("Wrong dialect");
        expect(feedbackReasonLabel("search", "hallucination")).toBe("Hallucination");
    });

    it("shows an unknown reason id verbatim rather than failing", () => {
        expect(feedbackReasonLabel("translate", "not_a_reason")).toBe("not_a_reason");
    });

    it("shows an unknown context's reason id verbatim", () => {
        expect(feedbackReasonLabel("not_a_context", "wrong_dialect")).toBe("wrong_dialect");
    });

    it("covers every reason the feedback bar can submit", () => {
        // Each reason is looked up under the context it belongs to, because
        // the same id can mean different things in different contexts.
        for (const [contextType, reasons] of Object.entries(FEEDBACK_REASONS)) {
            for (const reason of reasons) {
                expect(feedbackReasonLabel(contextType, reason.id)).toBe(reason.label);
            }
        }
    });
});

describe("feedbackCodeCandidates", () => {
    it("produces a prefixed code derived from the document id", () => {
        const candidates = feedbackCodeCandidates("kg2abcdef123456");
        expect(candidates.length).toBeGreaterThan(0);
        expect(candidates[0].startsWith("FB-")).toBe(true);
        expect(candidates[0]).toContain("123456".toUpperCase());
    });

    it("produces progressively longer candidates", () => {
        const candidates = feedbackCodeCandidates("kg2abcdef123456");
        expect(candidates[0].length).toBeLessThan(candidates[1].length);
    });

    it("strips characters that are not safe to read aloud", () => {
        const candidates = feedbackCodeCandidates("kg2-ab_cd ef");
        for (const candidate of candidates) {
            expect(candidate).toMatch(/^FB-[A-Z0-9]+$/);
        }
    });

    it("never produces a code for an id with no usable characters", () => {
        expect(feedbackCodeCandidates("---")).toEqual([]);
    });
});

describe("changa quick task types", () => {
    it("accepts every task type the quick-contribute form can complete", () => {
        for (const taskType of CHANGA_QUICK_TASK_TYPES) {
            expect(isChangaQuickTaskType(taskType)).toBe(true);
        }
    });

    it("rejects task types that have no working input form yet", () => {
        // Transcription needs a playable prompt clip, validation has its own
        // runner, and the remaining types have no dedicated form.
        expect(isChangaQuickTaskType("transcription")).toBe(false);
        expect(isChangaQuickTaskType("validation")).toBe(false);
        expect(isChangaQuickTaskType("cultural_context")).toBe(false);
        expect(isChangaQuickTaskType("dialect_mapping")).toBe(false);
    });

    it("rejects non-string values", () => {
        expect(isChangaQuickTaskType(undefined)).toBe(false);
        expect(isChangaQuickTaskType(null)).toBe(false);
        expect(isChangaQuickTaskType(42)).toBe(false);
        expect(isChangaQuickTaskType({ taskType: "lexicon_entry" })).toBe(false);
    });
});

describe("changa task labels", () => {
    it("falls back to a generic label for unknown task types", () => {
        expect(changaTaskLabel("lexicon_entry")).toBe("Add a word");
        expect(changaTaskLabel("not_a_task")).toBe("Quick task");
        expect(changaTaskLabel(undefined)).toBe("Quick task");
    });

    it("uses the short label for the activity list", () => {
        expect(changaTaskShortLabel("sentence_translation")).toBe("Sentence");
        expect(changaTaskShortLabel("not_a_task")).toBe("Changa task");
    });

    it("uses the plural label for campaign chips", () => {
        expect(changaCampaignTaskLabel("audio_reading")).toBe("Audio");
        expect(changaCampaignTaskLabel("not_a_task")).toBe("Tasks");
    });
});

describe("computeStreakDays", () => {
    const now = Date.UTC(2026, 0, 10, 12, 0, 0);

    it("returns 0 when there is no activity", () => {
        expect(computeStreakDays([], now)).toBe(0);
    });

    it("counts consecutive days ending today", () => {
        const timestamps = [
            now,
            now - DAY_MS,
            now - 2 * DAY_MS,
            now - 3 * DAY_MS,
        ];
        expect(computeStreakDays(timestamps, now)).toBe(4);
    });

    it("counts a streak that ends yesterday", () => {
        const timestamps = [now - DAY_MS, now - 2 * DAY_MS];
        expect(computeStreakDays(timestamps, now)).toBe(2);
    });

    it("breaks the streak when a day is skipped", () => {
        const timestamps = [now, now - DAY_MS, now - 3 * DAY_MS];
        expect(computeStreakDays(timestamps, now)).toBe(2);
    });

    it("reports a broken streak when the last activity is older than yesterday", () => {
        const timestamps = [now - 3 * DAY_MS, now - 4 * DAY_MS];
        expect(computeStreakDays(timestamps, now)).toBe(0);
    });

    it("counts multiple contributions on the same day once", () => {
        const timestamps = [now, now - 1000, now - DAY_MS];
        expect(computeStreakDays(timestamps, now)).toBe(2);
    });
});

describe("buildTrustScore", () => {
    it("is zero for a contributor with no activity", () => {
        expect(
            buildTrustScore({
                contributionCount: 0,
                validationCount: 0,
                acceptRate: 0,
                reviewAgreementRate: 0,
            }),
        ).toBe(0);
    });

    it("weights contributions, reviews and rates", () => {
        expect(
            buildTrustScore({
                contributionCount: 3,
                validationCount: 2,
                acceptRate: 0.5,
                reviewAgreementRate: 1,
            }),
        ).toBe(3 * 2 + 2 * 3 + 0.5 * 40 + 1 * 30);
    });
});

describe("consent policy fallback", () => {
    it("keeps a stable pilot version used when nothing is published", () => {
        expect(FALLBACK_CONSENT_POLICY_VERSION).toBe("changa-pilot-v1");
    });
});
