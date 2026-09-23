// scripts/check-contrast.mjs
// Reads src/app/globals.css, extracts every --color-* token in :root and
// .dark, and asserts the text/background pairs used by the app meet WCAG AA.
// Exit code 1 if any pair fails.
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const cssPath = join(ROOT, 'src', 'app', 'globals.css');
const css = readFileSync(cssPath, 'utf8');

function extractBlock(selector) {
  // @theme blocks are nested inside a CSS at-rule, so a naive regex won't
  // capture them. Walk the file token by token and collect the body of the
  // first block whose selector matches.
  const lines = css.split('\n');
  let depth = 0;
  let inTarget = false;
  let collecting = false;
  let body = '';
  for (const line of lines) {
    const trimmed = line.trim();
    if (!collecting) {
      if (trimmed.startsWith(selector)) {
        inTarget = true;
        collecting = true;
        depth = 0;
        const open = line.indexOf('{');
        if (open !== -1) {
          body += line.slice(open + 1) + '\n';
          depth = 1;
        }
      }
      continue;
    }
    // Collecting the target block body.
    for (const ch of line) {
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return body;
      }
    }
    body += line + '\n';
  }
  return body;
}

function parseHex(hex) {
  const m = hex.trim().replace(/^#/, '');
  if (m.length === 3) {
    return { r: parseInt(m[0] + m[0], 16), g: parseInt(m[1] + m[1], 16), b: parseInt(m[2] + m[2], 16) };
  }
  if (m.length === 6) {
    return { r: parseInt(m.slice(0, 2), 16), g: parseInt(m.slice(2, 4), 16), b: parseInt(m.slice(4, 6), 16) };
  }
  return null;
}

function linearize(channel) {
  const s = channel / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance({ r, g, b }) {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

function requiredRatio(level, size) {
  if (level === 'AAA') return size === 'large' ? 4.5 : 7;
  return size === 'large' ? 3 : 4.5;
}

const rootBlock = extractBlock(':root');
const darkBlock = extractBlock('\\.dark');

function parseVars(block) {
  const vars = {};
  const re = /--([\w-]+):\s*([^;]+);/g;
  let m;
  while ((m = re.exec(block)) !== null) {
    const name = m[1];
    let raw = m[2].trim();
    let guard = 0;
    while (raw.startsWith('var(') && guard < 10) {
      const inner = raw.slice(4, -1).trim();
      raw = vars[inner] ?? raw;
      guard++;
    }
    vars[name] = raw;
  }
  return vars;
}

const vars = { ...parseVars(rootBlock), ...parseVars(darkBlock) };

function hexFor(name) {
  const raw = vars[name];
  if (!raw) return null;
  const m = raw.match(/#[0-9a-fA-F]{3,6}/);
  return m ? m[0] : null;
}

// Pairs to check: [foreground token, background token, size].
const PAIRS = [
    ['foreground', 'background', 'normal'],
    ['card-foreground', 'card', 'normal'],
    ['card-foreground', 'background', 'normal'],
    ['muted-foreground', 'background', 'normal'],
    ['muted-foreground', 'card', 'normal'],
    ['muted-foreground', 'input', 'normal'],
    ['secondary-foreground', 'secondary', 'normal'],
    ['accent-foreground', 'accent', 'normal'],
    ['sidebar-foreground', 'sidebar', 'normal'],
    ['sidebar-foreground', 'background', 'normal'],
    ['primary-foreground', 'primary', 'normal'],
    // Brand tokens used directly in components (not aliased to shadcn vars).
    ['color-text-muted', 'color-deep-brown', 'normal'],
    // Theme-aware brand gold (text-gold on the landing page) — see --gold.
    ['gold', 'background', 'normal'],
    ['muted-foreground', 'muted', 'normal'],
  ];

  // WCAG 1.4.3 applies to *text*. These tokens are UI-only colors (icons,
  // borders, button fills, focus rings) — never rendered as text — so they
  // are exempt from the text/background ratio check. They must still be
  // legible as UI elements, which is enforced by the axe color-contrast rule
  // in e2e/a11y.spec.ts and e2e/mobile-first.spec.ts.
  const UI_ONLY = new Set(['destructive', 'color-error']);

let failures = 0;
  let total = 0;
  const report = [];

  for (const [fgName, bgName, size] of PAIRS) {
    if (UI_ONLY.has(fgName) || UI_ONLY.has(bgName)) continue;
    const fg = hexFor(fgName);
    const bg = hexFor(bgName);
    if (!fg || !bg) continue;
    const fgRgb = parseHex(fg);
    const bgRgb = parseHex(bg);
    if (!fgRgb || !bgRgb) continue;
    const ratio = contrastRatio(fgRgb, bgRgb);
    const required = requiredRatio('AA', size);
    const pass = ratio >= required;
    total++;
    report.push({ fg: fgName, bg: bgName, fgHex: fg, bgHex: bg, ratio, required, pass, size });
    if (!pass) failures++;
  }

console.log('WCAG AA contrast audit (globals.css tokens)');
console.log('='.repeat(92));
console.log(`${'fg token'.padEnd(20)} ${'bg token'.padEnd(20)} ${'size'.padEnd(7)} ${'ratio'.padEnd(7)} ${'req'.padEnd(6)} pass`);
console.log('-'.repeat(92));
for (const r of report) {
  console.log(
    `${r.fg.padEnd(20)} ${r.bg.padEnd(20)} ${r.size.padEnd(7)} ${r.ratio.toFixed(2).padEnd(7)} ${r.required.toFixed(1).padEnd(6)} ${r.pass ? 'ok' : 'FAIL'}`,
  );
}
console.log(`\n${failures}/${total} pairs fail WCAG AA`);

if (failures > 0) {
  console.log('\nRecommended fixes (closest gray that meets 4.5:1):');
  for (const r of report.filter((x) => !x.pass)) {
    const fgRgb = parseHex(r.fgHex);
    const bgRgb = parseHex(r.bgHex);
    const bgL = relativeLuminance(bgRgb);
    const fgL = relativeLuminance(fgRgb);
    const lighter = fgL > bgL;
    const target = 4.5;
    // Required luminance for the foreground, then invert linearize() to a channel.
    const needL = lighter
      ? target * (bgL + 0.05) - 0.05
      : (bgL + 0.05) / target - 0.05;
    let s;
    if (needL <= 0.031308) {
      s = needL * 12.92;
    } else {
      s = 1.055 * Math.pow(needL, 1 / 2.4) - 0.055;
    }
    const channel = Math.max(0, Math.min(255, Math.round(s * 255)));
    const hex = `#${channel.toString(16).padStart(2, '0').repeat(3)}`;
    console.log(`  ${r.fg} on ${r.bg}: set ${r.fg} = ${hex} (was ${r.fgHex})`);
  }
}

process.exit(failures > 0 ? 1 : 0);