import { describe, expect, it } from "vitest";

import {
  buildRows,
  checkReadiness,
  checksumRows,
  cleanRows,
  computeMetrics,
  languageCoverage,
  normalizeRowText,
  scoreRows,
  splitRows,
  toCsv,
  toJsonl,
  type DatasetRow,
} from "@/lib/dataset/pipeline";
import { chrf, evaluateSamples, wordErrorRate } from "@/lib/dataset/evaluate";
import type {
  Contribution,
  ContributionTask,
  DatasetVersion,
  Review,
} from "@/lib/data/types";

const task: ContributionTask = {
  id: "task-1",
  type: "translate",
  languageId: "kiswahili",
  sourceText: "The pump is broken.",
  difficulty: "easy",
  status: "accepted",
  createdAt: 1,
  updatedAt: 1,
  rewardPoints: 10,
};

function contribution(overrides: Partial<Contribution> = {}): Contribution {
  return {
    id: "c1",
    taskId: "task-1",
    contributorId: "u1",
    submittedText: "Pampu imeharibika.",
    languageId: "kiswahili",
    status: "accepted",
    qualityScore: 0.9,
    createdAt: 1,
    ...overrides,
  };
}

describe("building dataset rows", () => {
  it("includes only accepted contributions", () => {
    const rows = buildRows(
      [
        contribution({ id: "a", status: "accepted" }),
        contribution({ id: "b", status: "submitted" }),
        contribution({ id: "c", status: "rejected" }),
        contribution({ id: "d", status: "validated" }),
      ],
      [task],
      [],
    );
    expect(rows.map((row) => row.id)).toEqual(["a"]);
  });

  it("joins the contribution to its task", () => {
    const rows = buildRows([contribution()], [task], []);
    expect(rows[0]?.sourceText).toBe("The pump is broken.");
    expect(rows[0]?.translation).toBe("Pampu imeharibika.");
  });

  it("skips a contribution whose task is gone", () => {
    expect(buildRows([contribution()], [], [])).toHaveLength(0);
  });

  it("counts the reviews each row received", () => {
    const reviews: Review[] = [
      {
        id: "r1",
        contributionId: "c1",
        reviewerId: "u2",
        decision: "approve",
        createdAt: 1,
      },
    ];
    const rows = buildRows([contribution()], [task], reviews);
    expect(rows[0]?.reviewCount).toBe(1);
  });
});

describe("cleaning rows", () => {
  it("normalises whitespace", () => {
    expect(normalizeRowText("  a   b \n c ")).toBe("a b c");
  });

  it("removes rows with empty text", () => {
    const { rows, report } = cleanRows([
      { ...sampleRow(), translation: "   " },
      sampleRow(),
    ]);
    expect(rows).toHaveLength(1);
    expect(report.removedEmpty).toBe(1);
  });

  it("removes near-duplicate rows in the same language", () => {
    const { rows, report } = cleanRows([
      sampleRow({ id: "a" }),
      sampleRow({ id: "b" }),
    ]);
    expect(rows).toHaveLength(1);
    expect(report.removedDuplicate).toBe(1);
  });

  it("keeps the same phrase in two different languages", () => {
    const { rows } = cleanRows([
      sampleRow({ id: "a", languageId: "kiswahili" }),
      sampleRow({ id: "b", languageId: "kikuyu" }),
    ]);
    expect(rows).toHaveLength(2);
  });
});

function sampleRow(overrides: Partial<DatasetRow> = {}): DatasetRow {
  return {
    id: "row-1",
    languageId: "kiswahili",
    sourceText: "The pump is broken.",
    translation: "Pampu imeharibika.",
    contributorId: "u1",
    qualityScore: 0.9,
    reviewCount: 1,
    createdAt: 1,
    ...overrides,
  };
}

describe("metrics", () => {
  it("reports the mean quality, contributors and coverage", () => {
    const metrics = computeMetrics([
      sampleRow({ id: "a", qualityScore: 0.8, contributorId: "u1" }),
      sampleRow({ id: "b", qualityScore: 1, contributorId: "u2" }),
    ]);
    expect(metrics.itemCount).toBe(2);
    expect(metrics.meanQualityScore).toBe(0.9);
    expect(metrics.contributorCount).toBe(2);
    expect(metrics.languageCoverage).toBeGreaterThan(0);
  });

  it("measures coverage as distinct terms per thousand words", () => {
    expect(languageCoverage([])).toBe(0);
    expect(languageCoverage([sampleRow()])).toBeGreaterThan(0);
  });

  it("produces a stable checksum that changes with the data", () => {
    const rows = [sampleRow()];
    expect(checksumRows(rows)).toBe(checksumRows([...rows]));
    expect(checksumRows(rows)).not.toBe(
      checksumRows([sampleRow({ translation: "Different." })]),
    );
  });
});

describe("readiness", () => {
  const version = (overrides: Partial<DatasetVersion> = {}): DatasetVersion => ({
    id: "dsv",
    version: "kiswahili-1",
    languageIds: ["kiswahili"],
    createdAt: 1,
    provenance: {
      contributionIds: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "c10"],
      reviewIds: ["r1"],
    },
    metrics: {
      itemCount: 10,
      meanQualityScore: 0.8,
      contributorCount: 2,
      languageCoverage: 500,
    },
    export: { format: "jsonl", checksum: "abc", itemCount: 10 },
    review: { status: "reviewed" },
    ...overrides,
  });

  it("passes a complete, reviewed version", () => {
    const report = checkReadiness(version());
    expect(report.ready).toBe(true);
  });

  it("fails a version with too few items", () => {
    const report = checkReadiness(
      version({ metrics: { ...version().metrics, itemCount: 2 } }),
      { minItems: 10 },
    );
    expect(report.ready).toBe(false);
    expect(report.checks.find((c) => c.id === "has-items")?.passed).toBe(false);
  });

  it("fails a version with a zero quality score", () => {
    const report = checkReadiness(
      version({ metrics: { ...version().metrics, meanQualityScore: 0 } }),
    );
    expect(report.checks.find((c) => c.id === "quality")?.passed).toBe(false);
  });

  it("fails a version without provenance", () => {
    const report = checkReadiness(
      version({
        provenance: { contributionIds: [], reviewIds: [] },
      }),
    );
    expect(report.ready).toBe(false);
  });

  it("fails a version that has not been reviewed", () => {
    const report = checkReadiness(
      version({ review: { status: "draft" } }),
    );
    expect(report.checks.find((c) => c.id === "reviewed")?.passed).toBe(false);
  });
});

describe("export", () => {
  it("writes newline-delimited JSON", () => {
    const jsonl = toJsonl([sampleRow()]);
    const parsed = JSON.parse(jsonl);
    expect(parsed.language).toBe("kiswahili");
    expect(parsed.translation).toBe("Pampu imeharibika.");
  });

  it("writes CSV with a header", () => {
    const csv = toCsv([sampleRow()]);
    expect(csv.split("\n")[0]).toBe("id,language,source,translation,quality");
  });

  it("quotes a value containing a comma", () => {
    const csv = toCsv([sampleRow({ sourceText: "One, two" })]);
    expect(csv).toContain('"One, two"');
  });

  it("splits deterministically", () => {
    const rows = Array.from({ length: 10 }, (_, index) =>
      sampleRow({ id: `row-${index}` }),
    );
    const first = splitRows(rows);
    const second = splitRows(rows);
    expect(first.train.map((r) => r.id)).toEqual(second.train.map((r) => r.id));
    expect(first.train).toHaveLength(8);
    expect(first.validation).toHaveLength(1);
    expect(first.test).toHaveLength(1);
  });
});

describe("scoring rows", () => {
  it("applies the contributor's reliability", () => {
    const rows = scoreRows([sampleRow()], [
      contribution({ status: "accepted" }),
      contribution({ id: "c2", status: "rejected" }),
    ]);
    expect(rows[0]?.qualityScore).toBeLessThan(0.9);
    expect(rows[0]?.qualityScore).toBeGreaterThan(0);
  });
});

describe("evaluation", () => {
  it("scores identical text at 100", () => {
    expect(chrf("Pampu imeharibika.", "Pampu imeharibika.")).toBe(100);
  });

  it("scores unrelated text at 0", () => {
    expect(chrf("aaaa", "bbbb")).toBe(0);
  });

  it("scores a partial match in between", () => {
    const score = chrf("Pampu imeharibika kabisa.", "Pampu imeharibika.");
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);
  });

  it("groups evaluation by language and keeps the worst samples", () => {
    const report = evaluateSamples([
      {
        languageId: "kiswahili",
        reference: "Pampu imeharibika.",
        hypothesis: "Pampu imeharibika.",
      },
      {
        languageId: "kikuyu",
        reference: "Pampu imeharibika.",
        hypothesis: "aaaa",
      },
    ]);
    expect(report.languages).toHaveLength(2);
    expect(report.languages[0]?.languageId).toBe("kikuyu");
    expect(report.languages[0]?.worst).toHaveLength(1);
  });

  it("computes a word error rate", () => {
    expect(wordErrorRate("a b c", "a b c")).toBe(0);
    expect(wordErrorRate("a b c", "x y z")).toBe(100);
  });
});
