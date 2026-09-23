/**
 * Static-analysis helpers for the journey harness.
 *
 * The harness intentionally avoids spinning up a real Convex test backend
 * (the repo does not declare `convex-test` as a dependency) and instead
 * exercises the source plan's claims by reading the source files as text.
 * This mirrors the existing pattern in `tests/ai-quota.test.ts` and the
 * methodology in §7.1 of `plans/end-to-end-journey-simulation-plan.md`.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const REPO_ROOT = join(__dirname, "..", "..");

export const repoRoot = (): string => REPO_ROOT;

export function readSource(relativePath: string): string {
    const absolute = join(REPO_ROOT, relativePath);
    if (!existsSync(absolute)) {
        throw new Error(`Source file not found: ${relativePath}`);
    }
    return readFileSync(absolute, "utf8");
}

export function exists(relativePath: string): boolean {
    return existsSync(join(REPO_ROOT, relativePath));
}

export function lineNumber(source: string, needle: string): number {
    const idx = source.indexOf(needle);
    if (idx < 0) return -1;
    return source.slice(0, idx).split(/\r?\n/).length;
}

export function linesContaining(source: string, pattern: RegExp): { line: number; text: string }[] {
    return source.split(/\r?\n/).map((text, i) => ({ line: i + 1, text })).filter(({ text }) => pattern.test(text));
}

export function assertContains(source: string, needle: string, label: string) {
    if (!source.includes(needle)) {
        throw new Error(`${label}: expected to find ${JSON.stringify(needle)}`);
    }
}

export function assertContainsRegex(source: string, pattern: RegExp, label: string) {
    if (!pattern.test(source)) {
        throw new Error(`${label}: expected to match ${pattern}`);
    }
}

export function assertMatches(
    actual: unknown,
    predicate: (value: unknown) => boolean,
    label: string,
): asserts actual {
    if (!predicate(actual)) {
        throw new Error(`${label}: assertion failed (got ${JSON.stringify(actual)})`);
    }
}

export { relative as pathRelative };
