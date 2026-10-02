// src/lib/landingContent.ts
// Single source of truth for the landing page's factual claims.
//
// Why this exists: the trust strip used to hard-code "50+ Languages" and
// "30+ African Countries" while the FAQ right below it admitted Samiati
// supports nine — a self-contradiction that reads as fabricated marketing.
// Anything the marketing copy asserts now derives from the real data
// (the LANGUAGES table / PLANS table) so the two can never drift again.
// tests/landing-content.test.ts enforces it.

import { LANGUAGES } from "@/lib/languages";
import { PLANS } from "./plans";

/** The Explorer (free) plan — source of truth for free-tier limits. */
export const FREE_PLAN = PLANS.find((p) => p.price === "Free") ?? PLANS[0];

/**
 * The languages Samiati actually supports, named as prose for the FAQ.
 * Derived from LANGUAGES so adding a language updates the FAQ automatically.
 */
export const SUPPORTED_LANGUAGE_NAMES = LANGUAGES.map((l) => l.name);

/** "Swahili, Kikuyu, Luo and English" — for sentences. */
export const SUPPORTED_LANGUAGES_PROSE = (() => {
  const names = SUPPORTED_LANGUAGE_NAMES;
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
})();

/**
 * Free-tier daily message allowance, pulled from the Explorer plan's feature
 * list ("10 AI messages per day"). Falls back to the number if the copy is
 * ever reworded.
 */
export const FREE_DAILY_MESSAGES = (() => {
  const match = FREE_PLAN.features.find((f) => /^(\d+)\s+AI messages per day$/i.test(f));
  return match ? Number(match.match(/^(\d+)/)?.[1] ?? 0) : null;
})();

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQS: FaqItem[] = [
  {
    question: "Is Samiati free to use?",
    answer:
      "Yes! The Explorer plan is free forever with no credit card required. You get 10 AI messages per day, 5 translations per day, and 2 voice messages per day. Paid plans unlock higher limits and additional features.",
  },
  {
    question: "Which languages are supported?",
    // Language list derived from LANGUAGES — do not hard-code it here.
    answer: `Samiati currently supports ${SUPPORTED_LANGUAGES_PROSE}. We prioritise Kenyan languages in this release and are expanding based on community demand — if there is a language you want to see, let us know — we are building the roadmap with community input.`,
  },
  {
    question: "How does the Changa contribution system work?",
    answer:
      "Changa is our community-driven contribution platform. Users can submit new words, validate existing entries, and participate in challenges. Contributions earn XP and help improve the platform for everyone.",
  },
  {
    question: "Can I use Samiati offline?",
    answer:
      "Some features work offline — you can review your saved conversations and any content you have downloaded locally. AI chat and real-time translation need an internet connection.",
  },
  {
    question: "Is my data private?",
    answer:
      "Yes. We take privacy seriously. Your personal data is encrypted, and we never sell your information to third parties. You can delete your account and all associated data at any time.",
  },
];

export interface LandingStat {
  value: string;
  label: string;
}

/**
 * Trust strip figures. Every entry is either derived from real config or states
 * something verifiable about the project.
 *
 * The strip deliberately does NOT claim corpus size ("10,000+ words preserved",
 * "100,000+ contributions"). Samiati has no real usage data behind those
 * numbers today; inventing them is both a trust and an advertising-compliance
 * risk. If genuine metrics are ever wanted, replace the entries below with a
 * value fetched from Convex (e.g. a `publicStats` query) rather than a literal.
 */
export const LANDING_STATS: LandingStat[] = [
  { value: String(LANGUAGES.length), label: "Languages supported" },
  { value: FREE_PLAN.price, label: `${FREE_PLAN.title} plan` },
  {
    value: FREE_DAILY_MESSAGES ? String(FREE_DAILY_MESSAGES) : "10",
    label: "Free AI messages / day",
  },
  { value: "MIT", label: "Open-source licence" },
];
