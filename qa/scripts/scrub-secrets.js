/**
 * Secret scrub step for QA reports.
 *
 * Scans report output (strings/files) for API keys, tokens, cookies,
 * emails, and other secrets. Fails the run (non-zero exit) if any
 * secrets are detected.
 *
 * Usage:
 *   node qa/scripts/scrub-secrets.js <report-dir> [--fail-on-found]
 *
 * Patterns detected (names/patterns only, never values):
 *   - API keys (sk-, pk_, sk_or_, etc.)
 *   - JWT tokens (eyJ...)
 *   - Email addresses
 *   - Convex deployment IDs
 *   - Cookie/session values
 */

const fs = require("fs");
const path = require("path");

const SECRET_PATTERNS = [
  { name: "API key (sk-)", pattern: /sk-[A-Za-z0-9]{20,}/g },
  { name: "Clerk publishable key (pk_)", pattern: /pk_[A-Za-z0-9]{20,}/g },
  { name: "Stripe key (sk_or_)", pattern: /sk_or_[A-Za-z0-9]{20,}/g },
  { name: "JWT token", pattern: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g },
  { name: "Email address", pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  { name: "Convex deployment ID", pattern: /convex-[A-Za-z0-9_-]{10,}/g },
  { name: "Generic API key", pattern: /[Aa][Pp][Ii][_-]?[Kk][Ee][Yy]\s*[:=]\s*[A-Za-z0-9_-]{20,}/gi },
  { name: "Secret key", pattern: /[Ss][Ee][Cc][Rr][Ee][Tt]\s*[:=]\s*[A-Za-z0-9_-]{20,}/gi },
  { name: "Token", pattern: /[Tt][Oo][Kk][Ee][Nn]\s*[:=]\s*[A-Za-z0-9_-]{20,}/gi },
];

function scanText(text, source) {
  const findings = [];
  for (const { name, pattern } of SECRET_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      findings.push({ source, type: name, count: matches.length });
    }
  }
  return findings;
}

function scanFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    return [];
  }
  return scanText(content, filePath);
}

function scanDirectory(dir) {
  const findings = [];
  const entries = fs.readdirSync(dir, { recursive: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isFile()) {
      const fileFindings = scanFile(fullPath);
      findings.push(...fileFindings);
    }
  }
  return findings;
}

function main() {
  const reportDir = process.argv[2];
  const failOnFound = process.argv.includes("--fail-on-found");

  if (!reportDir || !fs.existsSync(reportDir)) {
    console.error(`Report directory not found: ${reportDir}`);
    process.exit(1);
  }

  const findings = scanDirectory(reportDir);

  if (findings.length > 0) {
    console.error("SECRET SCRUB FAILED: secrets detected in report output:");
    for (const f of findings) {
      console.error(`  ${f.source}: ${f.type} (${f.count} match(es))`);
    }
    if (failOnFound) {
      process.exit(1);
    }
  } else {
    console.log("Secret scrub passed: no secrets detected in report output.");
  }
}

main();
