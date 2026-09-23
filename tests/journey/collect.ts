/**
 * Shared step collector — the module test files build up `RESULTS` in
 * module order, then `journey.test.ts` pulls each one and hands them
 * to the report writer.
 */
import type { StepResult } from "./report";

export type { StepResult };

export function collect(results: StepResult[]): StepResult[] {
    return results.slice();
}
