/**
 * Tests for the AI router.
 *
 * The router's job is dispatch + fallback selection. The HuggingFace
 * implementation is tested by integration (with a live key); here we
 * focus on the contract:
 *
 *   - Primary success returns the primary's result.
 *   - Primary auth_invalid / bad_response does NOT trigger fallback.
 *   - Primary rate_limited / model_loading / server_error / network_error
 *     DOES trigger fallback (when the fallback implements the capability).
 *   - Fallback not_implemented surfaces as the final result.
 *   - Provider chain is set via setProviders() exactly once.
 *   - The dispatcher never calls a provider that doesn't implement the
 *     requested capability.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    setProviders,
    routeChat,
    routeAsr,
    routeTts,
    routeEmbedding,
    routeModeration,
    classifyStatus,
    isFallbackEligible,
    type ChatProvider,
    type ProviderResult,
} from "../convex/lib/aiRouter";

function ok<T>(provider: string, value: T, latencyMs = 5): ProviderResult<T> {
    return { ok: true, provider, latencyMs, value };
}
function err(
    provider: string,
    code: Parameters<typeof isFallbackEligible>[0]["code"],
    message = "test error",
    status?: number,
): ProviderResult<never> {
    return { ok: false, provider, latencyMs: 1, error: { code, message, status } };
}

beforeEach(() => {
    // Reset module state between tests by setting fresh providers.
    // The router holds module-scoped singletons; replacing them is the
    // supported reset path.
});

describe("classifyStatus", () => {
    it("classifies auth failures distinctly from transient errors", () => {
        expect(classifyStatus(401)).toBe("auth_invalid");
        expect(classifyStatus(403)).toBe("auth_invalid");
        expect(classifyStatus(429)).toBe("rate_limited");
        expect(classifyStatus(503)).toBe("model_loading");
        expect(classifyStatus(500)).toBe("server_error");
        expect(classifyStatus(502)).toBe("server_error");
        expect(classifyStatus(400)).toBe("bad_response");
        expect(classifyStatus(404)).toBe("bad_response");
    });
});

describe("isFallbackEligible", () => {
    it("is true for transient errors", () => {
        expect(isFallbackEligible({ code: "rate_limited", message: "" })).toBe(true);
        expect(isFallbackEligible({ code: "model_loading", message: "" })).toBe(true);
        expect(isFallbackEligible({ code: "server_error", message: "" })).toBe(true);
        expect(isFallbackEligible({ code: "network_error", message: "" })).toBe(true);
    });
    it("is false for permanent errors", () => {
        expect(isFallbackEligible({ code: "auth_invalid", message: "" })).toBe(false);
        expect(isFallbackEligible({ code: "auth_missing", message: "" })).toBe(false);
        expect(isFallbackEligible({ code: "bad_response", message: "" })).toBe(false);
        expect(isFallbackEligible({ code: "not_implemented", message: "" })).toBe(false);
        expect(isFallbackEligible({ code: "unknown", message: "" })).toBe(false);
    });
});

describe("router dispatch", () => {
    it("returns the primary's success result without consulting the fallback", async () => {
        const primary: ChatProvider = {
            name: "primary",
            chat: vi.fn().mockResolvedValue(ok("primary", "hello from primary")),
        };
        const fallback: ChatProvider = {
            name: "fallback",
            chat: vi.fn().mockResolvedValue(ok("fallback", "should not be called")),
        };
        setProviders(primary, fallback);

        const result = await routeChat({
            messages: [{ role: "user", content: "hi" }],
            maxTokens: 100,
            temperature: 0.5,
        });

        expect(result.ok).toBe(true);
        expect(result.provider).toBe("primary");
        if (result.ok) expect(result.value).toBe("hello from primary");
        expect(fallback.chat).not.toHaveBeenCalled();
    });

    it("falls back on transient primary failures", async () => {
        const primary: ChatProvider = {
            name: "primary",
            chat: vi.fn().mockResolvedValue(err("primary", "rate_limited", "429")),
        };
        const fallback: ChatProvider = {
            name: "fallback",
            chat: vi.fn().mockResolvedValue(ok("fallback", "served from fallback")),
        };
        setProviders(primary, fallback);

        const result = await routeChat({
            messages: [{ role: "user", content: "hi" }],
            maxTokens: 100,
            temperature: 0.5,
        });

        expect(result.ok).toBe(true);
        expect(result.provider).toBe("fallback");
        if (result.ok) expect(result.value).toBe("served from fallback");
    });

    it("does NOT fall back on auth_invalid (a secondary provider will fail the same way)", async () => {
        const primary: ChatProvider = {
            name: "primary",
            chat: vi.fn().mockResolvedValue(err("primary", "auth_invalid", "401")),
        };
        const fallback: ChatProvider = {
            name: "fallback",
            chat: vi.fn().mockResolvedValue(ok("fallback", "should not be called")),
        };
        setProviders(primary, fallback);

        const result = await routeChat({
            messages: [{ role: "user", content: "hi" }],
            maxTokens: 100,
            temperature: 0.5,
        });

        expect(result.ok).toBe(false);
        expect(result.provider).toBe("primary");
        expect(fallback.chat).not.toHaveBeenCalled();
    });

    it("does NOT fall back on bad_response (the request was malformed, not transient)", async () => {
        const primary: ChatProvider = {
            name: "primary",
            chat: vi.fn().mockResolvedValue(err("primary", "bad_response", "unexpected shape")),
        };
        const fallback: ChatProvider = {
            name: "fallback",
            chat: vi.fn().mockResolvedValue(ok("fallback", "should not be called")),
        };
        setProviders(primary, fallback);

        const result = await routeChat({
            messages: [{ role: "user", content: "hi" }],
            maxTokens: 100,
            temperature: 0.5,
        });

        expect(result.ok).toBe(false);
        expect(fallback.chat).not.toHaveBeenCalled();
    });

    it("surfaces not_implemented from a fallback that lacks the capability", async () => {
        const primary: ChatProvider = {
            name: "primary",
            chat: vi.fn(),
            // Note: no `asr` method on the primary — should produce not_implemented
            // from the primary directly.
        };
        setProviders(primary);

        const result = await routeAsr({
            audioBytes: new Uint8Array([0, 1, 2]),
            mimeType: "audio/webm",
        });

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("not_implemented");
    });

    it("does not call a fallback that lacks the requested capability", async () => {
        const primary: ChatProvider = {
            name: "primary",
            chat: vi.fn(),
            asr: vi.fn().mockResolvedValue(err("primary", "rate_limited")),
        };
        const fallback: ChatProvider = {
            name: "fallback",
            chat: vi.fn(),
            // No `asr` defined. The router should NOT try to invoke it
            // and should return the primary's error.
        };
        setProviders(primary, fallback);

        const result = await routeAsr({
            audioBytes: new Uint8Array([0, 1, 2]),
            mimeType: "audio/webm",
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.provider).toBe("primary");
            expect(result.error.code).toBe("rate_limited");
        }
    });

    it("covers all five capabilities through the dispatcher", async () => {
        const chat = vi.fn().mockResolvedValue(ok("p", "chat-reply"));
        const asr = vi.fn().mockResolvedValue(ok("p", { text: "asr-text" }));
        const tts = vi.fn().mockResolvedValue(ok("p", { audioBase64: "AAA=", contentType: "audio/wav" }));
        const embed = vi.fn().mockResolvedValue(ok("p", { vector: [0.1, 0.2], model: "m", dimensions: 2 }));
        const moderate = vi.fn().mockResolvedValue(ok("p", {
            toxicity: 0, severeToxicity: 0, obscene: 0, threat: 0,
            insult: 0, identityAttack: 0, sexual: 0, model: "m", latencyMs: 1,
        }));
        const p: ChatProvider = { name: "p", chat, asr, tts, embed, moderate };
        setProviders(p);

        expect((await routeChat({ messages: [{ role: "user", content: "x" }], maxTokens: 1, temperature: 0 })).ok).toBe(true);
        expect((await routeAsr({ audioBytes: new Uint8Array(), mimeType: "audio/wav" })).ok).toBe(true);
        expect((await routeTts({ text: "x", language: "en", speakerId: "s" })).ok).toBe(true);
        expect((await routeEmbedding({ text: "x", model: "m" })).ok).toBe(true);
        expect((await routeModeration({ text: "x" })).ok).toBe(true);
    });
});
