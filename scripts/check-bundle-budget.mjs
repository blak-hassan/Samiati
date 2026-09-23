#!/usr/bin/env node
// scripts/check-bundle-budget.mjs
// CI gate: first-load JS for budgeted routes must not exceed
// perf-budget.json:bundle.maxKb. See docs/perf.md §6.
//
// Approach: Next's .next/build-manifest.json lists, per page entry, the
// chunks required to render that route. We sum the on-disk size of each
// unique chunk and report per-route totals; fail if any budgeted route
// exceeds the cap.
//
// Defaults:
//   BUDGET_FILE = perf-budget.json
//   BUILD_MANIFEST = .next/build-manifest.json
//   APP_DIR = .next
//
// Exit codes:
//   0 = all budgeted routes within budget
//   1 = one or more budgeted routes exceed budget
//   2 = usage / file error

import { readFileSync, statSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = process.cwd();
const BUDGET_FILE = resolve(ROOT, process.env.BUDGET_FILE || 'perf-budget.json');
const MANIFEST = resolve(ROOT, process.env.BUILD_MANIFEST || '.next/build-manifest.json');
const APP_DIR = resolve(ROOT, process.env.APP_DIR || '.next');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function chunkSize(relPath) {
  // Build manifest entries look like "static/chunks/foo.js" — relative to
  // the app dir.
  const abs = join(APP_DIR, relPath);
  if (!existsSync(abs)) {
    return 0;
  }
  return statSync(abs).size;
}

function kb(bytes) {
  return Math.round(bytes / 1024);
}

function main() {
  if (!existsSync(BUDGET_FILE)) {
    console.error(`bundle-budget: missing ${BUDGET_FILE}`);
    process.exit(2);
  }
  if (!existsSync(MANIFEST)) {
    console.error(`bundle-budget: missing ${MANIFEST} (run \`ANALYZE=true npm run build\` first)`);
    process.exit(2);
  }
  const budget = readJson(BUDGET_FILE);
  const cap = budget.bundle?.maxKb;
  if (!cap || typeof cap !== 'number') {
    console.error(`bundle-budget: bundle.maxKb missing or non-numeric in ${BUDGET_FILE}`);
    process.exit(2);
  }
  const budgetedRoutes = new Set(budget.budgetedRoutes || []);
  const manifest = readJson(MANIFEST);
  const pages = manifest.pages || {};
  // The shared chunks live at the manifest root (`rootMainFiles`), not
  // inside `pages`. (Pages only holds per-route chunk lists.)
  const shared = manifest.rootMainFiles || pages.rootMainFiles || [];
  const sharedBytes = shared.reduce((acc, p) => acc + chunkSize(p), 0);
  const sharedKb = kb(sharedBytes);

  const rows = [];
  let breached = false;
  for (const [route, chunks] of Object.entries(pages)) {
    if (route === 'rootMainFiles' || route === '__BUILD_TIMESTAMP__' || route === 'ampDevFiles')
      continue;
    const uniq = new Set([...shared, ...(chunks || [])]);
    const bytes = [...uniq].reduce((acc, p) => acc + chunkSize(p), 0);
    rows.push({ route, kb: kb(bytes) });
  }
  rows.sort((a, b) => b.kb - a.kb);

  console.log(`bundle-budget: shared (root) = ${sharedKb} kB; cap = ${cap} kB`);
  for (const r of rows) {
    const isBudgeted = budgetedRoutes.has(r.route) || budgetedRoutes.has(routeKey(r.route));
    const flag = isBudgeted ? (r.kb > cap ? 'FAIL' : 'ok ') : '   ';
    if (isBudgeted && r.kb > cap) breached = true;
    console.log(`  [${flag}] ${r.route.padEnd(40)} ${r.kb} kB${isBudgeted ? '  (budgeted)' : ''}`);
  }
  if (breached) {
    console.error(
      `\nbundle-budget: at least one budgeted route exceeds ${cap} kB. Update perf-budget.json in the same PR that intentionally changes a baseline.`
    );
    process.exit(1);
  }
  console.log(`bundle-budget: ok (${rows.length} routes checked)`);
}

// Best-effort normalization so /feed matches a /feed entry, etc.
function routeKey(route) {
  if (route === '/') return '/';
  return route.replace(/^\//, '/').replace(/\/$/, '');
}

try {
  main();
} catch (err) {
  console.error(`bundle-budget: ${err.stack || err.message}`);
  process.exit(2);
}
