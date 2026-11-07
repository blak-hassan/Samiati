import { describe, expect, it } from "vitest";

import {
  computeNovelty,
  computeQualityScore,
  englishFunctionWordRatio,
  expectedScriptRatio,
  normalizeForCompare,
  runQualityChecks,
  tokenSimilarity,
} from "@/lib/changa/quality";
import {
  canModerate,
  canReviewAlone,
  computeStanding,
  tierLabel,
} from "@/lib/changa/recognition";

const baseInput = {
  sourceText: "The community water pump has been out of order for three weeks.",
  submittedText: "Pampu ya maji ya jamii imekuwa haifanyi kazi kwa wiki tatu.",
  languageId: "kiswahili",
  script: "Latin" as const,
  existing: [],
};

describe("quality checks", () => {
  it("never auto-accepts, even when everything passes", () => {
    const report = runQualityChecks(baseInput);
    expect(report.autoAccepted).toBe(false);
  });

  it("passes a genuine translation", () => {
    const report = runQualityChecks(baseInput);
    expect(report.flagged).toBe(false);
    expect(report.checks.every((check) => check.passed)).toBe(true);
    expect(report.score).toBe(1);
  });

  it("flags an empty submission as blocking", () => {
    const report = runQualityChecks({ ...baseInput, submittedText: "   " });
    const check = report.checks.find((c) => c.id === "empty_or_trivial");
    expect(check?.passed).toBe(false);
    expect(check?.severity).toBe("block");
    expect(report.flagged).toBe(true);
  });

  it("flags a submission identical to the source", () => {
    const report = runQualityChecks({
      ...baseInput,
      submittedText: baseInput.sourceText,
    });
    const check = report.checks.find((c) => c.id === "empty_or_trivial");
    expect(check?.passed).toBe(false);
    expect(report.flagged).toBe(true);
  });

  it("flags an untranslated English submission", () => {
    const report = runQualityChecks({
      ...baseInput,
      submittedText:
        "The community water pump has been out of order for three weeks and it is not working.",
    });
    const check = report.checks.find((c) => c.id === "register_mismatch");
    expect(check?.passed).toBe(false);
  });

  it("flags a near-duplicate of an existing submission", () => {
    const report = runQualityChecks({
      ...baseInput,
      existing: [
        {
          id: "c1",
          submittedText:
            "Pampu ya maji ya jamii imekuwa haifanyi kazi kwa wiki tatu.",
          status: "accepted",
          languageId: "kiswahili",
        },
      ],
    });
    const check = report.checks.find((c) => c.id === "duplicate");
    expect(check?.passed).toBe(false);
    expect(report.flagged).toBe(true);
  });

  it("does not flag a genuinely different translation as a duplicate", () => {
    const report = runQualityChecks({
      ...baseInput,
      existing: [
        {
          id: "c1",
          submittedText: "Maji hayakuwa na mtiririko hapa kijiji.",
          status: "accepted",
          languageId: "kiswahili",
        },
      ],
    });
    const check = report.checks.find((c) => c.id === "duplicate");
    expect(check?.passed).toBe(true);
  });

  it("ignores contributions in other languages when checking duplicates", () => {
    const report = runQualityChecks({
      ...baseInput,
      existing: [
        {
          id: "c1",
          submittedText:
            "Pampu ya maji ya jamii imekuwa haifanyi kazi kwa wiki tatu.",
          status: "accepted",
          languageId: "kikuyu",
        },
      ],
    });
    const check = report.checks.find((c) => c.id === "duplicate");
    expect(check?.passed).toBe(true);
  });

  it("flags a submission written in the wrong script", () => {
    const report = runQualityChecks({
      ...baseInput,
      script: "Latin",
      submittedText: "المضخة",
    });
    const check = report.checks.find((c) => c.id === "script_mismatch");
    expect(check?.passed).toBe(false);
    expect(check?.severity).toBe("block");
  });

  it("notices an unusual length without blocking", () => {
    const report = runQualityChecks({
      ...baseInput,
      submittedText: "Ndugu.",
    });
    const check = report.checks.find((c) => c.id === "length_outlier");
    expect(check?.severity).toBe("info");
  });
});

describe("quality text utilities", () => {
  it("normalises case, diacritics and punctuation", () => {
    expect(normalizeForCompare("Habari za asubuhi!")).toBe("habari za asubuhi");
    expect(normalizeForCompare("  Karibu   sana ")).toBe("karibu sana");
  });

  it("scores identical text as fully similar and unrelated text as not", () => {
    expect(tokenSimilarity("a b c", "a b c")).toBe(1);
    expect(tokenSimilarity("a b c", "x y z")).toBe(0);
  });

  it("scores partial overlap between the two", () => {
    const score = tokenSimilarity("a b c d", "a b x y");
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  it("detects English function words", () => {
    expect(englishFunctionWordRatio("the pump is not working")).toBeGreaterThan(0.45);
    expect(englishFunctionWordRatio("pampu imeharibika")).toBe(0);
  });

  it("measures the proportion of characters in the expected script", () => {
    expect(expectedScriptRatio("habari", "Latin")).toBe(1);
    expect(expectedScriptRatio("مرحبا", "Arabic")).toBe(1);
    expect(expectedScriptRatio("hello مرحبا", "Latin")).toBeCloseTo(0.5, 1);
  });

  it("scores novelty against a corpus", () => {
    expect(computeNovelty("brand new text", [])).toBe(1);
    expect(computeNovelty("same text", ["same text"])).toBe(0);
  });
  it("weights review judgement most heavily", () => {
    const base = {
      reviewScore: 0.5,
      agreement: 0.5,
      consistency: 0.5,
      novelty: 0.5,
      reliability: 0.5,
    };
    const baseline = computeQualityScore(base);

    // Moving any single signal from 0.5 to 1 moves the score by that signal's
    // weight. Review judgement must move it the most.
    const lift = (signal: keyof typeof base) =>
      computeQualityScore({ ...base, [signal]: 1 }) - baseline;

    expect(lift("reviewScore")).toBeGreaterThan(lift("agreement"));
    expect(lift("reviewScore")).toBeGreaterThan(lift("consistency"));
    expect(lift("reviewScore")).toBeGreaterThan(lift("novelty"));
    expect(lift("reviewScore")).toBeGreaterThan(lift("reliability"));
  });

  it("stays within 0 and 1", () => {
    const score = computeQualityScore({
      reviewScore: 2,
      agreement: -1,
      consistency: 5,
      novelty: 0,
      reliability: 1,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("is not a count: volume alone does not raise it", () => {
    // Reliability is the only signal a spammer could inflate cheaply, and it
    // is weighted at 0.15.
    const spam = computeQualityScore({
      reviewScore: 0.1,
      agreement: 0.1,
      consistency: 0.1,
      novelty: 0.1,
      reliability: 1,
    });
    expect(spam).toBeLessThan(0.3);
  });
});

describe("standing and recognition", () => {
  const empty = {
    userId: "u1",
    accepted: 0,
    rejected: 0,
    needsRevision: 0,
    reviews: 0,
    agreement: 0,
    meanQuality: 0,
    points: 0,
    hasModerated: false,
  };

  it("starts with no tier", () => {
    expect(computeStanding(empty).tier).toBe("none");
  });

  it("earns the first tier after one accepted contribution", () => {
    const standing = computeStanding({ ...empty, accepted: 1 });
    expect(standing.tier).toBe("first");
    expect(standing.nextTier).toBe("trusted");
  });

  it("requires quality, not just volume, for the trusted tier", () => {
    const lowQuality = computeStanding({
      ...empty,
      accepted: 30,
      meanQuality: 0.4,
    });
    expect(lowQuality.tier).not.toBe("trusted");

    const goodQuality = computeStanding({
      ...empty,
      accepted: 30,
      meanQuality: 0.85,
    });
    expect(goodQuality.tier).toBe("trusted");
  });

  it("requires agreement for the reviewer tier", () => {
    const standing = computeStanding({
      ...empty,
      accepted: 10,
      reviews: 60,
      agreement: 0.9,
      meanQuality: 0.8,
    });
    expect(standing.tier).toBe("reviewer");
    expect(canReviewAlone(standing)).toBe(true);
  });

  it("does not let a new reviewer approve alone", () => {
    const standing = computeStanding({ ...empty, accepted: 3 });
    expect(canReviewAlone(standing)).toBe(false);
    expect(canModerate(standing)).toBe(false);
  });

  it("only lets a steward moderate", () => {
    const standing = computeStanding({
      ...empty,
      accepted: 600,
      reviews: 100,
      agreement: 0.95,
      meanQuality: 0.9,
      hasModerated: true,
    });
    expect(standing.tier).toBe("steward");
    expect(canModerate(standing)).toBe(true);
  });

  it("computes reliability as the acceptance rate", () => {
    const standing = computeStanding({ ...empty, accepted: 3, rejected: 1 });
    expect(standing.reliability).toBe(0.75);
  });

  it("labels every tier", () => {
    for (const tier of ["none", "first", "trusted", "reviewer", "steward"] as const) {
      expect(tierLabel(tier).length).toBeGreaterThan(0);
    }
  });
});
