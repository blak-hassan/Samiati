/**
 * Build a training-ready dataset manifest.
 *
 * Samiati produces the data; it does not train foundation models. This script
 * takes a contributions export and produces the artefacts a fine-tuning run
 * needs: a JSONL manifest, a deterministic train/validation/test split, and
 * a readiness report.
 *
 * Usage:
 *   node scripts/export-dataset.ts --input <contributions.json> --out <dir>
 *
 * The input file is the JSON that the Changa page exports:
 *   { "contributions": [...], "tasks": [...], "reviews": [...] }
 *
 * Two rules are enforced:
 *   1. Only accepted contributions are included.
 *   2. A manifest is only marked training-ready when every readiness check
 *      passes. A failing manifest is still written — it is simply not marked
 *      ready, and the report says why.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import {
  buildRows,
  checkReadiness,
  checksumRows,
  cleanRows,
  computeMetrics,
  scoreRows,
  splitRows,
  toJsonl,
} from "../lib/dataset/pipeline.ts";
import type {
  Contribution,
  ContributionTask,
  DatasetVersion,
  Review,
} from "../lib/data/types.ts";

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

const inputPath = readArg("input") ?? process.env.SAMIATI_DATASET_INPUT;
const outDir = resolve(process.cwd(), readArg("out") ?? "datasets");

if (!inputPath) {
  console.error(
    "No input given. Pass --input <contributions.json> or set SAMIATI_DATASET_INPUT.",
  );
  process.exit(1);
}

console.log(`Reading ${inputPath} ...`);

const raw = JSON.parse(await readFile(resolve(process.cwd(), inputPath), "utf8")) as {
  contributions?: Contribution[];
  tasks?: ContributionTask[];
  reviews?: Review[];
};

const contributions = raw.contributions ?? [];
const tasks = raw.tasks ?? [];
const reviews = raw.reviews ?? [];

const built = buildRows(contributions, tasks, reviews);
const { rows: cleaned, report: cleaningReport } = cleanRows(built);
const rows = scoreRows(cleaned, contributions);

const languageIds = [...new Set(rows.map((row) => row.languageId))];
const metrics = computeMetrics(rows);
const checksum = checksumRows(rows);

const version: DatasetVersion = {
  id: `dsv-${checksum}`,
  version: `${languageIds[0] ?? "samiati"}-${new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}.1`,
  languageIds,
  createdAt: Date.now(),
  provenance: {
    contributionIds: rows.map((row) => row.id),
    reviewIds: reviews
      .filter((review) => rows.some((row) => row.id === review.contributionId))
      .map((review) => review.id),
  },
  metrics,
  export: { format: "jsonl", checksum, itemCount: rows.length },
  review: { status: "draft" },
};

const readiness = checkReadiness(version);
const split = splitRows(rows);

await mkdir(outDir, { recursive: true });

await writeFile(
  join(outDir, `${version.version}.jsonl`),
  `${toJsonl(rows)}\n`,
  "utf8",
);
await writeFile(
  join(outDir, `${version.version}.train.jsonl`),
  `${toJsonl(split.train)}\n`,
  "utf8",
);
await writeFile(
  join(outDir, `${version.version}.validation.jsonl`),
  `${toJsonl(split.validation)}\n`,
  "utf8",
);
await writeFile(
  join(outDir, `${version.version}.test.jsonl`),
  `${toJsonl(split.test)}\n`,
  "utf8",
);

const manifest = {
  version,
  cleaningReport,
  readiness,
  split: {
    train: split.train.length,
    validation: split.validation.length,
    test: split.test.length,
  },
};

await writeFile(
  join(outDir, `${version.version}.manifest.json`),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(`Wrote ${rows.length} rows to ${outDir}`);
console.log(`  version   ${version.version}`);
console.log(`  checksum  ${checksum}`);
console.log(`  languages ${languageIds.join(", ") || "none"}`);
console.log(
  `  split     train ${split.train.length} / validation ${split.validation.length} / test ${split.test.length}`,
);
console.log(`  ready     ${readiness.ready ? "yes" : "no"}`);

if (!readiness.ready) {
  console.log("");
  console.log("Not training-ready. The blocking checks:");
  for (const check of readiness.checks.filter((entry) => !entry.passed)) {
    console.log(`  - ${check.label}: ${check.detail}`);
  }
}
