/**
 * chrF / chrF++ metric implementation for translation quality evaluation.
 *
 * chrF (Character n-gram F-score) is better than BLEU for morphologically
 * rich, low-resource languages like Kenyan languages. chrF++ adds word
 * unigrams and bigrams to character n-grams.
 *
 * Self-contained implementation (no external dependencies).
 * Scores range 0–100 (0 = no match, 100 = perfect match).
 *
 * All scores are signals, never proof of quality.
 */

const BETA = 3; // chrF uses beta=3 (recall-weighted)

function getNgrams(text, n) {
  const chars = text.trim();
  const ngrams = [];
  for (let i = 0; i <= chars.length - n; i++) {
    ngrams.push(chars.slice(i, i + n));
  }
  return ngrams;
}

function getWordNgrams(text, n) {
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
  const ngrams = [];
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(" "));
  }
  return ngrams;
}

function countOverlap(a, b) {
  const bCounts = new Map();
  for (const g of b) bCounts.set(g, (bCounts.get(g) ?? 0) + 1);
  let overlap = 0;
  for (const g of a) {
    const c = bCounts.get(g) ?? 0;
    if (c > 0) {
      overlap++;
      bCounts.set(g, c - 1);
    }
  }
  return overlap;
}

function chrF(hypothesis, reference) {
  const h = hypothesis.trim();
  const r = reference.trim();

  if (!h || !r) {
    return {
      score: 0,
      chrFpp: 0,
      precision: 0,
      recall: 0,
      fBeta: 0,
      detail: "empty hypothesis or reference",
    };
  }

  // Character n-grams (n=3 and n=6 for chrF)
  const h3 = getNgrams(h, 3);
  const r3 = getNgrams(r, 3);
  const h6 = getNgrams(h, 6);
  const r6 = getNgrams(r, 6);

  const prec3 = h3.length ? countOverlap(h3, r3) / h3.length : 0;
  const rec3 = r3.length ? countOverlap(h3, r3) / r3.length : 0;
  const prec6 = h6.length ? countOverlap(h6, r6) / h6.length : 0;
  const rec6 = r6.length ? countOverlap(h6, r6) / r6.length : 0;

  const precision = (prec3 + prec6) / 2;
  const recall = (rec3 + rec6) / 2;

  // F-beta with beta=3 (recall-weighted)
  const betaSq = BETA * BETA;
  const fBeta =
    precision === 0 || recall === 0
      ? 0
      : ((1 + betaSq) * precision * recall) /
        (betaSq * precision + recall);

  const chrFScore = fBeta * 100;

  // chrF++ adds word unigrams and bigrams
  const hW1 = getWordNgrams(h, 1);
  const rW1 = getWordNgrams(r, 1);
  const hW2 = getWordNgrams(h, 2);
  const rW2 = getWordNgrams(r, 2);

  const precW1 = hW1.length ? countOverlap(hW1, rW1) / hW1.length : 0;
  const recW1 = rW1.length ? countOverlap(hW1, rW1) / rW1.length : 0;
  const precW2 = hW2.length ? countOverlap(hW2, rW2) / hW2.length : 0;
  const recW2 = rW2.length ? countOverlap(hW2, rW2) / rW2.length : 0;

  const charPrec = precision;
  const charRec = recall;
  const wordPrec = (precW1 + precW2) / 2;
  const wordRec = (recW1 + recW2) / 2;

  const ppPrecision = (charPrec + wordPrec) / 2;
  const ppRecall = (charRec + wordRec) / 2;

  const chrFppScore =
    ppPrecision === 0 || ppRecall === 0
      ? 0
      : ((1 + betaSq) * ppPrecision * ppRecall) /
        (betaSq * ppPrecision + ppRecall) *
        100;

  return {
    score: Math.round(chrFScore * 100) / 100,
    chrFpp: Math.round(chrFppScore * 100) / 100,
    precision: Math.round(charPrec * 10000) / 10000,
    recall: Math.round(charRec * 10000) / 10000,
    fBeta: Math.round(fBeta * 10000) / 10000,
    detail: `chrF:${chrFScore.toFixed(2)} chrF++:${chrFppScore.toFixed(2)}`,
  };
}

module.exports = { chrF };
