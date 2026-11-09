import { afterEach, describe, expect, it } from "vitest";

import { ConvexStore } from "@/lib/data/convex-store";

interface RecordedRequest {
  url: string;
  authorization: string | undefined;
  path: string | undefined;
}

const originalFetch = globalThis.fetch;

/** Stands in for the Convex deployment and records what the client sends. */
function recordRequests(): RecordedRequest[] {
  const requests: RecordedRequest[] = [];

  globalThis.fetch = (async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    const headers = (init?.headers ?? {}) as Record<string, string>;
    const body = init?.body ? (JSON.parse(String(init.body)) as { path?: string }) : {};
    requests.push({
      url: String(input),
      authorization: headers["Authorization"],
      path: body.path,
    });
    return new Response(
      JSON.stringify({ status: "success", value: { _id: "user-1" } }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  return requests;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("ConvexStore", () => {
  it("creates the account before it reads anything", async () => {
    const requests = recordRequests();
    const store = new ConvexStore("https://example.convex.cloud");

    await store.listConversations();

    expect(requests[0]?.path).toBe("users/ensureCurrentUser");
    expect(requests[1]?.path).toBe("conversations/list");
  });

  it("sends the member's token with every request", async () => {
    const requests = recordRequests();
    const store = new ConvexStore("https://example.convex.cloud", {
      getAuthToken: async () => "token-1",
    });

    await store.listConversations();

    expect(requests.length).toBeGreaterThanOrEqual(2);
    for (const request of requests) {
      expect(request.authorization).toBe("Bearer token-1");
    }
  });

  it("goes out unauthenticated when nobody is signed in", async () => {
    const requests = recordRequests();
    const store = new ConvexStore("https://example.convex.cloud");

    await store.listConversations();

    for (const request of requests) {
      expect(request.authorization).toBeUndefined();
    }
  });

  it("creates the account again when the member's token changes", async () => {
    const requests = recordRequests();
    let token: string | null = null;
    const store = new ConvexStore("https://example.convex.cloud", {
      getAuthToken: async () => token,
    });

    await store.listConversations();

    token = "token-2";
    await store.listConversations();

    const ensured = requests.filter(
      (request) => request.path === "users/ensureCurrentUser",
    );
    expect(ensured).toHaveLength(2);
    expect(ensured[1]?.authorization).toBe("Bearer token-2");
  });
});