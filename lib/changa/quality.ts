/**
 * Contribution quality engine.
 *
 * These functions are pure and shared: the browser runs them for the local
 * backend, the Convex backend runs them for the cloud backend, and the
 * dataset pipeline runs them again at export time.
 *
 * A hard rule, enforced by the shape of this module:
 *
 *   **No automated check may accept a contribution.**
 *
 * Every check can only *flag* a submission for human review. If automation
 * could accept contributions, quantity would masquerade as quality — the
 * exact failure mode this platform exists to avoid.
 */

/* -------------------------------------------------------------------------- */
/*                                   Types                                     */
/* -------------------------------------------------------------------------- */

export type QualityCheckId =
  | "empty_or_trivial"
  | "duplicate"
  | "copy_of_accepted"
  | "register_mismatch"
  | "length_outlier"
  | "script_mismatch";

export type QualitySeverity = "info" | "warn" | "block";

export interface QualityCheckResult {
  id: QualityCheckId;
  severity: QualitySeverity;
  /** True when the submission passed this check. */
  passed: boolean;
  /** Human-readable explanation, shown to the contributor and the reviewer. */
  message: string;
}

export interface QualityReport {
  checks: QualityCheckResult[];
  /** True when at least one check wants a human to look closely. */
  flagged: boolean;
  /** Always false. Present so the contract can never be mistaken. */
  autoAccepted: boolean;
  /** 0-1 screening score derived from the checks. */
  score: number;
}

export interface ExistingContribution {
  id: string;
  submittedText: string;
  status: "submitted" | "validated" | "accepted" | "rejected";
  languageId: string;
}

export interface QualityInput {
  sourceText: string;
  submittedText: string;
  languageId: string;
  /** The script the target language is written in. */
  script: "Latin" | "Arabic";
  /** Contributions already recorded for this language. */
  existing: ExistingContribution[];
}

/* -------------------------------------------------------------------------- */
/*                              Text utilities                                 */
/* -------------------------------------------------------------------------- */

/** Lower-cases, strips diacritics and punctuation, and collapses whitespace. */
export function normalizeForCompare(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Splits normalised text into a set of unique tokens. */
export function tokenize(value: string): Set<string> {
  const normalized = normalizeForCompare(value);
  if (!normalized) return new Set();
  return new Set(normalized.split(" "));
}

/**
 * Jaccard similarity between two token sets, 0-1.
 *
 * Used for near-duplicate detection. It is deliberately conservative: two
 * sentences that share a topic but differ in wording score low, so genuine
 * variants are not flagged.
 */
export function tokenSimilarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  return intersection / (setA.size + setB.size - intersection);
}

/** A small English function-word list, used to detect an untranslated reply. */
const ENGLISH_FUNCTION_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "to", "of", "in", "on", "for", "with", "and", "or", "but", "not", "no",
  "has", "have", "had", "will", "would", "can", "could", "should", "this",
  "that", "these", "those", "it", "its", "they", "them", "their", "we", "you",
  "your", "he", "she", "his", "her", "i", "my", "me", "at", "from", "by",
  "as", "if", "so", "than", "then", "there", "here", "all", "any", "some",
]);

/**
 * The proportion of tokens that are English function words.
 *
 * A high value suggests the contributor pasted the source text rather than
 * translating it. It is a heuristic, so it only ever warns.
 */
export function englishFunctionWordRatio(value: string): number {
  const tokens = normalizeForCompare(value).split(" ").filter(Boolean);
  if (tokens.length === 0) return 0;
  let matches = 0;
  for (const token of tokens) {
    if (ENGLISH_FUNCTION_WORDS.has(token)) matches += 1;
  }
  return matches / tokens.length;
}

/**
 * The proportion of alphabetic characters written in the expected script.
 *
 * Catches a submission written in the wrong script entirely, and - more
 * usefully - a submission that is mostly Arabic text in a Latin-script
 * language.
 */
export function expectedScriptRatio(
  value: string,
  script: "Latin" | "Arabic",
): number {
  const letters = [...value].filter((character) => /\p{L}/u.test(character));
  if (letters.length === 0) return 0;

  const matching = letters.filter((character) => {
    const code = character.codePointAt(0) ?? 0;
    const isArabic =
      (code >= 0x0600 && code <= 0x06ff) ||
      (code >= 0x0750 && code <= 0x077f) ||
      (code >= 0x08a0 && code <= 0x08ff);
    return script === "Arabic" ? isArabic : !isArabic;
  });

  return matching.length / letters.length;
}

/* -------------------------------------------------------------------------- */
/*                                   Checks                                    */
/* -------------------------------------------------------------------------- */

export const DUPLICATE_THRESHOLD = 0.85;
export const REGISTER_THRESHOLD = 0.45;
export const LENGTH_RATIO_LOW = 0.35;
export const LENGTH_RATIO_HIGH = 3;

/**
 * Runs every automated check over a submission.
 *
 * Returns a report. `autoAccepted` is always false: a passing report means
 * "nothing suspicious found", never "approved".
 */
export function runQualityChecks(input: QualityInput): QualityReport {
  const checks: QualityCheckResult[] = [];
  const submitted = input.submittedText.trim();
  const normalizedSubmitted = normalizeForCompare(submitted);
  const normalizedSource = normalizeForCompare(input.sourceText);

  /* --- empty or trivial ------------------------------------------------- */
  if (!normalizedSubmitted) {
    checks.push({
      id: "empty_or_trivial",
      severity: "block",
      passed: false,
      message: "The submission is empty.",
    });
  } else if (input.sourceText.trim() && normalizedSubmitted === normalizedSource) {
    checks.push({
      id: "empty_or_trivial",
      severity: "warn",
      passed: false,
      message:
        "The submission is identical to the source text. If the text is the same in both languages, say so in the context instead.",
    });
  } else {
    checks.push({
      id: "empty_or_trivial",
      severity: "block",
      passed: true,
      message: "The submission has content.",
    });
  }

  /* --- duplicate and copy detection ------------------------------------- */
  const sameLanguage = input.existing.filter(
    (contribution) => contribution.languageId === input.languageId,
  );

  let bestDuplicate = 0;
  let bestCopy = 0;

  for (const contribution of sameLanguage) {
    const similarity = tokenSimilarity(
      contribution.submittedText,
      input.submittedText,
    );
    if (similarity > bestDuplicate) bestDuplicate = similarity;
    if (contribution.status === "accepted" && similarity > bestCopy) {
      bestCopy = similarity;
    }
  }

  checks.push({
    id: "duplicate",
    severity: "warn",
    passed: bestDuplicate < DUPLICATE_THRESHOLD,
    message:
      bestDuplicate >= DUPLICATE_THRESHOLD
        ? `This is very close to an existing submission (${Math.round(
            bestDuplicate * 100,
          )}% similar).`
        : "This is not a near-duplicate of an existing submission.",
  });

  checks.push({
    id: "copy_of_accepted",
    severity: "warn",
    passed: bestCopy < DUPLICATE_THRESHOLD,
    message:
      bestCopy >= DUPLICATE_THRESHOLD
        ? `This closely matches an accepted contribution (${Math.round(
            bestCopy * 100,
          )}% similar), which may mean it was copied.`
        : "This does not duplicate an accepted contribution.",
  });

  /* --- register mismatch ------------------------------------------------ */
  const englishRatio = englishFunctionWordRatio(input.submittedText);
  const registerFlagged =
    englishRatio >= REGISTER_THRESHOLD &&
    normalizedSubmitted !== normalizedSource;

  checks.push({
    id: "register_mismatch",
    severity: "warn",
    passed: !registerFlagged,
    message: registerFlagged
      ? "This looks a lot like the English source. It may not have been translated."
      : "This does not look like untranslated English.",
  });

  /* --- length sanity ---------------------------------------------------- */
  const sourceLength = normalizeForCompare(input.sourceText).split(" ").length;
  const submittedLength = normalizedSubmitted.split(" ").filter(Boolean).length;
  const ratio =
    sourceLength > 0 && submittedLength > 0 ? submittedLength / sourceLength : 1;
  const lengthFlagged =
    sourceLength >= 5 && (ratio < LENGTH_RATIO_LOW || ratio > LENGTH_RATIO_HIGH);

  checks.push({
    id: "length_outlier",
    severity: "info",
    passed: !lengthFlagged,
    message: lengthFlagged
      ? `The length is unusual compared with the source (${ratio.toFixed(
          2,
        )}x). That is sometimes right, sometimes a mistake.`
      : "The length is reasonable compared with the source.",
  });

  /* --- script ----------------------------------------------------------- */
  const scriptRatio = expectedScriptRatio(input.submittedText, input.script);
  const scriptFlagged = scriptRatio < 0.8;

  checks.push({
    id: "script_mismatch",
    severity: "block",
    passed: !scriptFlagged,
    message: scriptFlagged
      ? `Most of this submission is not in the expected script (${Math.round(
          scriptRatio * 100,
        )}% match).`
      : "The submission is in the expected script.",
  });

  const flagged = checks.some(
    (check) => !check.passed && check.severity !== "info",
  );

  return {
    checks,
    flagged,
    autoAccepted: false,
    score: scoreFromChecks(checks),
  };
}

/**
 * A 0-1 screening score derived from the checks.
 *
 * This is a *screening* score, not the quality score. The composite quality
 * score in {@link computeQualityScore} needs human review and is the one
 * that matters.
 */
export function scoreFromChecks(checks: QualityCheckResult[]): number {
  const weights: Record<QualitySeverity, number> = {
    block: 0.4,
    warn: 0.25,
    info: 0.05,
  };

  let penalty = 0;
  for (const check of checks) {
    if (!check.passed) penalty += weights[check.severity];
  }
  return Math.max(0, Math.min(1, 1 - penalty));
}

/* -------------------------------------------------------------------------- */
/*                            Composite quality score                          */
/* -------------------------------------------------------------------------- */

export interface QualitySignals {
  /** Average review score, 0-1. */
  reviewScore: number;
  /** How often independent reviewers agreed, 0-1. */
  agreement: number;
  /** Agreement with established usage, 0-1. */
  consistency: number;
  /** Whether the contribution adds something new, 0-1. */
  novelty: number;
  /** The contributor's historical acceptance rate, 0-1. */
  reliability: number;
}

/**
 * The composite quality score.
 *
 * Deliberately not a count. A contributor who submits 10,000 identical rows
 * scores near zero; a contributor who submits 200 accurate ones scores
 * near one.
 */
export function computeQualityScore(signals: QualitySignals): number {
  const weights = {
    reviewScore: 0.4,
    agreement: 0.2,
    consistency: 0.15,
    novelty: 0.1,
    reliability: 0.15,
  } as const;

  const score =
    signals.reviewScore * weights.reviewScore +
    signals.agreement * weights.agreement +
    signals.consistency * weights.consistency +
    signals.novelty * weights.novelty +
    signals.reliability * weights.reliability;

  return Math.max(0, Math.min(1, score));
}

/** The contribution's existing text, used for the novelty signal. */
export function computeNovelty(
  submittedText: string,
  corpus: readonly string[],
): number {
  if (corpus.length === 0) return 1;
  let best = 0;
  for (const entry of corpus) {
    best = Math.max(best, tokenSimilarity(submittedText, entry));
  }
  return Math.max(0, 1 - best);
}
