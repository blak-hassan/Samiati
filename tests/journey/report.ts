/**
 * Writes the journey report to `tests/journey/artifacts/` as both JSON
 * and Markdown. Mirrors the Reporting Framework in §9 of the source plan.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { GAPS, type GapStatus } from "./gapCatalog";

export interface StepResult {
    id: string;
    description: string;
    status: "pass" | "fail" | "skip";
    evidence?: string;
}

export interface ModuleReport {
    id: string;
    name: string;
    steps: StepResult[];
}

export interface JourneyReport {
    runId: string;
    timestamp: string;
    summary: {
        steps: { passed: number; failed: number; skipped: number };
        gaps: { open: number; historical: number };
    };
    modules: ModuleReport[];
    gaps: { id: string; title: string; status: GapStatus; severity: string; evidence: string }[];
}

const ARTIFACT_DIR = join(__dirname, "artifacts");
const JSON_PATH = join(ARTIFACT_DIR, "journey-report.json");
const MD_PATH = join(ARTIFACT_DIR, "journey-report.md");

export function writeReport(modules: ModuleReport[]): JourneyReport {
    mkdirSync(ARTIFACT_DIR, { recursive: true });

    const gapStatuses = GAPS.map((g) => g.verify());
    const gaps = GAPS.map((g, i) => ({
        id: g.id,
        title: g.title,
        status: gapStatuses[i].status,
        severity: g.severity,
        evidence: gapStatuses[i].evidence,
    }));

    const steps = modules.flatMap((m) => m.steps);
    const report: JourneyReport = {
        runId: cryptoRandomId(),
        timestamp: new Date().toISOString(),
        summary: {
            steps: {
                passed: steps.filter((s) => s.status === "pass").length,
                failed: steps.filter((s) => s.status === "fail").length,
                skipped: steps.filter((s) => s.status === "skip").length,
            },
            gaps: {
                open: gaps.filter((g) => g.status === "open").length,
                historical: gaps.filter((g) => g.status === "historical").length,
            },
        },
        modules,
        gaps,
    };

    writeFileSync(JSON_PATH, JSON.stringify(report, null, 2), "utf8");
    writeFileSync(MD_PATH, renderMarkdown(report), "utf8");
    return report;
}

function renderMarkdown(r: JourneyReport): string {
    const lines: string[] = [];
    lines.push(`# Journey Simulation Report`);
    lines.push(``);
    lines.push(`Run ID: \`${r.runId}\`  `);
    lines.push(`Timestamp: ${r.timestamp}  `);
    lines.push(`Steps: ${r.summary.steps.passed} passed · ${r.summary.steps.failed} failed · ${r.summary.steps.skipped} skipped  `);
    lines.push(`Gaps: ${r.summary.gaps.open} open · ${r.summary.gaps.historical} historical`);
    lines.push(``);
    lines.push(`## Modules`);
    for (const m of r.modules) {
        const passed = m.steps.filter((s) => s.status === "pass").length;
        const failed = m.steps.filter((s) => s.status === "fail").length;
        lines.push(`### ${m.name}`);
        lines.push(`${passed}/${m.steps.length} steps passing (${failed} failing).`);
        for (const s of m.steps) {
            const symbol = s.status === "pass" ? "✓" : s.status === "fail" ? "✗" : "~";
            lines.push(`- ${symbol} \`${s.id}\` — ${s.description}${s.evidence ? ` — ${s.evidence}` : ""}`);
        }
        lines.push(``);
    }
    lines.push(`## Gap Catalog`);
    lines.push(``);
    lines.push(`| ID | Severity | Status | Title | Evidence |`);
    lines.push(`|----|----------|--------|-------|----------|`);
    for (const g of r.gaps) {
        lines.push(`| ${g.id} | ${g.severity} | ${g.status} | ${g.title} | ${g.evidence.replace(/\|/g, "\\|")} |`);
    }
    return lines.join("\n") + "\n";
}

function cryptoRandomId(): string {
    // Node 20+ has crypto.randomUUID; fall back if needed.
    if (typeof globalThis.crypto?.randomUUID === "function") {
        return globalThis.crypto.randomUUID();
    }
    return `run-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export const reportPaths = { JSON_PATH, MD_PATH };
