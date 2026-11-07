/**
 * Contributor standing and recognition.
 *
 * Recognition in Changa is earned by quality, not by volume. A contributor
 * who submits ten thousand near-duplicates has not contributed more than one
 * who submits two hundred accurate translations.
 */

/* -------------------------------------------------------------------------- */
/*                                   Types                                     */
/* -------------------------------------------------------------------------- */

export type RecognitionTier =
  | "none"
  | "first"
  | "trusted"
  | "reviewer"
  | "steward";

export interface TierRequirement {
  tier: RecognitionTier;
  label: string;
  description: string;
  /** Accepted contributions needed. */
  accepted?: number;
  /** Minimum mean quality score needed. */
  minQuality?: number;
  /** Reviews completed. */
  reviews?: number;
  /** Minimum reviewer agreement needed. */
  minAgreement?: number;
}

export const TIER_REQUIREMENTS: readonly TierRequirement[] = [
  {
    tier: "first",
    label: "First contribution",
    description: "One accepted translation.",
    accepted: 1,
  },
  {
    tier: "trusted",
    label: "Trusted contributor",
    description:
      "Twenty-five accepted translations with a quality score of 0.7 or better.",
    accepted: 25,
    minQuality: 0.7,
  },
  {
    tier: "reviewer",
    label: "Reviewer",
    description:
      "Fifty reviews where other reviewers agreed with you 80% of the time.",
    reviews: 50,
    minAgreement: 0.8,
  },
  {
    tier: "steward",
    label: "Language steward",
    description:
      "Five hundred accepted translations, plus a record of community moderation.",
    accepted: 500,
    minQuality: 0.7,
  },
];

/* -------------------------------------------------------------------------- */
/*                                  Standing                                   */
/* -------------------------------------------------------------------------- */

export interface StandingInput {
  userId: string;
  /** Accepted contributions. */
  accepted: number;
  /** Rejected contributions. */
  rejected: number;
  /** Contributions sent back for revision. */
  needsRevision: number;
  /** Reviews completed. */
  reviews: number;
  /** How often this reviewer's decisions were upheld, 0-1. */
  agreement: number;
  /** Mean quality score of this contributor's accepted contributions, 0-1. */
  meanQuality: number;
  /** Points earned from accepted contributions. */
  points: number;
  /** Whether the contributor has moderated their language community. */
  hasModerated: boolean;
}

export interface ContributorStanding extends StandingInput {
  /** accepted / (accepted + rejected), 0-1. */
  reliability: number;
  tier: RecognitionTier;
  /** The next tier the contributor is working towards, if any. */
  nextTier?: RecognitionTier;
  /** Progress towards the next tier, 0-1. */
  progressToNext: number;
}

/**
 * Computes a contributor's standing.
 *
 * `reliability` is the acceptance rate. It is used as one signal among five
 * in the composite quality score, and as a gate on reviewer promotion.
 */
export function computeStanding(input: StandingInput): ContributorStanding {
  const reviewed = input.accepted + input.rejected;
  const reliability = reviewed === 0 ? 0 : input.accepted / reviewed;

  const base: ContributorStanding = {
    ...input,
    reliability,
    tier: "none",
    progressToNext: 0,
  };

  const steward = TIER_REQUIREMENTS.find((r) => r.tier === "steward")!;
  const reviewer = TIER_REQUIREMENTS.find((r) => r.tier === "reviewer")!;
  const trusted = TIER_REQUIREMENTS.find((r) => r.tier === "trusted")!;
  const first = TIER_REQUIREMENTS.find((r) => r.tier === "first")!;

  if (
    input.accepted >= (steward.accepted ?? Infinity) &&
    input.meanQuality >= (steward.minQuality ?? 0) &&
    input.hasModerated
  ) {
    return { ...base, tier: "steward", nextTier: undefined, progressToNext: 1 };
  }

  if (
    input.reviews >= (reviewer.reviews ?? Infinity) &&
    input.agreement >= (reviewer.minAgreement ?? 0)
  ) {
    return { ...base, tier: "reviewer", nextTier: "steward", progressToNext: progress(input, steward) };
  }

  if (
    input.accepted >= (trusted.accepted ?? Infinity) &&
    input.meanQuality >= (trusted.minQuality ?? 0)
  ) {
    return { ...base, tier: "trusted", nextTier: "reviewer", progressToNext: progress(input, reviewer) };
  }

  if (input.accepted >= (first.accepted ?? Infinity)) {
    return { ...base, tier: "first", nextTier: "trusted", progressToNext: progress(input, trusted) };
  }

  return { ...base, tier: "none", nextTier: "first", progressToNext: progress(input, first) };
}

/** How far towards a tier the contributor is, 0-1. */
function progress(input: StandingInput, requirement: TierRequirement): number {
  const parts: number[] = [];

  if (requirement.accepted) {
    parts.push(Math.min(1, input.accepted / requirement.accepted));
  }
  if (requirement.reviews) {
    parts.push(Math.min(1, input.reviews / requirement.reviews));
  }
  if (requirement.minAgreement) {
    parts.push(Math.min(1, input.agreement / requirement.minAgreement));
  }
  if (requirement.minQuality) {
    parts.push(Math.min(1, input.meanQuality / requirement.minQuality));
  }

  if (parts.length === 0) return 1;
  return parts.reduce((total, value) => total + value, 0) / parts.length;
}

/**
 * Whether a member may review on their own.
 *
 * New reviewers approve only alongside an established one. This is what stops
 * the review queue from being captured by whoever arrives first.
 */
export function canReviewAlone(standing: ContributorStanding): boolean {
  return standing.tier === "reviewer" || standing.tier === "steward";
}

/** Whether a member may perform moderation actions. */
export function canModerate(standing: ContributorStanding): boolean {
  return standing.tier === "steward";
}

/** The human-readable label for a tier. */
export function tierLabel(tier: RecognitionTier): string {
  return (
    TIER_REQUIREMENTS.find((requirement) => requirement.tier === tier)?.label ??
    "Contributor"
  );
}
