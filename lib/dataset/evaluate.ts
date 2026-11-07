/**
 * Dataset evaluation.
 *
 * Samiati evaluates a translation model with chrF: the character n-gram
 * F-score against a reference translation, averaged over n = 1 to 6.
 *
 * chrF is used rather than BLEU because it behaves sensibly on short
 * sentences and on morphologically rich languages, where a single word can
 * carry a great deal of meaning. A word-for-word metric would punish a
 * correct translation for using a different inflection.
 */

/** The n-gram orders used by chrF. */
const MAX_NGRAM_ORDER = 6;

/** chrF's beta: character n-gram recall is weighted slightly higher. */
const BETA = 2;

/** The character n-grams of a string, as a multiset. */
function ngrams(text: string, order: number): Map<string, number> {
  const characters = [...text.replace(/\s+/g, " ").trim()];
  const counts = new Map<string, number>();

  if (characters.length < order) {
    if (characters.length > 0) {
      counts.set(characters.join(""), 1);
    }
    return counts;
  }

  for (let index = 0; index <= characters.length - order; index += 1) {
    const gram = characters.slice(index, index + order).join("");
    counts.set(gram, (counts.get(gram) ?? 0) + 1);
  }

  return counts;
}

/**
 * The chrF score of a hypothesis against a reference, 0-100.
 */
export function chrf(reference: string, hypothesis: string): number {
  const referenceClean = reference.replace(/\s+/g, " ").trim();
  const hypothesisClean = hypothesis.replace(/\s+/g, " ").trim();

  if (!referenceClean && !hypothesisClean) return 100;
  if (!referenceClean || !hypothesisClean) return 0;

  let total = 0;

  for (let order = 1; order <= MAX_NGRAM_ORDER; order += 1) {
    const referenceGrams = ngrams(referenceClean, order);
    const hypothesisGrams = ngrams(hypothesisClean, order);

    let overlap = 0;
    let referenceTotal = 0;
    let hypothesisTotal = 0;

    for (const count of referenceGrams.values()) referenceTotal += count;
    for (const count of hypothesisGrams.values()) hypothesisTotal += count;

    for (const [gram, count] of hypothesisGrams) {
      const available = referenceGrams.get(gram) ?? 0;
      overlap += Math.min(count, available);
    }

    const precision = hypothesisTotal === 0 ? 0 : overlap / hypothesisTotal;
    const recall = referenceTotal === 0 ? 0 : overlap / referenceTotal;

    // F_beta with beta = 2: recall is weighted twice as heavily as precision.
    const betaSquared = BETA * BETA;
    const denominator = betaSquared * precision + recall;
    const fScore =
      denominator === 0 ? 0 : (1 + betaSquared) * (precision * recall) / denominator;

    total += fScore;
  }

  const score = total / MAX_NGRAM_ORDER;
  return Math.round(score * 10000) / 100;
}

export interface EvaluationSample {
  /** The reference translation. */
  reference: string;
  /** What the model produced. */
  hypothesis: string;
}

export interface LanguageEvaluation {
  languageId: string;
  samples: number;
  /** Mean chrF, 0-100. */
  chrF: number;
  /** The lowest-scoring samples, for inspection. */
  worst: Array<{ reference: string; hypothesis: string; chrF: number }>;
}

export interface EvaluationReport {
  overall: number;
  languages: LanguageEvaluation[];
}

/**
 * Evaluates a set of samples, grouped by language.
 *
 * The worst samples are kept so a reviewer can see *why* a model is doing
 * badly on a language — a single mean score never explains a failure.
 */
export function evaluateSamples(
  samples: Array<EvaluationSample & { languageId: string }>,
): EvaluationReport {
  const byLanguage = new Map<string, EvaluationSample[]>();

  for (const sample of samples) {
    const list = byLanguage.get(sample.languageId) ?? [];
    list.push(sample);
    byLanguage.set(sample.languageId, list);
  }

  const languages: LanguageEvaluation[] = [];

  for (const [languageId, list] of byLanguage) {
    const scored = list.map((sample) => ({
      reference: sample.reference,
      hypothesis: sample.hypothesis,
      chrF: chrf(sample.reference, sample.hypothesis),
    }));

    const mean =
      scored.length === 0
        ? 0
        : scored.reduce((total, entry) => total + entry.chrF, 0) / scored.length;

    languages.push({
      languageId,
      samples: scored.length,
      chrF: Math.round(mean * 100) / 100,
      worst: scored
        .slice()
        .sort((a, b) => a.chrF - b.chrF)
        .slice(0, 3),
    });
  }

  languages.sort((a, b) => a.chrF - b.chrF);

  const overall =
    languages.length === 0
      ? 0
      : languages.reduce((total, entry) => total + entry.chrF, 0) / languages.length;

  return { overall: Math.round(overall * 100) / 100, languages };
}

/**
 * A rough word error rate, 0-100.
 *
 * chrF is the primary metric; WER is reported alongside it because it is what
 * most people expect to see.
 */
export function wordErrorRate(reference: string, hypothesis: string): number {
  const referenceWords = reference.split(/\s+/).filter(Boolean);
  const hypothesisWords = hypothesis.split(/\s+/).filter(Boolean);

  if (referenceWords.length === 0) {
    return hypothesisWords.length === 0 ? 0 : 100;
  }

  const rows = hypothesisWords.length + 1;
  const columns = referenceWords.length + 1;
  const distance: number[][] = Array.from({ length: rows }, () =>
    new Array<number>(columns).fill(0),
  );

  for (let row = 0; row < rows; row += 1) distance[row]![0] = row;
  for (let column = 0; column < columns; column += 1) distance[0]![column] = column;

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const cost =
        referenceWords[column - 1] === hypothesisWords[row - 1] ? 0 : 1;
      distance[row]![column] = Math.min(
        distance[row - 1]![column]! + 1,
        distance[row]![column - 1]! + 1,
        distance[row - 1]![column - 1]! + cost,
      );
    }
  }

  return (
    Math.round((distance[rows - 1]![columns - 1]! / referenceWords.length) * 10000) /
    100
  );
}
