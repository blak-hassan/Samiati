#!/usr/bin/env node
/**
 * CI guardrail: enforce that writes to the dataset tables go through
 * the chokepoint (`convex/changa/datasetWrites.ts`).
 *
 * Why: the train/eval contamination guard and the dataset-release
 * count integrity depend on *every* write to changaCuratedExamples,
 * changaDatasetReleases, changaReleaseMembers, changaEvaluationSets,
 * changaEvaluationItems, and changaDecisions running through the
 * chokepoint's internal mutations. A direct ctx.db.insert/patch in any
 * other file silently bypasses the guard.
 *
 * This script greps for `ctx.db.<op>("<protectedTable>", ...)` outside
 * the chokepoint and exits non-zero if any are found.
 *
 * Usage:
 *   node scripts/check-dataset-chokepoints.mjs
 *
 * Exit code:
 *   0  - no violations
 *   1  - violations found (CI fails)
 *
 * See docs/architecture/convex-decision.md for context.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONVEX_DIR = join(REPO_ROOT, "convex");

const PROTECTED_TABLES = [
    // Lineage / training-data tables.
    "changaCuratedExamples",
    "changaDatasetReleases",
    "changaReleaseMembers",
    "changaEvaluationSets",
    "changaEvaluationItems",
    "changaDecisions",
    // Contribution-pipeline tables.
    "changaTaskTemplates",
    "changaTasks",
    "changaTaskClaims",
    "changaSubmissions",
    "changaSubmissionAssets",
    "changaProcessingRuns",
    "changaValidationAssignments",
    "changaValidationVotes",
    // Community / engagement tables.
    "changaCampaigns",
    "changaCampaignProposals",
    "changaUserStats",
    "changaRoleGrants",
    "changaInvites",
    // Consent tables.
    "changaConsentPolicies",
    "changaConsentRecords",
    // Document tables.
    "changaDocuments",
    "changaDocumentEntries",
];

// The chokepoint itself contains legitimate writes.
const CHOKEPOINT_FILE = "convex/changa/datasetWrites.ts";

const OP_PATTERN = new RegExp(
    `ctx\\.db\\.(insert|patch|replace|delete)\\(\\s*"(?:${PROTECTED_TABLES.join("|")})"`,
    "g",
);

function* walk(dir) {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const s = statSync(full);
        if (s.isDirectory()) {
            yield* walk(full);
        } else if (s.isFile() && (entry.endsWith(".ts") || entry.endsWith(".tsx"))) {
            yield full;
        }
    }
}

const violations = [];

for (const file of walk(CONVEX_DIR)) {
    const rel = relative(REPO_ROOT, file).replace(/\\/g, "/");
    if (rel === CHOKEPOINT_FILE) continue;

    const content = readFileSync(file, "utf8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
        if (OP_PATTERN.test(lines[i])) {
            violations.push({
                file: rel,
                line: i + 1,
                text: lines[i].trim(),
            });
        }
        OP_PATTERN.lastIndex = 0; // reset for next match
    }
}

if (violations.length > 0) {
    console.error("=" .repeat(72));
    console.error("CHOKEPOINT VIOLATION: direct writes to protected changa* tables");
    console.error("must go through convex/changa/datasetWrites.ts.");
    console.error("=" .repeat(72));
    for (const v of violations) {
        console.error(`  ${v.file}:${v.line}`);
        console.error(`    ${v.text}`);
    }
    console.error("");
    console.error(`Found ${violations.length} violation(s).`);
    console.error("");
    console.error("To fix: refactor the call site to use the chokepoint's internal");
    console.error("mutations (e.g. internal.changa.datasetWrites.insertCuratedExample).");
    console.error("See docs/architecture/convex-decision.md for the rationale.");
    process.exit(1);
}

console.log("OK: no direct writes to protected changa* tables outside the chokepoint.");
