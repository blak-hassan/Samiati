/**
 * Mock AI provider for Convex — dev/test only.
 *
 * Implements the `ChatProvider` interface from `convex/lib/aiRouter.ts`.
 * Returns canned responses based on a scenario keyword embedded in the
 * user's message: `__MOCK_SCENARIO:<name>__` at the start of the message.
 *
 * Registered ONLY when `process.env.QA_MOCK_AI === "1"` AND
 * `process.env.NODE_ENV !== "production"` (see `convex/lib/providers/index.ts`).
 * This file is imported only by the dev-only provider registration hook; it
 * is never imported by production code paths.
 */

import type {
  ChatProvider,
  ChatRequest,
  ProviderResult,
} from "../../convex/lib/aiRouter";

export type MockScenario =
  | "success"
  | "slow"
  | "timeout"
  | "network-failure"
  | "malformed"
  | "empty"
  | "rate-limit"
  | "provider-5xx"
  | "invalid-input"
  | "retry-then-succeed";

const SCENARIO_PREFIX = "__MOCK_SCENARIO:";
const SCENARIO_SUFFIX = "__";

const VALID_SCENARIOS: ReadonlySet<string> = new Set([
  "success",
  "slow",
  "timeout",
  "network-failure",
  "malformed",
  "empty",
  "rate-limit",
  "provider-5xx",
  "invalid-input",
  "retry-then-succeed",
]);

function extractScenario(messages: ChatRequest["messages"]): MockScenario {
  const last = messages[messages.length - 1];
  if (!last || typeof last.content !== "string") return "success";
  const content = last.content.trim();
  const prefixIdx = content.indexOf(SCENARIO_PREFIX);
  if (prefixIdx !== 0) return "success";
  const suffixIdx = content.indexOf(SCENARIO_SUFFIX, SCENARIO_PREFIX.length);
  if (suffixIdx === -1) return "success";
  const name = content.slice(SCENARIO_PREFIX.length, suffixIdx);
  if (!VALID_SCENARIOS.has(name)) return "success";
  return name as MockScenario;
}

function stripScenario(content: string): string {
  const prefixIdx = content.indexOf(SCENARIO_PREFIX);
  if (prefixIdx !== 0) return content;
  const suffixIdx = content.indexOf(SCENARIO_SUFFIX, SCENARIO_PREFIX.length);
  if (suffixIdx === -1) return content;
  return content.slice(suffixIdx + SCENARIO_SUFFIX.length).trim();
}

const CANNED_REPLIES: Record<MockScenario, string> = {
  success:
    "Ũhoro, ni ũthuthi wa Samiati. Nĩigairaga mũthenya wa gũkena gũkũyũ.",
  slow: "Delayed reply after mock slow scenario.",
  timeout: "",
  "network-failure": "",
  malformed: "",
  empty: "",
  "rate-limit": "",
  "provider-5xx": "",
  "invalid-input": "",
  "retry-then-succeed": "Reply after retry-then-succeed scenario.",
};

export const mockProvider: ChatProvider = {
  name: "mock-ai",

  async chat(req: ChatRequest): Promise<ProviderResult<string>> {
    const scenario = extractScenario(req.messages);
    const cleanContent = req.messages.map((m) => ({
      ...m,
      content: stripScenario(m.content),
    }));

    // ── scenario handling ──
    switch (scenario) {
      case "timeout":
        // Never resolve — the caller times out.
        return new Promise(() => {
          /* intentionally never resolves */
        });

      case "network-failure":
        return {
          ok: false,
          provider: "mock-ai",
          latencyMs: 0,
          error: {
            code: "network_error",
            message: "Mock network failure.",
          },
        };

      case "rate-limit":
        return {
          ok: false,
          provider: "mock-ai",
          latencyMs: 0,
          error: { code: "rate_limited", message: "Mock rate limit." },
        };

      case "provider-5xx":
        return {
          ok: false,
          provider: "mock-ai",
          latencyMs: 0,
          error: { code: "server_error", message: "Mock provider error." },
        };

      case "malformed":
        return {
          ok: true,
          provider: "mock-ai",
          latencyMs: 0,
          value: "{ not valid json }" as unknown as string,
        };

      case "empty":
        return {
          ok: true,
          provider: "mock-ai",
          latencyMs: 0,
          value: "",
        };

      case "invalid-input":
        const tooLongOrEmpty =
          cleanContent.length === 0 ||
          cleanContent.some((m) => !m.content || m.content.length > 10000);
        if (tooLongOrEmpty) {
          return {
            ok: false,
            provider: "mock-ai",
            latencyMs: 0,
            error: { code: "bad_response", message: "Invalid input." },
          };
        }
        return {
          ok: true,
          provider: "mock-ai",
          latencyMs: 0,
          value: CANNED_REPLIES.success,
        };

      case "retry-then-succeed":
        return new Promise<ProviderResult<string>>((resolve) => {
          // Injected by tests via the mock server's retry counter; here we
          // always succeed on this Convex provider. Tests that need retry
          // behavior should use the standalone mock HTTP server instead.
          resolve({
            ok: true,
            provider: "mock-ai",
            latencyMs: 0,
            value: CANNED_REPLIES["retry-then-succeed"],
          });
        });

      case "slow":
        return new Promise<ProviderResult<string>>((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              provider: "mock-ai",
              latencyMs: 2000,
              value: CANNED_REPLIES.slow,
            });
          }, 2000);
        });

      case "success":
      default:
        return {
          ok: true,
          provider: "mock-ai",
          latencyMs: 120,
          value: CANNED_REPLIES.success,
        };
    }
  },
};

export { extractScenario, stripScenario, CANNED_REPLIES };
