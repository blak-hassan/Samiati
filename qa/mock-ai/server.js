/**
 * Mock AI server — standalone HTTP server for deterministic AI mocking.
 *
 * Runs ONLY on localhost, ONLY when QA_MOCK_AI=1 and NODE_ENV !== production.
 * Scenario selection via X-Mock-Scenario request header.
 */

const http = require("node:http");
const { parse } = require("node:url");

const DEFAULT_PORT = 8765;
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_SLOW_DELAY_MS = 2500;

const retryCounters = new Map();

function resetRetryCounter(path) {
  retryCounters.delete(path);
}

function getRetryCounter(path) {
  return retryCounters.get(path) ?? 0;
}

function incRetryCounter(path) {
  retryCounters.set(path, (getRetryCounter(path)) + 1);
}

function cannedReply(scenario) {
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

function chatResponseBody(reply) {
  return JSON.stringify({
    ok: true,
    value: reply,
    provider: "mock-ai",
    latencyMs: 120,
  });
}

function createMockServer(options = {}) {
  const port = options.port ?? DEFAULT_PORT;
  const host = options.host ?? DEFAULT_HOST;
  const slowDelayMs = options.slowDelayMs ?? DEFAULT_SLOW_DELAY_MS;

  const server = http.createServer((req, res) => {
    const url = parse(req.url || "/", true);
    const pathname = url.pathname || "/";
    const method = req.method || "GET";
    const scenarioHeader = String(req.headers["x-mock-scenario"] || "success");

    const VALID = {
      success: 0, slow: 0, timeout: 0, "network-failure": 0, malformed: 0,
      empty: 0, "rate-limit": 0, "provider-5xx": 0, "invalid-input": 0,
      "retry-then-succeed": 0,
    };
    const scenario = scenarioHeader in VALID ? scenarioHeader : "success";

    res.setHeader("Content-Type", "application/json");
    res.setHeader("X-Mock-Scenario", scenario);

    if (pathname === "/chat" && method === "POST") {
      handleChat(req, res, pathname, scenario, slowDelayMs);
      return;
    }
    if (pathname === "/search" && method === "POST") {
      handleChat(req, res, pathname, scenario, slowDelayMs);
      return;
    }
    if (pathname === "/translate" && method === "POST") {
      handleChat(req, res, pathname, scenario, slowDelayMs);
      return;
    }
    if (pathname === "/_reset-retry" && method === "POST") {
      const bodyChunks = [];
      req.on("data", (c) => bodyChunks.push(c));
      req.on("end", () => {
        try {
          const parsed = JSON.parse(Buffer.concat(bodyChunks).toString());
          const path = String(parsed.path || "/chat");
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

    res.writeHead(404);
    res.end(JSON.stringify({ ok: false, error: "not found" }));
  });

  async function handleChat(req, res, pathname, scenario, slowDelayMs) {
    const bodyChunks = [];
    for await (const chunk of req) {
      bodyChunks.push(chunk);
    }
    let bodyText = "";
    try {
      bodyText = Buffer.concat(bodyChunks).toString();
    } catch {
      bodyText = "";
    }

    if (scenario === "invalid-input") {
      let tooLongOrEmpty = false;
      try {
        const parsed = JSON.parse(bodyText || "{}");
        const content =
          typeof parsed.content === "string"
            ? parsed.content
            : typeof parsed.userMessage === "string"
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

    if (scenario === "network-failure") {
      res.destroy();
      return;
    }

    if (scenario === "timeout") {
      return;
    }

    if (scenario === "retry-then-succeed") {
      incRetryCounter(pathname);
      if (getRetryCounter(pathname) === 1) {
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
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(chatResponseBody(cannedReply(scenario)));
      return;
    }

    if (scenario === "slow") {
      setTimeout(() => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(chatResponseBody(cannedReply(scenario)));
      }, slowDelayMs);
      return;
    }

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

    if (scenario === "malformed") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end("{ not valid json }");
      return;
    }

    if (scenario === "empty") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end("");
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(chatResponseBody(cannedReply(scenario)));
  }

  return server;
}

async function startMockServer(options = {}) {
  const port = options.port ?? DEFAULT_PORT;
  const server = createMockServer(options);
  await new Promise((resolve, reject) => {
    server.listen(port, options.host ?? DEFAULT_HOST, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
  const actualPort = server.address().port;
  return {
    server,
    port: actualPort,
    url: `http://${options.host ?? DEFAULT_HOST}:${actualPort}`,
  };
}

function stopMockServer(httpServer) {
  return new Promise((resolve) => {
    httpServer.close(() => resolve());
  });
}

module.exports = { createMockServer, startMockServer, stopMockServer };
