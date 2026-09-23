/**
 * Test the chokepoint CI script by creating a temporary file with a
 * direct write, running the script, and confirming it exits non-zero
 * with the expected violation message.
 *
 * Strategy: spawn the script as a subprocess, then read its output.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execFile } from "node:child_process";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..");
const SCRIPT = join(REPO_ROOT, "scripts", "check-dataset-chokepoints.mjs");
const TEMP_DIR = join(REPO_ROOT, "convex", "__chokepoint_test__");
const TEMP_FILE = join(TEMP_DIR, "violation.ts");

function runScript(): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve) => {
        execFile(
            "node",
            [SCRIPT],
            { cwd: REPO_ROOT },
            (err, stdout, stderr) => {
                resolve({
                    stdout: String(stdout),
                    stderr: String(stderr),
                    code: err && typeof (err as { code?: number }).code === "number"
                        ? (err as { code: number }).code
                        : 0,
                });
            },
        );
    });
}

describe("check-dataset-chokepoints", () => {
    beforeAll(() => {
        if (existsSync(TEMP_DIR)) rmSync(TEMP_DIR, { recursive: true, force: true });
        mkdirSync(TEMP_DIR, { recursive: true });
    });

    afterAll(() => {
        if (existsSync(TEMP_DIR)) rmSync(TEMP_DIR, { recursive: true, force: true });
    });

    it("passes on the actual repo (no violations)", async () => {
        // We rely on the prior tests having left the tree clean.
        // (Each test cleans up its own temp file in afterAll.)
        const result = await runScript();
        expect(result.code).toBe(0);
        expect(result.stdout).toMatch(/OK: no direct writes/);
    });

    it("detects a direct insert outside the chokepoint", async () => {
        writeFileSync(
            TEMP_FILE,
            `// Test fixture for the chokepoint CI script.
export const bad = async (ctx: any) => {
    await ctx.db.insert("changaCuratedExamples", { foo: 1 });
};
`,
        );

        const result = await runScript();
        expect(result.code).toBe(1);
        expect(result.stderr).toMatch(/CHOKEPOINT VIOLATION/);
        expect(result.stderr).toMatch(/changaCuratedExamples/);
    });

    it("detects a direct patch outside the chokepoint", async () => {
        writeFileSync(
            TEMP_FILE,
            `// Test fixture for the chokepoint CI script.
export const bad = async (ctx: any) => {
    await ctx.db.patch("changaReleaseMembers", "fake-id", { foo: 1 });
};
`,
        );

        const result = await runScript();
        expect(result.code).toBe(1);
        expect(result.stderr).toMatch(/CHOKEPOINT VIOLATION/);
        expect(result.stderr).toMatch(/changaReleaseMembers/);
    });

    it("ignores writes to non-protected tables (smoke test)", async () => {
        // `users` is a non-changa* table, so a direct write should be
        // allowed and the script should still pass.
        writeFileSync(
            TEMP_FILE,
            `// Test fixture: a non-protected table should be allowed.
export const fine = async (ctx: any) => {
    await ctx.db.insert("users", { foo: 1 });
};
`,
        );

        const result = await runScript();
        expect(result.code).toBe(0);
    });

    it("ignores writes from the chokepoint itself", async () => {
        // Sanity check: the chokepoint file legitimately contains
        // direct writes, and the script must not flag them.
        writeFileSync(
            TEMP_FILE,
            `// Test fixture: this file is NOT convex/changa/datasetWrites.ts
// so any direct write should be flagged. But to confirm the
// exemption is path-specific, we assert the real chokepoint
// (datasetWrites.ts) is never flagged.
import { readFileSync } from "node:fs";
import { join } from "node:path";
const chokepoint = readFileSync(
    join(${JSON.stringify(REPO_ROOT)}, "convex", "changa", "datasetWrites.ts"),
    "utf8",
);
if (!chokepoint.includes("changaCuratedExamples")) {
    throw new Error("sanity: chokepoint should reference the table it owns");
}
`,
        );

        const result = await runScript();
        expect(result.code).toBe(0);
    });
});
