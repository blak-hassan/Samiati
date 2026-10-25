/**
 * Server-side gate for the QA mock AI mechanism.
 *
 * The mock AI must be IMPOSSIBLE to enable in production via query string,
 * header, cookie, or client code. This guard is consulted only on the
 * server (Next.js route handler / Convex shim / test harness), never
 * exposed to the browser.
 *
 * Conditions (ALL required):
 *   1. NODE_ENV !== "production"
 *   2. QA_MOCK_AI === "1"  (explicit opt-in env flag)
 *
 * Returns { enabled: boolean, reason: string }.
 */
export function mockAiEnabled(): { enabled: boolean; reason: string } {
  const nodeEnv = process.env.NODE_ENV;
  const qaMockAi = process.env.QA_MOCK_AI;

  if (nodeEnv === "production") {
    return { enabled: false, reason: "NODE_ENV is production" };
  }
  if (qaMockAi !== "1") {
    return {
      enabled: false,
      reason: `QA_MOCK_AI is "${qaMockAi ?? undefined}", expected "1"`,
    };
  }
  return { enabled: true, reason: "mock AI enabled (dev/test only)" };
}

/**
 * Asserts the mock is disabled in a production build. Intended for tests.
 * Throws if the mock would be enabled under NODE_ENV=production.
 */
export function assertMockDisabledInProduction() {
  const orig = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    const result = mockAiEnabled();
    if (result.enabled) {
      throw new Error(
        `SECURITY: mock AI must be disabled in production but guard returned enabled: ${result.reason}`,
      );
    }
  } finally {
    process.env.NODE_ENV = orig;
  }
}
