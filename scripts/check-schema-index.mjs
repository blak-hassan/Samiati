#!/usr/bin/env node
// scripts/check-schema-index.mjs
// CI gate: any new queryable field in convex/schema.ts must be covered by an
// .index chained on the same defineTable() call. See docs/perf.md §2 and §6.
//
// Usage:
//   node scripts/check-schema-index.mjs [--base <ref>] [--schema <path>]
// Defaults: --base origin/main, --schema convex/schema.ts
//
// Exit codes:
//   0 = no missing indexes
//   1 = missing indexes reported
//   2 = usage / git error

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
function getArg(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
}

const base = getArg('--base', 'origin/main');
const schemaPath = resolve(getArg('--schema', 'convex/schema.ts'));

function git(args, opts = {}) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', ...opts }).trim();
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString() : '';
    throw new Error(`git ${args.join(' ')} failed: ${stderr || err.message}`);
  }
}

function readAt(ref, file) {
  try {
    return git(['show', `${ref}:${file}`]);
  } catch {
    return null;
  }
}

function getSchemaText(ref) {
  if (ref === 'WORKING') return readFileSync(schemaPath, 'utf8');
  return readAt(ref, 'convex/schema.ts');
}

// Resolves the best base ref to diff against. Priority:
//   1. --base argument (if provided)
//   2. origin/main (if it exists)
//   3. main (local branch)
//   4. HEAD~1 (fallback when there's no merge-base to compare to)
function resolveBaseRef(explicit) {
  if (explicit) return explicit;
  for (const ref of ['origin/main', 'main', 'HEAD~1']) {
    try {
      git(['rev-parse', '--verify', '--quiet', ref]);
      return ref;
    } catch {
      // try next
    }
  }
  return 'HEAD~1';
}

// Find balanced {...} starting at openIdx, returning [innerStart, innerEnd] (indices of the braces).
function balancedBraces(text, openIdx) {
  if (text[openIdx] !== '{') throw new Error('expected {');
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    const c = text[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return [openIdx, i];
    }
  }
  throw new Error('unbalanced braces');
}

// Skip whitespace from `from` and return the index of the next `{`, or -1 if
// we hit anything else unexpected. Caller is responsible for ensuring
// `defineTable(` starts at or before `from`.
function findOpenBrace(text, from) {
  for (let i = from; i < text.length; i++) {
    if (text[i] === '{') return i;
    if (
      text[i] === '(' ||
      text[i] === ')' ||
      text[i] === ' ' ||
      text[i] === '\n' ||
      text[i] === '\t' ||
      text[i] === '\r'
    )
      continue;
    return -1;
  }
  return -1;
}

// Walk the schema and emit per-table records:
//   { name, bodyText, indexFieldLists: string[][], indexNames: string[] }
function parseSchema(text) {
  const tables = [];
  const nameRe = /\b(\w+)\s*:\s*defineTable\s*\(/g;
  let m;
  while ((m = nameRe.exec(text)) !== null) {
    const name = m[1];
    // The regex already matched "defineTable(" including the paren, so
    // start scanning for the body `{` from the position right after the
    // paren.
    const scanFrom = m.index + m[0].length;
    const openIdx = findOpenBrace(text, scanFrom);
    if (openIdx < 0) continue;
    const [bodyStart, bodyEnd] = balancedBraces(text, openIdx);

    // The chain after the body is one or more `.index("name", [a, b]). ...`
    // calls, then the table entry terminates with a `,` (comma-separated
    // inside `defineSchema({...})`). Skip past the closing `)` of
    // `defineTable(...)` first, then track paren depth to stop at the
    // first top-level `,`.
    let chainStart = bodyEnd + 1;
    for (let i = chainStart; i < text.length; i++) {
      if (text[i] === ')') {
        chainStart = i + 1;
        break;
      }
    }
    const maxScan = Math.min(chainStart + 4000, text.length);
    let depth = 0;
    let chainEnd = maxScan;
    for (let i = chainStart; i < maxScan; i++) {
      const c = text[i];
      if (c === '(' || c === '{' || c === '[') depth++;
      else if (c === ')' || c === '}' || c === ']') depth--;
      else if (depth === 0 && (c === ',' || c === ';' || c === '}')) {
        chainEnd = i;
        break;
      }
    }
    const chainText = text.slice(chainStart, chainEnd);

    const indexRe = /\.index\(\s*["']([^"']+)["']\s*,\s*\[([^\]]*)\]\s*\)/g;
    const indexFieldLists = [];
    const indexNames = [];
    let im;
    while ((im = indexRe.exec(chainText)) !== null) {
      indexNames.push(im[1]);
      // Strip surrounding quotes and trim so comparisons against
      // `extractTopLevelFields` output (which is unquoted) line up.
      const fields = im[2]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.replace(/^["'](.*)["']$/, '$1'));
      indexFieldLists.push(fields);
    }

    tables.push({
      name,
      bodyText: text.slice(bodyStart, bodyEnd + 1),
      indexFieldLists,
      indexNames,
    });
  }
  return tables;
}

// Extract top-level field names from a `defineTable({...})` body. Skips nested
// objects/arrays and the right-hand side of each property. We tokenize braces
// to track depth and only treat top-level `name:` as a field.
function extractTopLevelFields(body) {
  // strip outer braces
  const inner = body.slice(1, -1);
  const fields = [];
  let depth = 0;
  let buf = '';
  let i = 0;
  while (i < inner.length) {
    const c = inner[i];
    if (c === '{' || c === '[' || c === '(') depth++;
    else if (c === '}' || c === ']' || c === ')') depth--;
    if (depth === 0 && c === '\n') {
      const line = buf.trim();
      buf = '';
      // match `name:` where name is a valid identifier
      const m = /^([A-Za-z_$][A-Za-z0-9_$]*)\s*:/.exec(line);
      if (m) fields.push(m[1]);
    } else {
      buf += c;
    }
    i++;
  }
  // final partial line
  const line = buf.trim();
  const m = /^([A-Za-z_$][A-Za-z0-9_$]*)\s*:/.exec(line);
  if (m) fields.push(m[1]);
  return fields;
}

function indexCovers(indexFieldLists, field) {
  return indexFieldLists.some((list) => list.includes(field));
}

function diffFields(prevFields, currFields) {
  const prev = new Set(prevFields);
  return currFields.filter((f) => !prev.has(f));
}

function main() {
  const explicitBase = process.argv.includes('--base')
    ? process.argv[process.argv.indexOf('--base') + 1]
    : null;
  const baseRef = resolveBaseRef(explicitBase);

  const headText = getSchemaText('WORKING');
  const baseText = getSchemaText(baseRef);

  if (baseText === null) {
    console.error(`schema-index: could not read ${baseRef}:convex/schema.ts — skipping diff.`);
    process.exit(0);
  }

  const headTables = parseSchema(headText);
  const baseTables = new Map(parseSchema(baseText).map((t) => [t.name, t]));

  const missing = [];
  for (const t of headTables) {
    const prev = baseTables.get(t.name);
    const prevFields = prev ? extractTopLevelFields(prev.bodyText) : [];
    const currFields = extractTopLevelFields(t.bodyText);
    const newFields = prev ? diffFields(prevFields, currFields) : currFields;
    for (const f of newFields) {
      if (!indexCovers(t.indexFieldLists, f)) {
        missing.push({ table: t.name, field: f, indexNames: t.indexNames });
      }
    }
  }

  if (missing.length === 0) {
    console.log(`schema-index: ok (${headTables.length} tables, base=${baseRef})`);
    process.exit(0);
  }

  console.error('schema-index: missing index coverage for new fields:');
  for (const m of missing) {
    console.error(
      `  - ${m.table}.${m.field}  (existing indexes: ${
        m.indexNames.length ? m.indexNames.join(', ') : '<none>'
      })`
    );
  }
  console.error(
    '\nAdd a matching .index("...", ["<field>", ...]) to the same defineTable(), or apply the `perf:no-schema-impact` label from a CODEOWNER.'
  );
  process.exit(1);
}

try {
  main();
} catch (err) {
  console.error(`schema-index: ${err.message}`);
  process.exit(2);
}
