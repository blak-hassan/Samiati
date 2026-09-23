/**
 * Fallback provider stub.
 *
 * The router is configured with a fallback path so a single-provider
 * outage (HuggingFace rate limit, regional degradation, model takedown)
 * does not take the entire product dark. The fallback is intentionally
 * a no-op that returns a `not_implemented` error today; the contract
 * is in place so wiring a real secondary provider (Replicate, Together,
 * a dedicated HF Inference Endpoint, an in-house Ollama, ...) is a
 * one-file change.
 *
 * To wire a real fallback:
 *   1. Copy this file to e.g. `replicate.ts` and implement the
 *      `chat`/`asr`/`tts`/etc methods using the new provider's API.
 *   2. In `convex/lib/providers/index.ts`, import your new provider and
 *      pass it as the second argument to `setProviders()`.
 *   3. Add a `REPLICATE_API_KEY` (or equivalent) to the Convex dashboard
 *      and to the README env-var block.
 */
import type {
    ChatProvider,
    ChatRequest,
    AsrRequest,
    AsrResult,
    TtsRequest,
    TtsResult,
    EmbeddingRequest,
    EmbeddingResult,
    ModerationRequest,
    ModerationScore,
    ProviderResult,
} from "../aiRouter";

export const fallbackProvider: ChatProvider = {
    name: "fallback",

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async chat(_req: ChatRequest): Promise<ProviderResult<string>> {
        return {
            ok: false,
            provider: "fallback",
            latencyMs: 0,
            error: {
                code: "not_implemented",
                message:
                    "No fallback provider is configured. To enable HA, implement " +
                    "convex/lib/providers/fallback.ts (or copy it to a new file) " +
                    "and register the provider in convex/lib/providers/index.ts.",
            },
        };
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async asr(_req: AsrRequest): Promise<ProviderResult<AsrResult>> {
        return notImplemented("asr");
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async tts(_req: TtsRequest): Promise<ProviderResult<TtsResult>> {
        return notImplemented("tts");
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async embed(_req: EmbeddingRequest): Promise<ProviderResult<EmbeddingResult>> {
        return notImplemented("embed");
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async moderate(_req: ModerationRequest): Promise<ProviderResult<ModerationScore>> {
        return notImplemented("moderate");
    },
};

function notImplemented(capability: string): ProviderResult<never> {
    return {
        ok: false,
        provider: "fallback",
        latencyMs: 0,
        error: {
            code: "not_implemented",
            message: `Fallback provider does not implement ${capability}. See convex/lib/providers/fallback.ts.`,
        },
    };
}
