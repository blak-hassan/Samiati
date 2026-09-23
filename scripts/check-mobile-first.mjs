// scripts/check-mobile-first.mjs
// Static mobile-first audit. Reads src/**/*.tsx and globals.css and reports:
//  1. Viewport contract: layout.tsx must expose a viewport that enables
//     width=device-width + initial-scale=1 (Next does this either via an
//     exported `viewport` object or a <meta name="viewport"> tag). The
//     interactiveWidget:"resizes-content" preset implies it.
//  2. Desktop-first media queries in globals.css (min-width >= 768px with no
//     mobile-first max-width override) — reported as warnings.
//  3. Hard-coded desktop widths in JSX — reported as warnings.
//
// Exit code 1 only for hard errors (missing viewport contract). Warnings are
// advisory and do not fail the gate.
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const SRC = join(ROOT, 'src');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      walk(p, out);
    } else if (/\.(tsx|ts)$/.test(entry.name)) out.push(p);
  }
  return out;
}

const files = walk(SRC);
const errors = [];
const warnings = [];

// 1. Viewport contract.
const layoutPath = join(SRC, 'app', 'layout.tsx');
const layoutSrc = readFileSync(layoutPath, 'utf8');

const hasMetaViewport = /<meta\s+name="viewport"\s+content="([^"]+)"/.test(layoutSrc);
const hasExportedViewport = /export\s+const\s+viewport\s*:\s*Viewport\s*=\s*\{/.test(layoutSrc);

if (!hasMetaViewport && !hasExportedViewport) {
  errors.push('src/app/layout.tsx exposes no viewport (neither <meta> nor exported `viewport` object)');
} else if (hasMetaViewport) {
  const vp = layoutSrc.match(/<meta\s+name="viewport"\s+content="([^"]+)"/);
  const content = vp[1];
  if (!/initial-scale=1/.test(content)) {
    errors.push(`viewport meta missing initial-scale=1: "${content}"`);
  }
  if (!/width=device-width/.test(content)) {
    errors.push(`viewport meta missing width=device-width: "${content}"`);
  }
  if (/user-scalable=no/.test(content)) {
    errors.push('viewport disables pinch-zoom (user-scalable=no) — accessibility regression');
  }
} else if (hasExportedViewport) {
  // Next.js implies width=device-width + initial-scale=1 for an exported
  // viewport object. Only flag an explicit user-scalable=no.
  const block = layoutSrc.match(/export\s+const\s+viewport\s*:\s*Viewport\s*=\s*\{([^}]*)\}/s)?.[1] ?? '';
  if (/user-scalable=no/.test(block)) {
    errors.push('exported viewport disables pinch-zoom (user-scalable=no) — accessibility regression');
  }
}

// 2. Media-query orientation in globals.css.
//    Tailwind v4's @screen/@custom-variant convention uses min-width
//    breakpoints, which is the standard "mobile-first" pattern: start
//    narrow and progressively enhance. We flag only *max-width* queries
//    that target desktop sizes (a genuine desktop-first smell) and count
//    the declared min-width breakpoints so the audit is non-vacuous.
const cssPath = join(SRC, 'app', 'globals.css');
const css = readFileSync(cssPath, 'utf8');
const mqRe = /@media\s*\(\s*(min-width|max-width)\s*:\s*(\d+)px\s*\)/g;
let desktopFirst = 0;
let m;
while ((m = mqRe.exec(css)) !== null) {
  const dir = m[1];
  const px = Number(m[2]);
  if (dir === 'max-width' && px >= 768) {
    desktopFirst++;
    warnings.push(
      `globals.css: desktop-first media query @media (max-width: ${px}px) — prefer mobile-first (min-width: ${px + 1}px)`,
    );
  }
}
const minWidthCount = (css.match(/@media\s*\(\s*min-width\s*:\s*\d+px\s*\)/g) || []).length;
if (minWidthCount === 0) {
  errors.push('globals.css declares no min-width breakpoints — layout is not mobile-first');
} else {
  console.log(`ok  ${minWidthCount} min-width breakpoint(s) declared (mobile-first)`);
}

// 3. Hard-coded desktop widths in JSX.
const widthRe = /\b(?:w-|width:\s*)(\d{3,})px/g;
for (const file of files) {
  const rel = file.replace(ROOT + '\\', '').replace(ROOT + '/', '');
  const src = readFileSync(file, 'utf8');
  let mm;
  while ((mm = widthRe.exec(src)) !== null) {
    const px = Number(mm[1]);
    if (px >= 768) {
      warnings.push(`${rel}: hard-coded width ${px}px (desktop-sized)`);
    }
  }
}

console.log('Mobile-first audit');
console.log('='.repeat(80));

if (errors.length) {
  console.log(`\n${errors.length} error(s):`);
  for (const e of errors) console.log(`  ✗ ${e}`);
} else {
  console.log('viewport contract: OK (mobile-first)');
}

console.log(`\n${warnings.length} advisory warning(s):`);
for (const w of warnings.slice(0, 30)) console.log(`  ~ ${w}`);
if (warnings.length > 30) console.log(`  ... and ${warnings.length - 30} more`);

if (errors.length) process.exit(1);