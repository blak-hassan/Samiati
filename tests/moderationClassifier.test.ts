/**
 * Tests for the moderation classifier's soft-flag derivation.
 *
 * The classifier must NEVER auto-reject; the only behavior we test
 * here is whether a given score produces the expected set of flags.
 * The thresholds live in `SOFT_FLAG_THRESHOLDS`; tests use the same
 * constants so changing the thresholds is a one-line update to both
 * sides.
 */
import { describe, it, expect } from "vitest";
import {
    deriveSoftFlags,
    SOFT_FLAG_THRESHOLDS,
} from "../convex/changa/moderationClassifier";

describe("deriveSoftFlags", () => {
    it("produces no flags for an all-zero score", () => {
        const flags = deriveSoftFlags({
            toxicity: 0, insult: 0, threat: 0, identityAttack: 0, sexual: 0,
        });
        expect(flags).toEqual([]);
    });

    it("produces a toxicity flag only when the score exceeds the threshold", () => {
        expect(deriveSoftFlags({
            toxicity: SOFT_FLAG_THRESHOLDS.toxicity - 0.01,
            insult: 0, threat: 0, identityAttack: 0, sexual: 0,
        })).toEqual([]);
        expect(deriveSoftFlags({
            toxicity: SOFT_FLAG_THRESHOLDS.toxicity + 0.01,
            insult: 0, threat: 0, identityAttack: 0, sexual: 0,
        })).toHaveLength(1);
    });

    it("fires multiple flags when multiple scores exceed thresholds", () => {
        const flags = deriveSoftFlags({
            toxicity: 0.95,
            insult: 0.85,
            threat: 0.60,
            identityAttack: 0.70,
            sexual: 0.55,
        });
        const names = flags.map((f) => f.flag).sort();
        expect(names).toEqual([
            "model_identity_attack_high",
            "model_insult_high",
            "model_sexual_high",
            "model_threat_high",
            "model_toxicity_high",
        ]);
    });

    it("uses the lower threshold for threat and identity_attack than for toxicity", () => {
        // threat threshold is 0.50 (lower than toxicity's 0.80). A threat
        // score of 0.6 should fire even though it's well below the
        // toxicity threshold.
        const flags = deriveSoftFlags({
            toxicity: 0.5, // below toxicity threshold
            insult: 0.5,
            threat: 0.6,  // above threat threshold
            identityAttack: 0.0,
            sexual: 0.0,
        });
        const names = flags.map((f) => f.flag);
        expect(names).toContain("model_threat_high");
        expect(names).not.toContain("model_toxicity_high");
    });

    it("records the score and threshold for each flag (for observability)", () => {
        const flags = deriveSoftFlags({
            toxicity: 0.9,
            insult: 0, threat: 0, identityAttack: 0, sexual: 0,
        });
        expect(flags[0]).toEqual({
            flag: "model_toxicity_high",
            score: 0.9,
            threshold: SOFT_FLAG_THRESHOLDS.toxicity,
        });
    });

    it("treats a score exactly equal to the threshold as NOT exceeding it", () => {
        // The condition is strict `>`, so the boundary case is the
        // model's job to handle. Document the behavior.
        const flags = deriveSoftFlags({
            toxicity: SOFT_FLAG_THRESHOLDS.toxicity,
            insult: SOFT_FLAG_THRESHOLDS.insult,
            threat: SOFT_FLAG_THRESHOLDS.threat,
            identityAttack: SOFT_FLAG_THRESHOLDS.identityAttack,
            sexual: SOFT_FLAG_THRESHOLDS.sexual,
        });
        expect(flags).toEqual([]);
    });
});
