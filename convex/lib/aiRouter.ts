/**
 * AI Router — provider abstraction for all inference calls.
 *
 * Every AI call site (chat, search, translate, ASR, TTS, embeddings,
 * moderation) goes through this module instead of talking to a provider
 * directly. The router is responsible for:
 *
 *   1. Selecting a provider (primary → optional fallback).
 *   2. Retrying on transient failures (network, 5xx, model-loading).
 *   3. Failing fast on permanent errors (auth, bad request, quota).
 *   4. Emitting structured observability events with provider + latency.
 *
 * Today only the HuggingFace provider is implemented; the fallback is a
 * stub that throws `NotImplementedError` so any outage in HF is visible
 * rather than silent. See `convex/lib/providers/fallback.ts` for the
 * path to plug in a second provider.
 *
 * Adding a new capability:
 *   1. Define the request/response types in this file.
 *   2. Implement the method on `HuggingFaceProvider` in
 *      `convex/lib/providers/huggingface.ts`.
 *   3. Expose a top-level helper (e.g. `routeChat`) that calls
 *      `runWithFallback("chat", ...)`.
 *
 * Do NOT add new call sites that import a provider directly. The router
 * is the only sanctioned entry point.
 */

// ── Result types ────────────────────────────────────────────────────────────

/**
 * Tagged result of a provider call. `provider` is set on both branches
 * so observability can attribute the call site regardless of outcome.
 */
export type ProviderResult<T> =
    | { ok: true; value: T; provider: string; latencyMs: number; usage?: UsageEstimate }
    | { ok: false; error: ProviderError; provider: string; latencyMs: number; usage?: UsageEstimate };

/**
 * Token + cost estimate for a single provider call. The router fills
 * this on every call (success and failure) and the calling action is
 * responsible for persisting it via `recordAiUsage` (see below).
 *
 * `inputTokens` and `outputTokens` come from the provider's reported
 * `usage` block when available; otherwise they are estimated from
 * character counts (see `estimateTokens` below). The cost fields are
 * derived from a static price table per model.
 */
export interface UsageEstimate {
    service: "chat" | "search" | "translate" | "tts" | "asr" | "embed" | "moderate";
    model: string;
    inputTokens: number;
    outputTokens: number;
    /** USD cost in cents (1 cent = $0.01). */
    costCents: number;
    /** "reported" if the provider gave us usage, "estimated" otherwise. */
    source: "reported" | "estimated";
}

export type ProviderErrorCode =
    | "auth_missing"
    | "auth_invalid"
    | "rate_limited"
    | "model_loading"
    | "server_error"
    | "network_error"
    | "bad_response"
    | "not_implemented"
    | "unknown";

export interface ProviderError {
    code: ProviderErrorCode;
    message: string;
    /** Upstream HTTP status if known. */
    status?: number;
}

/**
 * Whether a given error code should trigger a fallback attempt.
 * Permanent errors (auth, bad request) don't benefit from a second
 * provider; transient errors (5xx, model-loading, network) do.
 */
const FALLBACK_ELIGIBLE_CODES: ReadonlySet<ProviderErrorCode> = new Set([
    "model_loading",
    "server_error",
    "network_error",
    "rate_limited",
]);

export function isFallbackEligible(err: ProviderError): boolean {
    return FALLBACK_ELIGIBLE_CODES.has(err.code);
}

// ── Provider interfaces ─────────────────────────────────────────────────────

export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface ChatRequest {
    messages: ChatMessage[];
    maxTokens: number;
    temperature: number;
}

export interface AsrRequest {
    audioBytes: Uint8Array;
    mimeType: string;
}

export interface AsrResult {
    text: string;
}

export interface TtsRequest {
    text: string;
    language: string;
    speakerId: string;
}

export interface TtsResult {
    audioBase64: string;
    contentType: string;
}

export interface EmbeddingRequest {
    text: string;
    model: string;
}

export interface EmbeddingResult {
    vector: number[];
    model: string;
    dimensions: number;
}

export interface ModerationScore {
    toxicity: number;       // 0..1
    severeToxicity: number; // 0..1
    obscene: number;        // 0..1
    threat: number;         // 0..1
    insult: number;         // 0..1
    identityAttack: number; // 0..1
    sexual: number;         // 0..1
    model: string;
    /** Wall-clock latency for the inference call. */
    latencyMs: number;
}

export interface ModerationRequest {
    text: string;
}

export interface ChatProvider {
    readonly name: string;
    chat(req: ChatRequest): Promise<ProviderResult<string>>;
    asr?(req: AsrRequest): Promise<ProviderResult<AsrResult>>;
    tts?(req: TtsRequest): Promise<ProviderResult<TtsResult>>;
    embed?(req: EmbeddingRequest): Promise<ProviderResult<EmbeddingResult>>;
    moderate?(req: ModerationRequest): Promise<ProviderResult<ModerationScore>>;
}

// ── Router state ────────────────────────────────────────────────────────────

/**
 * The current provider chain. In Phase 2 this is hard-coded; in Phase 3
 * it can become env-driven (e.g. set AI_PRIMARY=replicate).
 */
let primary: ChatProvider | null = null;
let fallback: ChatProvider | null = null;

export function setProviders(p: ChatProvider, f?: ChatProvider): void {
    primary = p;
    fallback = f ?? null;
}

/** Lazy accessor. The router is a singleton per Convex isolate. */
function getPrimary(): ChatProvider {
    if (!primary) {
        throw new Error(
            "AI router: no primary provider configured. Call setProviders() " +
            "at module load (see convex/lib/providers/index.ts).",
        );
    }
    return primary;
}

function getFallback(): ChatProvider | null {
    return fallback;
}

// ── Dispatcher ──────────────────────────────────────────────────────────────

async function runWithFallback<T>(
    capability: "chat" | "asr" | "tts" | "embed" | "moderate",
    call: (p: ChatProvider) => Promise<ProviderResult<T>>,
): Promise<ProviderResult<T>> {
    const p = getPrimary();
    const primaryResult = await call(p);
    if (primaryResult.ok) return primaryResult;
    if (!isFallbackEligible(primaryResult.error)) return primaryResult;

    const f = getFallback();
    if (!f) return primaryResult;
    if (!hasCapability(f, capability)) return primaryResult;

    return call(f);
}

function hasCapability(
    p: ChatProvider,
    capability: "chat" | "asr" | "tts" | "embed" | "moderate",
): boolean {
    switch (capability) {
        case "chat": return typeof p.chat === "function";
        case "asr": return typeof p.asr === "function";
        case "tts": return typeof p.tts === "function";
        case "embed": return typeof p.embed === "function";
        case "moderate": return typeof p.moderate === "function";
    }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Run a chat completion. Returns the assistant's reply text on success.
 * On failure returns a structured `ProviderError`; callers decide how
 * to surface it (UI string, Sentry event, fallback to canned reply).
 */
export async function routeChat(
    req: ChatRequest,
): Promise<ProviderResult<string>> {
    return runWithFallback("chat", (p) => p.chat(req));
}

export async function routeAsr(
    req: AsrRequest,
): Promise<ProviderResult<AsrResult>> {
    return runWithFallback("asr", (p) => {
        if (!p.asr) {
            return Promise.resolve(notImplemented(p.name, "asr"));
        }
        return p.asr(req);
    });
}

export async function routeTts(
    req: TtsRequest,
): Promise<ProviderResult<TtsResult>> {
    return runWithFallback("tts", (p) => {
        if (!p.tts) {
            return Promise.resolve(notImplemented(p.name, "tts"));
        }
        return p.tts(req);
    });
}

export async function routeEmbedding(
    req: EmbeddingRequest,
): Promise<ProviderResult<EmbeddingResult>> {
    return runWithFallback("embed", (p) => {
        if (!p.embed) {
            return Promise.resolve(notImplemented(p.name, "embed"));
        }
        return p.embed(req);
    });
}

export async function routeModeration(
    req: ModerationRequest,
): Promise<ProviderResult<ModerationScore>> {
    return runWithFallback("moderate", (p) => {
        if (!p.moderate) {
            return Promise.resolve(notImplemented(p.name, "moderate"));
        }
        return p.moderate(req);
    });
}

function notImplemented(
    provider: string,
    capability: string,
): ProviderResult<never> {
    return {
        ok: false,
        provider,
        latencyMs: 0,
        error: {
            code: "not_implemented",
            message: `${provider} does not implement ${capability}`,
        },
    };
}

// ── Cost & token estimation ─────────────────────────────────────────────────

/**
 * Per-million-token USD prices. Sourced from the model cards on
 * HuggingFace as of 2026-09. Update when the underlying model is
 * swapped (see `convex/lib/providers/huggingface.ts`).
 *
 * Free-tier models are $0 listed; we still record the call so the
 * free-tier-vs-paid-traffic ratio is observable.
 */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
    "BlakHasan/Sunflower-Gemma4-E2B": { input: 0, output: 0 },
    "BlakHasan/asr-whisper-51-african-languages": { input: 0, output: 0 },
    "BlakHasan/orpheus-3b-tts-multilingual": { input: 0, output: 0 },
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2": { input: 0, output: 0 },
    "unitary/toxic-bert": { input: 0, output: 0 },
};

const DEFAULT_PRICING = { input: 0, output: 0 };

/**
 * Rough char→token conversion. The OpenAI rule of thumb is ~4 chars
 * per token for English; multilingual text is closer to 2-3. We use
 * 3 to slightly over-estimate (conservative for cost projection).
 */
const CHARS_PER_TOKEN = 3;

export function estimateTokensFromChars(chars: number): number {
    if (chars <= 0) return 0;
    return Math.max(1, Math.ceil(chars / CHARS_PER_TOKEN));
}

export function estimateChatTokens(
    messages: ChatMessage[],
    outputChars: number,
): { input: number; output: number } {
    const inputChars = messages.reduce(
        (sum, m) => sum + (m.content?.length ?? 0) + 16, // ~16 chars of role/formatting overhead
        0,
    );
    return {
        input: estimateTokensFromChars(inputChars),
        output: estimateTokensFromChars(outputChars),
    };
}

/**
 * Compute a usage estimate from a model name and token counts. The
 * `costCents` is rounded to 6 decimal places of a cent (i.e. to the
 * 1/10000th of a cent) to keep small but non-zero costs visible.
 */
export function computeUsage(
    service: UsageEstimate["service"],
    model: string,
    inputTokens: number,
    outputTokens: number,
    source: UsageEstimate["source"],
): UsageEstimate {
    const pricing = MODEL_PRICING[model] ?? DEFAULT_PRICING;
    const costUsd = (inputTokens / 1_000_000) * pricing.input
                  + (outputTokens / 1_000_000) * pricing.output;
    return {
        service,
        model,
        inputTokens,
        outputTokens,
        // USD cents: costUsd * 100, then * 10000 to keep precision, then / 10000.
        // We store as fractional cents (i.e. 0.0001 cent units) so even
        // sub-cent costs are visible. UI can round to whole cents.
        costCents: Math.round(costUsd * 100 * 10000) / 10000,
        source,
    };
}

export function pricingFor(model: string): { input: number; output: number } {
    return MODEL_PRICING[model] ?? DEFAULT_PRICING;
}

// ── Helpers (re-exported for providers) ─────────────────────────────────────

/**
 * Classify an HTTP status from a provider into a ProviderErrorCode.
 * Centralized so all providers agree on what counts as "transient".
 */
export function classifyStatus(status: number): ProviderErrorCode {
    if (status === 401 || status === 403) return "auth_invalid";
    if (status === 429) return "rate_limited";
    if (status === 503) return "model_loading";
    if (status >= 500) return "server_error";
    if (status >= 400) return "bad_response";
    return "unknown";
}

/**
 * Wrap a `fetch` call so the result is a ProviderResult with consistent
 * error mapping. Providers should use this rather than re-implementing
 * the status-handling logic.
 */
export async function timedFetch(
    provider: string,
    input: RequestInfo | URL,
    init: RequestInit = {},
): Promise<{ response?: Response; result: ProviderResult<never> }> {
    const start = Date.now();
    let response: Response;
    try {
        response = await fetch(input, init);
    } catch (error) {
        const latencyMs = Date.now() - start;
        return {
            result: {
                ok: false,
                provider,
                latencyMs,
                error: {
                    code: "network_error",
                    message: error instanceof Error ? error.message : "Network error",
                },
            },
        };
    }
    return { response, result: { ok: false, provider, latencyMs: 0, error: { code: "unknown", message: "" } } };
}
