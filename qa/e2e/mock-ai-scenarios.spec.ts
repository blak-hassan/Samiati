import { test, expect } from "./fixtures";
import {
  startMockServer,
  stopMockServer,
  type MockScenario,
} from "../mock-ai/server";

test.describe.configure({ mode: "serial" });

let serverUrl: string;
let mockServer: Awaited<ReturnType<typeof startMockServer>>["server"];

test.describe("Mock AI scenarios (standalone HTTP server)", () => {
  test.beforeAll(async () => {
    mockServer = (await startMockServer({ port: 0 })).server;
    serverUrl = `http://127.0.0.1:${(mockServer.address() as { port: number }).port}`;
  });

  test.afterAll(async () => {
    await stopMockServer(mockServer);
  });

  async function fetchMock(
    path: string,
    scenario: MockScenario,
    body?: unknown,
    init?: RequestInit,
  ): Promise<Response> {
    return globalThis.fetch(`${serverUrl}${path}`, {
      method: "POST",
      headers: {
        "X-Mock-Scenario": scenario,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      ...init,
    });
  }

  test("success scenario returns canned reply", async () => {
    const res = await fetchMock("/chat", "success", {
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(typeof body.value).toBe("string");
    expect(body.value.length).toBeGreaterThan(0);
  });

  test("slow scenario responds after delay", async () => {
    const start = Date.now();
    const res = await fetchMock("/chat", "slow", {
      messages: [{ role: "user", content: "Hello" }],
    });
    const elapsed = Date.now() - start;
    expect(res.status).toBe(200);
    expect(elapsed).toBeGreaterThanOrEqual(1500); // ~2s delay
  });

  test("timeout scenario never responds (client times out)", async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    await expect(
      fetchMock("/chat", "timeout", {
        messages: [{ role: "user", content: "Hello" }],
      }, { signal: controller.signal }),
    ).rejects.toThrow();
    clearTimeout(timeoutId);
  });

  test("network-failure scenario destroys the socket", async () => {
    await expect(
      fetchMock("/chat", "network-failure", {
        messages: [{ role: "user", content: "Hello" }],
      }),
    ).rejects.toThrow();
  });

  test("malformed scenario returns 200 with invalid JSON", async () => {
    const res = await globalThis.fetch(`${serverUrl}/chat`, {
      method: "POST",
      headers: {
        "X-Mock-Scenario": "malformed",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: [{ role: "user", content: "Hello" }] }),
    });
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(() => JSON.parse(text)).toThrow();
  });

  test("empty scenario returns 200 with empty body", async () => {
    const res = await globalThis.fetch(`${serverUrl}/chat`, {
      method: "POST",
      headers: {
        "X-Mock-Scenario": "empty",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: [{ role: "user", content: "Hello" }] }),
    });
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe("");
  });

  test("rate-limit scenario returns 429", async () => {
    const res = await fetchMock("/chat", "rate-limit", {
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("rate_limited");
  });

  test("provider-5xx scenario returns 503", async () => {
    const res = await fetchMock("/chat", "provider-5xx", {
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("server_error");
  });

  test("invalid-input scenario returns 400 for empty message", async () => {
    const res = await fetchMock("/chat", "invalid-input", {
      messages: [{ role: "user", content: "" }],
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("bad_response");
  });

  test("retry-then-succeed: first call fails 5xx, second succeeds", async () => {
    // Server starts fresh (counter=0): first call fails 5xx.
    const first = await fetchMock("/chat", "retry-then-succeed", {
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(first.status).toBe(503);

    // Second call succeeds (counter now 2).
    const second = await fetchMock("/chat", "retry-then-succeed", {
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(second.status).toBe(200);
    const body = await second.json();
    expect(body.ok).toBe(true);
  });

  test("unknown scenario header falls back to success", async () => {
    const res = await globalThis.fetch(`${serverUrl}/chat`, {
      method: "POST",
      headers: {
        "X-Mock-Scenario": "not-a-real-scenario",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: [{ role: "user", content: "Hello" }] }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test("search endpoint mirrors chat scenarios", async () => {
    const res = await globalThis.fetch(`${serverUrl}/search`, {
      method: "POST",
      headers: {
        "X-Mock-Scenario": "success",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: "greetings", language: "English" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test("translate endpoint mirrors chat scenarios", async () => {
    const res = await globalThis.fetch(`${serverUrl}/translate`, {
      method: "POST",
      headers: {
        "X-Mock-Scenario": "success",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: "Hello", sourceLang: "en", targetLang: "ki" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
