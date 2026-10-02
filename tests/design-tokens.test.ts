// tests/design-tokens.test.ts
// Design-token invariants for src/app/globals.css.
//
// These lock in the Phase 0 reconciliation between docs/design/tokens.md and
// the CSS, so the two can't silently drift apart again. Source-level
// assertions only (no DOM) — same idiom as tests/schema-index.test.ts and
// tests/chokepoint.test.ts.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');
const SRC = join(REPO_ROOT, 'src');
const CSS = readFileSync(join(SRC, 'app', 'globals.css'), 'utf8');

/** Text of a top-level `selector { ... }` block, brace-balanced. */
function blockBody(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`selector not found: ${selector}`);
  let depth = 0;
  for (let i = css.indexOf('{', start); i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') {
      depth--;
      if (depth === 0) return css.slice(start, i + 1);
    }
  }
  throw new Error(`unbalanced block: ${selector}`);
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts|css)$/.test(entry.name)) out.push(p);
  }
  return out;
}

const root = blockBody(CSS, ':root');
const dark = blockBody(CSS, '.dark');

describe('design tokens (src/app/globals.css)', () => {
  it('declares one brand accent instead of scattered hard-coded hexes', () => {
    expect(CSS).toMatch(/--color-brand-accent:\s*#cf6317/i);
    expect(CSS).toMatch(/--color-brand-accent-hover:\s*#b05210/i);
  });

  it('has no leftover brand-accent hexes in class names under src/', () => {
    // Regression: #cf6317 was inlined as `[#cf6317]` in 70+ utilities, so a
    // palette change silently missed those call sites.
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      const src = readFileSync(file, 'utf8');
      for (const m of src.matchAll(/\[#(?:cf6317|b05210)\]/gi)) {
        offenders.push(`${file.slice(REPO_ROOT.length + 1)}: ${m[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('uses the rasta red for destructive in BOTH themes', () => {
    // Regression: light mode used an off-brand Google red while dark mode used
    // the rasta red, so one state rendered in two different reds.
    expect(root).toMatch(/--destructive:\s*var\(--color-rasta-red\)/);
    expect(dark).toMatch(/--destructive:\s*var\(--color-rasta-red\)/);
    expect(CSS).not.toMatch(/#ea4335/i);
  });

  it('keeps the gold text token theme-aware for contrast', () => {
    // #FFD700 is ~1.3:1 on the light background, so light mode must substitute
    // a darker amber or `text-gold` fails WCAG AA.
    expect(root).toMatch(/--gold:\s*#B45309/i);
    expect(dark).toMatch(/--gold:\s*#FFD700/i);
  });

  it('maps every theme-aware token through @theme inline', () => {
    for (const name of [
      'background',
      'foreground',
      'card',
      'muted',
      'muted-foreground',
      'border',
      'destructive',
    ]) {
      expect(CSS).toContain(`--color-${name}: var(--${name});`);
    }
  });

  it('exposes a radius scale derived from the base --radius', () => {
    expect(root).toMatch(/--radius:\s*0?\.625rem/);
    expect(CSS).toContain('--radius-lg: var(--radius);');
    for (const step of ['sm', 'md', 'xl', '2xl', '3xl', '4xl']) {
      expect(CSS).toContain(`--radius-${step}: calc(var(--radius)`);
    }
  });
});

describe('mobile-first guardrail', () => {
  it('passes on the repo (viewport contract intact)', async () => {
    const result = await new Promise<{ code: number; stdout: string }>((resolve) => {
      execFile(
        'node',
        [join(REPO_ROOT, 'scripts', 'check-mobile-first.mjs')],
        { cwd: REPO_ROOT },
        (err, stdout) => {
          const code =
            err && typeof (err as { code?: number }).code === 'number'
              ? (err as { code: number }).code
              : 0;
          resolve({ code, stdout: String(stdout) });
        }
      );
    });

    expect(result.code).toBe(0);
    expect(result.stdout).toMatch(/viewport contract: OK/);
  });

  it('reports no page background that bypasses bg-background', async () => {
    const result = await new Promise<string>((resolve) => {
      execFile(
        'node',
        [join(REPO_ROOT, 'scripts', 'check-mobile-first.mjs')],
        { cwd: REPO_ROOT },
        (_err, stdout) => resolve(String(stdout))
      );
    });

    // Regression: Changa screens used `min-h-screen bg-amber-50
    // dark:bg-stone-950`, so they ignored the theme switch.
    expect(result).not.toMatch(/page background "min-h-/);
  });
});
