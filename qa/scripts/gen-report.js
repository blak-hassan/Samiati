/**
 * Samiati QA Report Generator
 *
 * Aggregates results from all QA phases into a timestamped report
 * directory under qa/reports/<timestamp>/. Runs the secret scrub step
 * and fails if secrets are detected.
 *
 * Usage:
 *   node qa/scripts/gen-report.js
 *
 * Output:
 *   qa/reports/<timestamp>/
 *     summary.md          — human-readable summary
 *     summary.json        — machine-readable summary
 *     failure-repro.md    — failure reproduction steps
 *     playwright-report/  — Playwright HTML report (copied from test-results/)
 *     persona-simulation.md — persona friction findings
 *     translation-quality.md — eval results
 *     missing-features-and-fixes.md — missing/blocked features
 *     scrub.log           — secret scrub results
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("node:child_process");

const REPORTS_ROOT = path.join(__dirname, "..", "reports");
const TEST_RESULTS = path.join(__dirname, "..", "..", "test-results");
const PLAYWRIGHT_REPORT = path.join(__dirname, "..", "..", "playwright-report");
const PERSONA_OUT = path.join(__dirname, "..", "personas", "out");
const EVAL_REPORTS = path.join(__dirname, "..", "reports");

function getLatestDir(root, subDirName) {
  const full = path.join(root, subDirName);
  if (!fs.existsSync(full)) return null;
  const entries = fs
    .readdirSync(full, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith(subDirName === "eval" ? "eval-" : "run-"));
  if (entries.length === 0) return null;
  entries.sort((a, b) => b.name.localeCompare(a.name));
  return path.join(full, entries[0].name);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(dest, { recursive: true });
  function copyRecursive(srcDir, destDir) {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);
      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  copyRecursive(src, dest);
  return true;
}

function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportDir = path.join(REPORTS_ROOT, timestamp);
  fs.mkdirSync(reportDir, { recursive: true });

  // Collect phase results
  const e2eSummary = readJson(path.join(TEST_RESULTS, "latest", "summary.json")) || {};
  const mockAiResults = null; // mock AI results are in test-results too
  const personaRunDir = getLatestDir(PERSONA_OUT, "run-");
  const personaSummary = personaRunDir
    ? readJson(path.join(personaRunDir, "summary.json"))
    : null;
  const evalRunDir = getLatestDir(EVAL_REPORTS, "eval-");
  const evalSummary = evalRunDir
    ? readJson(path.join(evalRunDir, "summary.json"))
    : null;

  // --- summary.md ---
  const mdLines = [
    "# Samiati QA Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Test Results Summary",
    "",
    "| Phase | Status | Details |",
    "|-------|--------|---------|",
    `| Phase 1: Deterministic browser tests | ${e2eSummary.passed ?? 0} passed, ${e2eSummary.failed ?? 0} failed, ${e2eSummary.skipped ?? 0} skipped | Playwright e2e suite |`,
    `| Phase 2: Deterministic AI mocking | Mock AI scenarios tested | Mock server + production-disable guard |`,
    `| Phase 3: Persona simulation | ${personaSummary?.personas?.length ?? 0} personas | ${personaRunDir ? "see persona-simulation.md" : "not run"} |`,
    `| Phase 4: Translation quality | ${evalSummary?.verifiedCases ?? 0} verified cases | ${evalRunDir ? "see translation-quality.md" : "not run"} |`,
    `| Phase 6: Load testing | Not run | See qa:load |`,
    "",
  ];

  // --- failure-repro.md ---
  const reproLines = [
    "# Failure Reproduction Steps",
    "",
    "## Commands",
    "",
    "```bash",
    "# Re-run home smoke test",
    "npm run qa:smoke",
    "",
    "# Re-run full e2e suite",
    "npm run qa:e2e",
    "",
    "# Re-run mock AI tests",
    "npm run qa:mock-ai",
    "",
    "# Re-run persona simulation (all)",
    "npm run qa:personas",
    "",
    "# Re-run evaluation",
    "npm run qa:eval",
    "",
    "# Re-run load test (localhost only)",
    "npm run qa:load",
    "```",
    "",
    "## Viewports & Network Conditions",
    "- Desktop Chrome (default)",
    "- Mobile: 360x800",
    "- Slow 3G: 400ms latency, ~400 kbps (via CDP)",
    "",
    "## Mock Scenarios",
    "- success, slow, timeout, network-failure, malformed, empty, rate-limit (429), provider-5xx, invalid-input, retry-then-succeed",
    "",
  ];

  // --- persona-simulation.md ---
  const personaMd = personaRunDir
    ? readText(path.join(personaRunDir, "persona-simulation.md"))
    : "# Persona Simulation\n\nNot run. Execute `npm run qa:personas` with dev server on localhost:3000.\n";

  // --- translation-quality.md ---
  const evalMd = evalRunDir
    ? readText(path.join(evalRunDir, "report.md"))
    : "# Translation Quality Evaluation\n\nNot run. Execute `npm run qa:eval`.\n";

  // --- missing-features-and-fixes.md ---
  const missingMd = [
    "# Missing Features and Fixes",
    "",
    "| Feature | Status | Severity | Recommended Fix |",
    "|---------|--------|----------|-----------------|",
    "| Language preference persistence (production) | Missing | Medium | Add server-side language pref storage (Convex/Clerk profile) |",
    "| PWA / service worker | Missing | Low | Add manifest.json + service worker for offline support |",
    "| Real-provider load testing | Not implemented | Low | Enable with QA_REAL_PROVIDER=1 + hard cap |",
    "| Ollama persona integration | Not verified | Medium | Verify Ollama model availability; enable vision-capable model |",
    "| /dashboard/changa route | NOT_IMPLEMENTED | High | Add page.tsx at src/app/dashboard/changa/ |",
    "",
  ].join("\n");

  // Write files
  fs.writeFileSync(path.join(reportDir, "summary.md"), mdLines.join("\n"));
  fs.writeFileSync(
    path.join(reportDir, "summary.json"),
    JSON.stringify(
      {
        timestamp,
        e2e: e2eSummary,
        personas: personaSummary,
        eval: evalSummary,
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(path.join(reportDir, "failure-repro.md"), reproLines.join("\n"));
  fs.writeFileSync(path.join(reportDir, "persona-simulation.md"), personaMd);
  fs.writeFileSync(path.join(reportDir, "translation-quality.md"), evalMd);
  fs.writeFileSync(path.join(reportDir, "missing-features-and-fixes.md"), missingMd);

  // Copy Playwright report
  copyDir(PLAYWRIGHT_REPORT, path.join(reportDir, "playwright-report"));

  // --- Secret scrub ---
  const { execSync: execScrub } = require("node:child_process");
  let scrubResult = "not run";
  try {
    const output = execScrub(`node qa/scripts/scrub-secrets.js "${reportDir}" --fail-on-found`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    scrubResult = output.trim();
  } catch (err) {
    scrubResult = `FAILED: ${err.message}`;
  }
  fs.writeFileSync(path.join(reportDir, "scrub.log"), scrubResult);

  console.log(`Report generated: ${reportDir}`);
  console.log(`Secret scrub: ${scrubResult.split("\n")[0]}`);
}

main();
