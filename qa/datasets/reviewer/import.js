/**
 * Reviewer CSV import script for Samiati translation quality dataset.
 *
 * Reads a reviewer-supplied CSV and merges verified translations back into
 * qa/datasets/cases.jsonl. No external dependencies (built-in CSV parsing).
 *
 * Usage:
 *   node qa/datasets/reviewer/import.js <reviewer.csv>
 *
 * CSV columns: id, source_lang, target_lang, input, expected_meaning,
 * case_type, provenance, reviewer, review_status, reference, notes
 *
 * Only rows with review_status = 'verified' or 'rejected' are applied.
 */

const fs = require("fs");
const path = require("path");

const CASES_FILE = path.join(__dirname, "..", "cases.jsonl");

function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? "";
    }
    rows.push(row);
  }
  return rows;
}

if (process.argv.length < 3) {
  console.error("Usage: node import.js <reviewer.csv>");
  process.exit(1);
}

const csvPath = path.resolve(process.argv[2]);
if (!fs.existsSync(csvPath)) {
  console.error(`CSV not found: ${csvPath}`);
  process.exit(1);
}

// Load existing cases
const cases = fs
  .readFileSync(CASES_FILE, "utf8")
  .split("\n")
  .filter((l) => l.trim())
  .map((l) => JSON.parse(l));
const byId = new Map(cases.map((c) => [c.id, c]));

// Parse CSV
const csvContent = fs.readFileSync(csvPath, "utf8");
const records = parseCsv(csvContent);

let verifiedCount = 0;
let rejectedCount = 0;
let skippedCount = 0;

for (const row of records) {
  const id = (row.id ?? "").trim();
  if (!id || !byId.has(id)) {
    skippedCount++;
    continue;
  }

  const status = (row.review_status ?? "").trim();
  const existing = byId.get(id);

  if (status === "verified") {
    existing.reference = (row.reference ?? "").trim();
    existing.review_status = "verified";
    existing.reviewer = (row.reviewer ?? "").trim() || existing.reviewer;
    existing.notes = (row.notes ?? "").trim() || existing.notes;
    verifiedCount++;
  } else if (status === "rejected") {
    existing.review_status = "rejected";
    existing.reviewer = (row.reviewer ?? "").trim() || existing.reviewer;
    existing.notes = (row.notes ?? "").trim() || existing.notes;
    rejectedCount++;
  } else {
    skippedCount++;
  }
}

// Write back
const output = cases.map((c) => JSON.stringify(c)).join("\n") + "\n";
fs.writeFileSync(CASES_FILE, output);

console.log(`Import complete: ${verifiedCount} verified, ${rejectedCount} rejected, ${skippedCount} skipped`);
