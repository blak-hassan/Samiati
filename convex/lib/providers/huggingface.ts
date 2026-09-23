/**
 * HuggingFace provider implementation.
 *
 * Wraps every HF Inference API call site used in the codebase behind the
 * `ChatProvider` interface. The router chooses this as the primary
 * provider today.
 *
 * Models:
 *   - Chat / Search / Translate: BlakHasan/Sunflower-Gemma4-E2B
 *   - ASR: BlakHasan/asr-whisper-51-african-languages
 *   - TTS: BlakHasan/orpheus-3b-tts-multilingual
 *   - Embeddings: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
 *   - Moderation: unitary/toxic-bert
 *
 * The `HUGGINGFACE_API_KEY` is read from the Convex env at call time
 * (not at module load) so a misconfigured deploy fails per-call with a
 * structured error rather than crashing the isolate.
 */
import {
    type ChatProvider,
    type ChatRequest,
    type AsrRequest,
    type AsrResult,
    type TtsRequest,
    type TtsResult,
    type EmbeddingRequest,
    type EmbeddingResult,
    type ModerationRequest,
    type ModerationScore,
    type ProviderResult,
    type UsageEstimate,
    classifyStatus,
    estimateChatTokens,
    computeUsage,
    estimateTokensFromChars,
} from "../aiRouter";

const HF_BASE = "https://router.huggingface.co";
const SUNFLOWER_MODEL = "BlakHasan/Sunflower-Gemma4-E2B";
const ASR_MODEL = "BlakHasan/asr-whisper-51-african-languages";
const TTS_MODEL = "BlakHasan/orpheus-3b-tts-multilingual";
const EMBED_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2";
const MODERATION_MODEL = "unitary/toxic-bert";

function getApiKey(): string | null {
    return process.env.HUGGINGFACE_API_KEY ?? null;
}

function err(
    provider: string,
    code: ReturnType<typeof classifyStatus> | "auth_missing" | "bad_response" | "unknown",
    message: string,
    status?: number,
    latencyMs = 0,
): ProviderResult<never> {
    return {
        ok: false,
        provider,
        latencyMs,
        error: { code, message, status },
    };
}

async function hfFetch(
    path: string,
    init: { method?: string; body?: BodyInit; headers?: Record<string, string> },
): Promise<{ ok: true; response: Response; latencyMs: number } | { ok: false; result: ProviderResult<never> }> {
    const apiKey = getApiKey();
    if (!apiKey) {
        return {
            ok: false,
            result: err("huggingface", "auth_missing", "HUGGINGFACE_API_KEY is not set", undefined, 0),
        };
    }
    const start = Date.now();
    let response: Response;
    try {
        response = await fetch(`${HF_BASE}${path}`, {
            ...init,
            headers: {
                Authorization: `Bearer ${apiKey}`,
                ...(init.headers ?? {}),
            },
        });
    } catch (error) {
        return {
            ok: false,
            result: err(
                "huggingface",
                "network_error",
                error instanceof Error ? error.message : "Network error",
                undefined,
                Date.now() - start,
            ),
        };
    }
    const latencyMs = Date.now() - start;
    if (!response.ok) {
        const text = await response.text().catch(() => "");
        return {
            ok: false,
            result: err(
                "huggingface",
                classifyStatus(response.status),
                `HF ${response.status}: ${text.slice(0, 200)}`,
                response.status,
                latencyMs,
            ),
        };
    }
    return { ok: true, response, latencyMs };
}

function parseChatContent(payload: unknown): string | null {
    if (!payload || typeof payload !== "object") return null;
    const p = payload as { choices?: Array<{ message?: { content?: string } }> };
    const c = p.choices?.[0]?.message?.content;
    return typeof c === "string" ? c.trim() : null;
}

function parseAsrText(payload: unknown): string | null {
    if (!payload || typeof payload !== "object") return null;
    const p = payload as { text?: unknown };
    return typeof p.text === "string" ? p.text.trim() : null;
}

function parseEmbeddingVector(payload: unknown, expectedDims: number): number[] | null {
    // HF feature-extraction pipeline returns either a single vector
    // (number[][] flattened) or an array of vectors. We request one input
    // and expect a single vector back.
    if (!Array.isArray(payload) || payload.length === 0) return null;
    const first = payload[0];
    if (Array.isArray(first)) {
        if (first.length !== expectedDims) return null;
        return first.map((n) => Number(n));
    }
    if (typeof first === "number") {
        if (payload.length !== expectedDims) return null;
        return payload.map((n) => Number(n));
    }
    return null;
}

function parseModerationScore(payload: unknown): ModerationScore | null {
    if (!Array.isArray(payload) || !Array.isArray(payload[0])) return null;
    const labels = (payload[0] as string[]).map((s) => String(s).toLowerCase());
    const scores = payload[1] as number[];
    if (!Array.isArray(scores) || labels.length !== scores.length) return null;
    const get = (label: string): number => {
        const i = labels.indexOf(label);
        return i >= 0 ? Number(scores[i]) : 0;
    };
    return {
        toxicity: get("toxicity"),
        severeToxicity: get("severe_toxicity"),
        obscene: get("obscene"),
        threat: get("threat"),
        insult: get("insult"),
        identityAttack: get("identity_attack"),
        sexual: get("sexual_explicit"),
        model: MODERATION_MODEL,
        latencyMs: 0,
    };
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
}

function base64ToUint8Array(b64: string): Uint8Array {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}

/**
 * Try to extract a `{ input, output }` token count from the HF
 * response payload. Different endpoints use different shapes:
 *   - chat completions: `{ usage: { prompt_tokens, completion_tokens } }`
 *   - feature-extraction: no usage block
 * Returns null if the shape isn't recognized — caller falls back to
 * char-based estimation.
 */
function parseReportedUsage(payload: unknown): { input: number; output: number } | null {
    if (!payload || typeof payload !== "object") return null;
    const usage = (payload as { usage?: unknown }).usage;
    if (!usage || typeof usage !== "object") return null;
    const u = usage as Record<string, unknown>;
    const input = Number(u.prompt_tokens ?? u.input_tokens);
    const output = Number(u.completion_tokens ?? u.output_tokens);
    if (isNaN(input) || isNaN(output)) return null;
    return { input, output };
}

export const huggingfaceProvider: ChatProvider = {
    name: "huggingface",

    async chat(req: ChatRequest): Promise<ProviderResult<string>> {
        const r = await hfFetch(`/${SUNFLOWER_MODEL}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: SUNFLOWER_MODEL,
                messages: req.messages,
                max_tokens: req.maxTokens,
                temperature: req.temperature,
            }),
        });
        if (!r.ok) return r.result;
        const json = await r.response.json().catch(() => null);
        const content = parseChatContent(json);
        if (content === null) {
            return err("huggingface", "bad_response", "Unexpected chat response shape", undefined, r.latencyMs);
        }
        // HF chat completions don't always return a `usage` block on
        // free tier. Fall back to char-based estimation.
        const reported = parseReportedUsage(json);
        const { input, output } = reported ?? estimateChatTokens(req.messages, content.length);
        const usage = computeUsage("chat", SUNFLOWER_MODEL, input, output, reported ? "reported" : "estimated");
        return { ok: true, provider: "huggingface", latencyMs: r.latencyMs, value: content, usage };
    },

    async asr(req: AsrRequest): Promise<ProviderResult<AsrResult>> {
        const r = await hfFetch(`/${ASR_MODEL}`, {
            method: "POST",
            headers: { "Content-Type": req.mimeType || "audio/webm" },
            // Pass the raw bytes; HF accepts the body directly for ASR.
            body: req.audioBytes as BodyInit,
        });
        if (!r.ok) return r.result;
        const json = await r.response.json().catch(() => null);
        const text = parseAsrText(json);
        if (text === null) {
            return err("huggingface", "bad_response", "Unexpected ASR response shape", undefined, r.latencyMs);
        }
        // ASR: input is audio bytes, output is transcribed text. We
        // approximate the audio-token cost as bytes / 16000 (16kHz
        // mono at 1 byte per sample ≈ 1 token per second) which is
        // the de facto rate for Whisper-class models.
        const inputTokens = Math.max(1, Math.ceil(req.audioBytes.length / 16000));
        const outputTokens = estimateTokensFromChars(text.length);
        const usage = computeUsage("asr", ASR_MODEL, inputTokens, outputTokens, "estimated");
        return { ok: true, provider: "huggingface", latencyMs: r.latencyMs, value: { text }, usage };
    },

    async tts(req: TtsRequest): Promise<ProviderResult<TtsResult>> {
        const r = await hfFetch(`/${TTS_MODEL}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: TTS_MODEL,
                inputs: `${req.speakerId}: ${req.text}`,
                parameters: {
                    max_new_tokens: 1200,
                    temperature: 0.6,
                    top_p: 0.95,
                    repetition_penalty: 1.1,
                },
            }),
        });
        if (!r.ok) return r.result;
        const buf = await r.response.arrayBuffer();
        const audioBase64 = uint8ArrayToBase64(new Uint8Array(buf));
        // TTS: input is text tokens, output is audio frames. HF TTS
        // responses are raw audio bytes; the provider doesn't report
        // a token count. We estimate output as bytes / 32000 (32kHz
        // mono at 2 bytes per sample ≈ 1 token per 0.0625s) which is
        // conservative for Orpheus-class models.
        const outputTokens = Math.max(1, Math.ceil(buf.byteLength / 32000));
        const inputTokens = estimateTokensFromChars(req.text.length);
        const usage = computeUsage("tts", TTS_MODEL, inputTokens, outputTokens, "estimated");
        return {
            ok: true,
            provider: "huggingface",
            latencyMs: r.latencyMs,
            value: {
                audioBase64,
                contentType: r.response.headers.get("content-type") || "audio/wav",
            },
            usage,
        };
    },

    async embed(req: EmbeddingRequest): Promise<ProviderResult<EmbeddingResult>> {
        // We use the feature-extraction pipeline. The model advertises
        // 384 dimensions. If the model is swapped, update the constant
        // and the corresponding vector index in schema.ts.
        const expectedDims = req.model === EMBED_MODEL ? 384 : 0;
        if (expectedDims === 0) {
            return err("huggingface", "bad_response", `Unknown embedding model ${req.model}`, undefined, 0);
        }
        const r = await hfFetch(`/${req.model}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inputs: req.text }),
        });
        if (!r.ok) return r.result;
        const json = await r.response.json().catch(() => null);
        const vector = parseEmbeddingVector(json, expectedDims);
        if (vector === null) {
            return err(
                "huggingface",
                "bad_response",
                `Embedding response did not match expected shape (${expectedDims} dims)`,
                undefined,
                r.latencyMs,
            );
        }
        // Embedding: input is text, output is a fixed-size vector.
        // We count input tokens and treat the vector as a constant
        // (384 floats) for cost purposes.
        const inputTokens = estimateTokensFromChars(req.text.length);
        const usage = computeUsage("embed", req.model, inputTokens, 0, "estimated");
        return {
            ok: true,
            provider: "huggingface",
            latencyMs: r.latencyMs,
            value: { vector, model: req.model, dimensions: expectedDims },
            usage,
        };
    },

    async moderate(req: ModerationRequest): Promise<ProviderResult<ModerationScore>> {
        const r = await hfFetch(`/${MODERATION_MODEL}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inputs: req.text }),
        });
        if (!r.ok) return r.result;
        const json = await r.response.json().catch(() => null);
        const score = parseModerationScore(json);
        if (score === null) {
            return err("huggingface", "bad_response", "Unexpected moderation response shape", undefined, r.latencyMs);
        }
        // Moderation: input is text, output is a fixed 7-class vector.
        const inputTokens = estimateTokensFromChars(req.text.length);
        const usage = computeUsage("moderate", MODERATION_MODEL, inputTokens, 0, "estimated");
        return {
            ok: true,
            provider: "huggingface",
            latencyMs: r.latencyMs,
            value: { ...score, latencyMs: r.latencyMs },
            usage,
        };
    },
};

export const HF_CONSTANTS = {
    SUNFLOWER_MODEL,
    ASR_MODEL,
    TTS_MODEL,
    EMBED_MODEL,
    MODERATION_MODEL,
    EMBEDDING_DIMENSIONS: 384,
    base64ToUint8Array,
    uint8ArrayToBase64,
};
