/**
 * Mock AI server — standalone HTTP server for deterministic AI mocking.
 *
 * Runs ONLY on localhost, ONLY when QA_MOCK_AI=1 and NODE_ENV !== production.
 * Never exposed to the public internet. Scenario selection is done via the
 * X-Mock-Scenario request header (set by the test harness, never by end users).
 *
 * Scenarios:
 *   success        — normal canned reply
 *   slow           — success after a configurable delay
 *   timeout        — connection never completes (socket timeout)
 *   network-failure — ECONNREFUSED / socket hang up
 *   malformed      — 200 with invalid JSON body
 *   empty          — 200 with empty body
 *   rate-limit     — 429 Too Many Requests
 *   provider-5xx   — 503 Service Unavailable
 *   invalid-input  — 400 Bad Request for oversized/empty input
 *   retry-then-succeed — fails once (5xx), then succeeds on retry
 *
 * The mock server is started by the QA test harness only. It is not part of
 * the Next.js app and is not imported by any production code path.
 */

import { createServer, type Server } from "node:http";
import { parse } from "node:url";

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

export interface MockServerOptions {
  port?: number;
  host?: string;
  slowDelayMs?: number;
}

const DEFAULT_PORT = 8765;
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_SLOW_DELAY_MS = 2500;

// In-memory retry counter per path for retry-then-succeed.
const retryCounters = new Map<string, number>();

function resetRetryCounter(path: string): void {
  retryCounters.delete(path);
}

function getRetryCounter(path: string): number {
  return retryCounters.get(path) ?? 0;
}

function incRetryCounter(path: string): void {
  retryCounters.set(path, (getRetryCounter(path)) + 1);
}

function cannedReply(scenario: MockScenario): string {
  switch (scenario) {
    case "success":
      return "Ũhoro, ni ũthuthi wa Samiati. Nĩigairaga mũthenya wa gũkena gũkũyũ.";
    case "slow":
      return "Delayed reply after mock slow scenario.";
    case "timeout":
      return "Never sent (timeout).";
    case "network-failure":
      return "Never sent (network failure).";
    case "malformed":
      return "Never sent (malformed).";
    case "empty":
      return "Never sent (empty).";
    case "rate-limit":
      return "Never sent (rate limited).";
    case "provider-5xx":
      return "Never sent (provider 5xx).";
    case "invalid-input":
      return "Never sent (invalid input).";
    case "retry-then-succeed":
      return "Reply after retry-then-succeed scenario.";
    default:
      return "Default mock reply.";
  }
}

function chatResponseBody(reply: string): string {
  return JSON.stringify({
    ok: true,
    value: reply,
    provider: "mock-ai",
    latencyMs: 120,
  });
}

export function createMockServer(
  options: MockServerOptions = {},
): Server {
  const port = options.port ?? DEFAULT_PORT;
  const host = options.host ?? DEFAULT_HOST;
  const slowDelayMs = options.slowDelayMs ?? DEFAULT_SLOW_DELAY_MS;

  const server = createServer((req, res) => {
    const url = parse(req.url ?? "/", true);
    const pathname = url.pathname ?? "/";
    const method = req.method ?? "GET";
    const scenarioHeader = String(
      req.headers["x-mock-scenario"] ?? "success",
    ) as MockScenario;

    // Only allow known scenarios; unknown falls back to success.
    const scenario: MockScenario =
      scenarioHeader in {
        success: 0, slow: 0, timeout: 0, "network-failure": 0, malformed: 0,
        empty: 0, "rate-limit": 0, "provider-5xx": 0, "invalid-input": 0,
        "retry-then-succeed": 0,
      }
        ? scenarioHeader
        : "success";

    // CORS not needed (localhost only), but keep headers minimal.
    res.setHeader("Content-Type", "application/json");
    res.setHeader("X-Mock-Scenario", scenario);

    // ── Route: chat ──
    if (pathname === "/chat" && method === "POST") {
      handleChat(req, res, pathname, scenario, slowDelayMs);
      return;
    }

    // ── Route: search ──
    if (pathname === "/search" && method === "POST") {
      handleChat(req, res, pathname, scenario, slowDelayMs);
      return;
    }

    // ── Route: translate ──
    if (pathname === "/translate" && method === "POST") {
      handleChat(req, res, pathname, scenario, slowDelayMs);
      return;
    }

    // ── Route: reset-retry ── (test helper)
    if (pathname === "/_reset-retry" && method === "POST") {
      const bodyChunks: Buffer[] = [];
      req.on("data", (c) => bodyChunks.push(c));
      req.on("end", () => {
        try {
          const parsed = JSON.parse(Buffer.concat(bodyChunks).toString());
          const path = String(parsed?.path ?? "/chat");
          resetRetryCounter(path);
          res.writeHead(200);
          res.end(JSON.stringify({ ok: true, reset: path }));
        } catch {
          res.writeHead(400);
          res.end(JSON.stringify({ ok: false, error: "invalid body" }));
        }
      });
      return;
    }

    // ── 404 ──
    res.writeHead(404);
    res.end(JSON.stringify({ ok: false, error: "not found" }));
  });

  async function handleChat(
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
    pathname: string,
    scenario: MockScenario,
    slowDelayMs: number,
  ): Promise<void> {
    // Read the request body.
    const bodyChunks: Buffer[] = [];
    for await (const chunk of req) {
      bodyChunks.push(chunk);
    }
    let bodyText = "";
    try {
      bodyText = Buffer.concat(bodyChunks).toString();
    } catch {
      bodyText = "";
    }

    // Clean up if the client aborts the connection (e.g. timeout test).
    // Prevents the server from holding open sockets that interfere with
    // subsequent requests on the same server instance. `once` removes the
    // listener after it fires, avoiding EventEmitter memory-leak warnings.
    req.socket?.once("close", () => {
      if (!res.writableEnded) {
        res.destroy();
      }
    });

    // ── invalid-input scenario ──
    if (scenario === "invalid-input") {
      let tooLongOrEmpty = false;
      try {
        const parsed = JSON.parse(bodyText || "{}");
        const content =
          typeof parsed?.content === "string"
            ? parsed.content
            : typeof parsed?.userMessage === "string"
              ? parsed.userMessage
              : "";
        if (!content || content.length > 10000) {
          tooLongOrEmpty = true;
        }
      } catch {
        tooLongOrEmpty = true;
      }
      if (tooLongOrEmpty) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            ok: false,
            provider: "mock-ai",
            error: { code: "bad_response", message: "Invalid input." },
          }),
        );
        return;
      }
    }

    // ── network-failure scenario ──
    if (scenario === "network-failure") {
      res.destroy();
      return;
    }

    // ── timeout scenario ── (never respond; let the client time out)
    if (scenario === "timeout") {
      return;
    }

    // ── retry-then-succeed scenario ──
    if (scenario === "retry-then-succeed") {
      const path = pathname;
      incRetryCounter(path);
      if (getRetryCounter(path) === 1) {
        // First call fails with 5xx.
        res.writeHead(503, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            ok: false,
            provider: "mock-ai",
            error: { code: "server_error", message: "Mock transient failure." },
          }),
        );
        return;
      }
      // Second call succeeds.
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(chatResponseBody(cannedReply(scenario)));
      return;
    }

    // ── slow scenario ──
    if (scenario === "slow") {
      setTimeout(() => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(chatResponseBody(cannedReply(scenario)));
      }, slowDelayMs);
      return;
    }

    // ── rate-limit scenario ──
    if (scenario === "rate-limit") {
      res.writeHead(429, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          ok: false,
          provider: "mock-ai",
          error: { code: "rate_limited", message: "Mock rate limit." },
        }),
      );
      return;
    }

    // ── provider-5xx scenario ──
    if (scenario === "provider-5xx") {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          ok: false,
          provider: "mock-ai",
          error: { code: "server_error", message: "Mock provider error." },
        }),
      );
      return;
    }

    // ── malformed scenario ── (200 with invalid JSON)
    if (scenario === "malformed") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end("{ not valid json }");
      return;
    }

    // ── empty scenario ── (200 with empty body)
    if (scenario === "empty") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end("");
      return;
    }

    // ── success scenario ── (default)
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(chatResponseBody(cannedReply(scenario)));
  }

  return server;
}

/**
 * Start the mock server and return it. Returns { server, port, url }.
 */
export async function startMockServer(
  options: MockServerOptions = {},
): Promise<{ server: Server; port: number; url: string }> {
  const port = options.port ?? DEFAULT_PORT;
  const server = createMockServer(options);
  await new Promise<void>((resolve, reject) => {
    server.listen(port, options.host ?? DEFAULT_HOST, (err?: Error) => {
      if (err) return reject(err);
      resolve();
    });
  });
  const actualPort = (server.address() as { port: number }).port;
  return {
    server,
    port: actualPort,
    url: `http://${options.host ?? DEFAULT_HOST}:${actualPort}`,
  };
}

/**
 * Stop the mock server.
 */
export function stopMockServer(server: Server): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}
