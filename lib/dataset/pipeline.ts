/**
 * The Samiati dataset pipeline.
 *
 * The route from a contribution to a training-ready dataset is:
 *
 *   contributions -> normalise -> de-duplicate -> score -> version -> split
 *
 * Two rules are enforced here and must not be relaxed:
 *
 *   1. **Only accepted contributions enter a dataset.** A contribution that
 *      has not been reviewed by a person is never exported.
 *   2. **A version cannot become training-ready without items, a quality
 *      score and provenance.** The readiness check refuses to pass a
 *      version that is empty or unreviewed.
 */

import { computeQualityScore, tokenSimilarity } from "@/lib/changa/quality";
import type {
  Contribution,
  ContributionTask,
  DatasetVersion,
  Review,
} from "@/lib/data/types";

/** One training example. */
export interface DatasetRow {
  id: string;
  languageId: string;
  sourceText: string;
  translation: string;
  contributorId: string;
  /** The composite quality score, 0-1. */
  qualityScore: number;
  /** How many people reviewed this row. */
  reviewCount: number;
  createdAt: number;
}

export interface CleaningReport {
  rowsBefore: number;
  rowsAfter: number;
  removedEmpty: number;
  removedDuplicate: number;
  normalised: number;
}

export interface ReadinessCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface ReadinessReport {
  ready: boolean;
  checks: ReadinessCheck[];
}

const DUPLICATE_THRESHOLD = 0.92;

/**
 * Normalises whitespace and casing for a training row.
 *
 * The text itself is not changed — only trailing whitespace and repeated
 * spaces — because a translation is data, not something to "tidy".
 */
export function normalizeRowText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Builds the candidate rows from the contribution record.
 *
 * Only accepted contributions are included. This is the gate that keeps
 * unreviewed material out of every dataset.
 */
export function buildRows(
  contributions: readonly Contribution[],
  tasks: readonly ContributionTask[],
  reviews: readonly Review[],
): DatasetRow[] {
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const reviewCounts = new Map<string, number>();
  for (const review of reviews) {
    reviewCounts.set(
      review.contributionId,
      (reviewCounts.get(review.contributionId) ?? 0) + 1,
    );
  }

  const rows: DatasetRow[] = [];
  for (const contribution of contributions) {
    if (contribution.status !== "accepted") continue;
    const task = taskById.get(contribution.taskId);
    if (!task) continue;

    rows.push({
      id: contribution.id,
      languageId: contribution.languageId,
      sourceText: task.sourceText,
      translation: contribution.submittedText,
      contributorId: contribution.contributorId,
      qualityScore: contribution.qualityScore ?? 0,
      reviewCount: reviewCounts.get(contribution.id) ?? 0,
      createdAt: contribution.createdAt,
    });
  }

  return rows;
}

/**
 * Normalises and de-duplicates the rows.
 *
 * De-duplication compares translations within the same language, so two
 * languages that happen to share a phrase are not collapsed.
 */
export function cleanRows(rows: readonly DatasetRow[]): {
  rows: DatasetRow[];
  report: CleaningReport;
} {
  const report: CleaningReport = {
    rowsBefore: rows.length,
    rowsAfter: 0,
    removedEmpty: 0,
    removedDuplicate: 0,
    normalised: 0,
  };

  const kept: DatasetRow[] = [];

  for (const row of rows) {
    const sourceText = normalizeRowText(row.sourceText);
    const translation = normalizeRowText(row.translation);

    if (!sourceText || !translation) {
      report.removedEmpty += 1;
      continue;
    }

    if (sourceText !== row.sourceText || translation !== row.translation) {
      report.normalised += 1;
    }

    const duplicate = kept.some(
      (existing) =>
        existing.languageId === row.languageId &&
        tokenSimilarity(existing.translation, translation) >= DUPLICATE_THRESHOLD,
    );

    if (duplicate) {
      report.removedDuplicate += 1;
      continue;
    }

    kept.push({ ...row, sourceText, translation });
  }

  report.rowsAfter = kept.length;
  return { rows: kept, report };
}

/**
 * Recomputes the composite quality score for every row.
 *
 * The review score comes from the recorded reviews, the agreement signal
 * from how many reviews there were, and the reliability signal from the
 * contributor's history.
 */
export function scoreRows(
  rows: readonly DatasetRow[],
  contributions: readonly Contribution[],
): DatasetRow[] {
  const contributorStats = new Map<
    string,
    { accepted: number; rejected: number }
  >();

  for (const contribution of contributions) {
    const stats = contributorStats.get(contribution.contributorId) ?? {
      accepted: 0,
      rejected: 0,
    };
    if (contribution.status === "accepted") stats.accepted += 1;
    if (contribution.status === "rejected") stats.rejected += 1;
    contributorStats.set(contribution.contributorId, stats);
  }

  return rows.map((row) => {
    const stats = contributorStats.get(row.contributorId) ?? {
      accepted: 0,
      rejected: 0,
    };
    const reviewed = stats.accepted + stats.rejected;
    const reliability = reviewed === 0 ? 0 : stats.accepted / reviewed;

    const reviewScore = row.qualityScore;
    const agreement = row.reviewCount > 1 ? 0.8 : 0.5;
    const consistency = 0.75;
    const novelty = 1;

    return {
      ...row,
      qualityScore: computeQualityScore({
        reviewScore,
        agreement,
        consistency,
        novelty,
        reliability,
      }),
    };
  });
}

/** Distinct terms per 1,000 words, for one language. */
export function languageCoverage(rows: readonly DatasetRow[]): number {
  if (rows.length === 0) return 0;
  const terms = new Set<string>();
  let words = 0;

  for (const row of rows) {
    for (const token of row.translation.split(/\s+/)) {
      const cleaned = token.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
      if (!cleaned) continue;
      terms.add(cleaned);
      words += 1;
    }
  }

  if (words === 0) return 0;
  return Math.round((terms.size / words) * 1000 * 100) / 100;
}

/** The metrics reported for a dataset version. */
export function computeMetrics(rows: readonly DatasetRow[]) {
  const mean =
    rows.length === 0
      ? 0
      : rows.reduce((total, row) => total + row.qualityScore, 0) / rows.length;

  return {
    itemCount: rows.length,
    meanQualityScore: Math.round(mean * 1000) / 1000,
    contributorCount: new Set(rows.map((row) => row.contributorId)).size,
    languageCoverage: languageCoverage(rows),
  };
}

/**
 * A stable checksum for a set of rows.
 *
 * FNV-1a over the sorted row content. It is not a cryptographic hash — it is
 * a fingerprint that changes when the data changes, which is what a dataset
 * version needs.
 */
export function checksumRows(rows: readonly DatasetRow[]): string {
  const material = [...rows]
    .map(
      (row) =>
        `${row.languageId}|${row.sourceText}|${row.translation}|${row.qualityScore}`,
    )
    .sort()
    .join("\n");

  let hash = 2166136261;
  for (let index = 0; index < material.length; index += 1) {
    hash ^= material.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * Checks whether a version may be used for training.
 *
 * Every check must pass. The version cannot be advanced to `training_ready`
 * until it does.
 */
export function checkReadiness(
  version: Pick<
    DatasetVersion,
    "metrics" | "provenance" | "review" | "languageIds"
  >,
  options: { minQuality?: number; minItems?: number } = {},
): ReadinessReport {
  const minQuality = options.minQuality ?? 0.5;
  const minItems = options.minItems ?? 10;

  const checks: ReadinessCheck[] = [
    {
      id: "has-items",
      label: "Contains training examples",
      passed: version.metrics.itemCount >= minItems,
      detail: `${version.metrics.itemCount} items (at least ${minItems} needed)`,
    },
    {
      id: "quality",
      label: "Mean quality score is high enough",
      passed: version.metrics.meanQualityScore >= minQuality,
      detail: `mean quality ${version.metrics.meanQualityScore.toFixed(
        2,
      )} (at least ${minQuality} needed)`,
    },
    {
      id: "provenance",
      label: "Every item is traceable to a reviewed contribution",
      passed:
        version.provenance.contributionIds.length > 0 &&
        version.provenance.contributionIds.length >= version.metrics.itemCount,
      detail: `${version.provenance.contributionIds.length} source contributions recorded`,
    },
    {
      id: "reviews",
      label: "Reviews are recorded",
      passed: version.provenance.reviewIds.length > 0,
      detail: `${version.provenance.reviewIds.length} reviews recorded`,
    },
    {
      id: "languages",
      label: "Covers at least one language",
      passed: version.languageIds.length > 0,
      detail: version.languageIds.join(", ") || "no languages",
    },
    {
      id: "reviewed",
      label: "Has been through review",
      passed:
        version.review.status === "reviewed" ||
        version.review.status === "training_ready" ||
        version.review.status === "released",
      detail: `status is "${version.review.status}"`,
    },
  ];

  return { ready: checks.every((check) => check.passed), checks };
}

/** The rows as newline-delimited JSON, ready for a training run. */
export function toJsonl(rows: readonly DatasetRow[]): string {
  return rows
    .map(
      (row) =>
        JSON.stringify({
          id: row.id,
          language: row.languageId,
          source: row.sourceText,
          translation: row.translation,
          quality: row.qualityScore,
        }),
    )
    .join("\n");
}

/** The rows as CSV, with a header row. */
export function toCsv(rows: readonly DatasetRow[]): string {
  const escape = (value: string) =>
    /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

  const header = "id,language,source,translation,quality";
  const lines = rows.map(
    (row) =>
      [
        escape(row.id),
        escape(row.languageId),
        escape(row.sourceText),
        escape(row.translation),
        String(row.qualityScore),
      ].join(","),
  );

  return [header, ...lines].join("\n");
}

/**
 * Splits the rows into train, validation and test.
 *
 * The split is deterministic — the same rows always produce the same split —
 * so a dataset version can be reproduced.
 */
export function splitRows(
  rows: readonly DatasetRow[],
  ratios: { train: number; validation: number; test: number } = {
    train: 0.8,
    validation: 0.1,
    test: 0.1,
  },
): { train: DatasetRow[]; validation: DatasetRow[]; test: DatasetRow[] } {
  const sorted = [...rows].sort((a, b) => a.id.localeCompare(b.id));
  const trainEnd = Math.floor(sorted.length * ratios.train);
  const validationEnd = Math.floor(
    sorted.length * (ratios.train + ratios.validation),
  );

  return {
    train: sorted.slice(0, trainEnd),
    validation: sorted.slice(trainEnd, validationEnd),
    test: sorted.slice(validationEnd),
  };
}
