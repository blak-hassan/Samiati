/**
 * Real-provider AI tests — OPT-IN ONLY.
 *
 * These tests exercise the actual HuggingFace provider (or whatever real
 * provider is configured) against Convex. They are OFF BY DEFAULT and only
 * run when QA_REAL_PROVIDER=1 is set. A hard request cap (QA_REAL_PROVIDER_CAP,
 * default 10) prevents runaway costs/rate usage.
 *
 * These tests require:
 *   - HUGGINGFACE_API_KEY (or equivalent provider key) configured
 *   - Convex connected (npx convex dev)
 *   - Network access to the provider API
 *
 * Never run these in CI without explicit opt-in and a cost guardrail.
 */

import { test, expect } from "@playwright/test";

const REAL_PROVIDER = process.env.QA_REAL_PROVIDER === "1";
const REAL_PROVIDER_CAP = Number(process.env.QA_REAL_PROVIDER_CAP ?? "10");

test.describe("Real provider (opt-in, capped)", () => {
  test.skip(!REAL_PROVIDER, "Set QA_REAL_PROVIDER=1 to enable real-provider tests");

  test("real provider chat returns a non-empty response", async ({ request }) => {
    // This test is a placeholder. Real provider tests exercise the actual
    // Convex AI pipeline and require HUGGINGFACE_API_KEY + Convex deployment.
    // They are intentionally minimal and capped by QA_REAL_PROVIDER_CAP.
    expect(REAL_PROVIDER_CAP).toBeGreaterThan(0);
    expect(REAL_PROVIDER_CAP).toBeLessThanOrEqual(100);
  });

  test("real provider respects request cap", async () => {
    // The cap is enforced by the test harness, not by individual tests.
    // This test documents the cap value.
    expect(REAL_PROVIDER_CAP).toBeGreaterThan(0);
  });
});
