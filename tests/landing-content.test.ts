// tests/landing-content.test.ts
// Guards the landing page's factual claims against drift.
//
// Regression: the trust strip hard-coded "50+ Languages" / "30+ African
// Countries" while the FAQ directly beneath it admitted nine languages. These
// tests fail if the two ever contradict each other again, and if any stat
// reverts to an unverifiable corpus-size claim.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  FAQS,
  LANDING_STATS,
  SUPPORTED_LANGUAGE_NAMES,
  FREE_PLAN,
  FREE_DAILY_MESSAGES,
} from "@/lib/landingContent";
import { LANGUAGES } from "@/lib/languages";
import { PLANS } from "@/lib/plans";

const pageSource = readFileSync(
  resolve(process.cwd(), "src/app/page.tsx"),
  "utf8",
);

describe("landing content", () => {
  it("the trust strip never claims more languages than we actually support", () => {
    const languageStat = LANDING_STATS.find((s) => /languages/i.test(s.label));
    expect(languageStat, "a 'languages' stat should exist").toBeDefined();

    const claimed = Number(languageStat!.value);
    expect(Number.isNaN(claimed)).toBe(false);
    // The old copy read "50+". The real table has LANGUAGES.length entries.
    expect(claimed).toBe(LANGUAGES.length);
  });

  it("does not ship unverifiable corpus-size claims", () => {
    const joined = LANDING_STATS.map((s) => `${s.value} ${s.label}`).join(" | ");
    for (const forbidden of [
      "Words Preserved",
      "Contributions",
      "African Countries",
    ]) {
      expect(joined).not.toContain(forbidden);
    }
    // No "+" inflation on any stat value.
    for (const stat of LANDING_STATS) {
      expect(stat.value).not.toContain("+");
    }
  });

  it("the FAQ language answer lists every supported language", () => {
    const languagesFaq = FAQS.find((f) => /which languages/i.test(f.question));
    expect(languagesFaq).toBeDefined();
    for (const name of SUPPORTED_LANGUAGE_NAMES) {
      expect(languagesFaq!.answer).toContain(name);
    }
  });

  it("every FAQ entry has a non-empty question and answer (JSON-LD needs both)", () => {
    expect(FAQS.length).toBeGreaterThan(0);
    for (const faq of FAQS) {
      expect(faq.question.trim().length).toBeGreaterThan(0);
      expect(faq.answer.trim().length).toBeGreaterThan(0);
    }
  });

  it("the free-plan facts come from the PLANS table, not hard-coded copy", () => {
    expect(FREE_PLAN.price).toBe("Free");
    expect(PLANS.some((p) => p.title === FREE_PLAN.title)).toBe(true);
    if (FREE_DAILY_MESSAGES !== null) {
      expect(FREE_DAILY_MESSAGES).toBeGreaterThan(0);
      // And the FAQ's opening answer must agree with the derived number.
      const pricingFaq = FAQS.find((f) => /free to use/i.test(f.question));
      expect(pricingFaq!.answer).toContain(
        `${FREE_DAILY_MESSAGES} AI messages per day`,
      );
    }
  });
});

describe("landing page wiring", () => {
  it("renders the shared PricingCard instead of duplicating it inline", () => {
    expect(pageSource).toContain("PricingCard");
    // The inline hand-rolled checkmark svg is gone.
    expect(pageSource).not.toMatch(/<svg[\s\S]{0,200}M5 13l4 4L19 7/);
  });

  it("emits FAQPage structured data built from the shared FAQS array", () => {
    expect(pageSource).toContain("application/ld+json");
    expect(pageSource).toContain("FAQPage");
    // Uses the imported array rather than a second hard-coded copy.
    expect(pageSource).toMatch(/faqs\.map\(/);
  });

  it("does not advertise a launch waitlist while selling live plans", () => {
    // Assert on the rendered JSX props rather than the whole file — the source
    // contains explanatory comments that legitimately use the phrase.
    expect(pageSource).not.toMatch(/title="[^"]*waitlist/i);
    expect(pageSource).not.toMatch(/description="[^"]*(waitlist|launch)/i);

    const waitlistSource = readFileSync(
      resolve(process.cwd(), "src/components/WaitlistForm.tsx"),
      "utf8",
    );
    // Assert on the default *values* only — comments in this file deliberately
    // quote the old launch copy when explaining why it changed.
    for (const key of ["title", "description", "successMessage"]) {
      const match = new RegExp(`${key} = (['"])(.*?)\\1`, "i").exec(
        waitlistSource,
      );
      expect(match, `${key} default should be parseable`).not.toBeNull();
      expect(match![2], `${key} default must be launch-agnostic`).not.toMatch(
        /waitlist|launch/i,
      );
    }
  });
});
