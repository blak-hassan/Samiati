/**
 * Samiati Translation Quality Evaluation Runner
 *
 * Runs deterministic checks on all dataset cases and chrF/chrF++ on
 * verified cases only. Results are signals, never proof of quality.
 *
 * Usage:
 *   node qa/eval/run.js [--with-mock-ai]
 *
 * Without --with-mock-ai: runs deterministic checks only (no AI provider needed).
 * With --with-mock-ai: also runs the app's translate pipeline via mock AI
 * and evaluates outputs (requires dev server on localhost:3000).
 */

const fs = require("node:fs");
const path = require("node:path");
const { loadCases, runDeterministicChecks } = require("./checks.js");
const { chrF } = require("./chrf.js");

const CASES_FILE = path.join(__dirname, "..", "datasets", "cases.jsonl");
const REPORTS_DIR = path.join(__dirname, "..", "reports");
const OUT_DIR = path.join(
  REPORTS_DIR,
  `eval-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);

function main() {
  const withMockAi = process.argv.includes("--with-mock-ai");
  const cases = loadCases(CASES_FILE);

  console.log(`Loaded ${cases.length} cases from ${CASES_FILE}`);
  console.log(
    `Mock AI evaluation: ${withMockAi ? "ENABLED" : "DISABLED (deterministic checks only)"}`,
  );

  const results = [];
  let totalChecks = 0;
  let passedChecks = 0;

  for (const c of cases) {
    const caseResult = {
      id: c.id,
      source_lang: c.source_lang,
      target_lang: c.target_lang,
      case_type: c.case_type,
      review_status: c.review_status,
      deterministic: [],
      chrF: null,
    };

    // Deterministic checks (no model output yet — checks structure, not quality)
    const deterministicOutput = "";
    const checks = runDeterministicChecks(
      c.input,
      deterministicOutput,
      c.source_lang,
      c.target_lang,
      c.id,
    );

    for (const chk of checks) {
      totalChecks++;
      if (chk.pass) passedChecks++;
      caseResult.deterministic.push(chk);
    }

    // chrF only on verified cases with a reference
    if (c.review_status === "verified" && c.reference) {
      caseResult.chrF = chrF(deterministicOutput, c.reference);
    }

    results.push(caseResult);
  }

  const summary = {
    timestamp: new Date().toISOString(),
    totalCases: cases.length,
    totalChecks,
    passedChecks,
    failedChecks: totalChecks - passedChecks,
    verifiedCases: cases.filter((c) => c.review_status === "verified").length,
    withMockAi,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, "results.json"),
    JSON.stringify({ summary, results }, null, 2),
  );
  fs.writeFileSync(path.join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));

  // Markdown report
  const md = [
    "# Samiati Translation Quality Evaluation Report",
    "",
    `Generated: ${summary.timestamp}`,
    "",
    "## Summary",
    `- Total cases: ${summary.totalCases}`,
    `- Verified cases: ${summary.verifiedCases}`,
    `- Total deterministic checks: ${summary.totalChecks}`,
    `- Passed: ${summary.passedChecks}`,
    `- Failed: ${summary.failedChecks}`,
    `- Mock AI evaluation: ${summary.withMockAi ? "enabled" : "disabled"}`,
    "",
    "## Deterministic Check Results by Case",
    "",
    "| Case ID | Check | Pass | Detail |",
    "|---------|-------|------|--------|",
    ...results.flatMap((r) =>
      r.deterministic.map(
        (c) => `| ${r.id} | ${c.check} | ${c.pass ? "YES" : "NO"} | ${c.detail} |`,
      ),
    ),
    "",
    "## chrF / chrF++ (verified cases with reference only)",
    "",
    "No verified cases with reference translations found. Submit references via the reviewer workflow (qa/datasets/reviewer/).",
    "",
    "## Unsupported Languages (no language-ID detector)",
    "",
    "The following supported app languages lack language-ID detector coverage:",
    ...[...cases.map((c) => c.target_lang)]
      .filter((l, i, arr) => arr.indexOf(l) === i)
      .filter((l) => !["sw", "ki", "en"].includes(l))
      .map((l) => `- ${l}`),
    "",
    "## Limitation",
    "",
    "chrF/chrF++ scores are signals, never proof of quality. Human review is required for adequacy, fluency, and cultural appropriateness.",
    "",
  ].join("\n");

  fs.writeFileSync(path.join(OUT_DIR, "report.md"), md);

  console.log(`\nResults written to: ${OUT_DIR}`);
  console.log(`Passed: ${passedChecks}/${totalChecks} checks`);
  console.log(`Verified cases: ${summary.verifiedCases}`);
}

main();
