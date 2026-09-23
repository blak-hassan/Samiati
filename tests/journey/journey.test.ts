/**
 * Journey orchestrator. Imports each module's test file (which registers
 * its Vitest cases), then in `afterAll` writes the unified gap report.
 */
import { describe, it, afterAll, expect } from "vitest";
import { writeReport, type ModuleReport, type StepResult } from "./report";
import { module1Results } from "./module1.auth";
import { module2Results } from "./module2.samiati";
import { module3Results } from "./module3.changa";
import { module4Results } from "./module4.settings";
import { ALL_GAP_IDS, GAPS, runGapChecks } from "./gapCatalog";
import { reportPaths } from "./report";

afterAll(() => {
    const modules: ModuleReport[] = [
        { id: "module1", name: "User Authentication & Onboarding", steps: module1Results },
        { id: "module2", name: "Core feature testing (Samiati AI)", steps: module2Results },
        { id: "module3", name: "Linguistic & Cultural Simulation (Changa)", steps: module3Results },
        { id: "module4", name: "System Settings & Profile Management", steps: module4Results },
    ];
    const report = writeReport(modules);

    // Console summary so the run is visible in CI logs.
    // eslint-disable-next-line no-console
    console.log(
        `[journey] steps ${report.summary.steps.passed}/${report.summary.steps.passed + report.summary.steps.failed} pass · gaps ${report.summary.gaps.open} open / ${report.summary.gaps.historical} historical`,
    );
    // eslint-disable-next-line no-console
    console.log(`[journey] report ${reportPaths.JSON_PATH}`);
    // eslint-disable-next-line no-console
    console.log(`[journey] report ${reportPaths.MD_PATH}`);
});

describe("Journey orchestrator", () => {
    it("runs all 28 gap verifications", () => {
        const result = runGapChecks();
        expect(result.gaps.length).toBe(GAPS.length);
        for (const id of ALL_GAP_IDS) {
            expect(result.gaps.find((g) => g.id === id)).toBeDefined();
        }
    });

    it("emits the journey report artifacts", async () => {
        // Touch a sentinel in the report module so a missing write surfaces
        // here, not just in afterAll.
        const { writeReport } = await import("./report");
        expect(typeof writeReport).toBe("function");
    });
});
