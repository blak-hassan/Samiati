import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { requireAuthenticatedAction, enforceAiQuotaAction } from "./lib/aiSecurity";
import { captureException, captureMessage } from "./lib/observability";
import { internal } from "./_generated/api";
import "./lib/providers"; // registers providers with the router

// =============================================================================
// ASR SERVICE — via the AI router
// =============================================================================
// Primary provider: HuggingFace Paza Whisper
// (BlakHasan/asr-whisper-51-african-languages).
// The router adds an abstraction layer; if HF degrades, a configured
// fallback is tried. See convex/lib/aiRouter.ts.
// =============================================================================

const MAX_AUDIO_BASE64_LENGTH = 50_000_000; // ~37MB in base64

interface TranscribeResult {
    text: string;
    error: string | null;
}

function base64ToUint8Array(b64: string): Uint8Array {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}

async function transcribeCore(audioBase64: string): Promise<TranscribeResult & { usage?: import("./lib/aiRouter").UsageEstimate; provider?: string }> {
    if (audioBase64.length > MAX_AUDIO_BASE64_LENGTH) {
        return { text: "", error: "ERROR: Audio file too large. Maximum size is ~37MB." };
    }

    console.log("[ASR] Transcribing audio...");

    // Lazy import keeps the router registration as a side-effect only.
    const { routeAsr } = await import("./lib/aiRouter");
    const result = await routeAsr({
        audioBytes: base64ToUint8Array(audioBase64),
        mimeType: "audio/webm",
    });

    if (result.ok) {
        console.log(`[ASR] Transcription: "${result.value.text}"`);
        return {
            text: result.value.text,
            error: null,
            usage: result.usage,
            provider: result.provider,
        };
    }

    const e = result.error;
    captureMessage("ASR provider call failed", {
        level: "warning",
        tags: { service: "asr", provider: result.provider, code: e.code },
        extra: { status: e.status, message: e.message },
    });

    switch (e.code) {
        case "auth_missing":
            return { text: "", error: "ERROR: API key not configured. Please set HUGGINGFACE_API_KEY in Convex Dashboard." };
        case "auth_invalid":
            return { text: "", error: "ERROR: ASR API access forbidden. This may be due to: (1) Invalid API key, (2) Model requires accepting terms at https://huggingface.co/models/BlakHasan/asr-whisper-51-african-languages, or (3) API quota exceeded." };
        case "rate_limited":
            return { text: "", error: "ERROR: ASR API rate limit exceeded. Please wait a moment and try again." };
        case "model_loading":
            return { text: "", error: "ASR Model is loading, please try again in a moment." };
        case "server_error":
        case "bad_response":
            return { text: "", error: e.status ? `ASR API Error: ${e.status}. Please try again.` : "ASR service returned an unexpected response." };
        case "not_implemented":
            return { text: "", error: "ERROR: ASR is temporarily unavailable. Please try again later." };
        default:
            return { text: "", error: "Transcription failed due to a network error. Please check your connection." };
    }
}

// User-facing transcription: authenticated + quota-gated.
export const transcribeAudio = action({
    args: {
        // Audio data as base64-encoded string
        audioBase64: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await requireAuthenticatedAction(ctx);
        await enforceAiQuotaAction(ctx, "asr");
        try {
            const result = await transcribeCore(args.audioBase64);
            if (result.usage && result.provider) {
                const { usageToRecordArgs } = await import("./lib/aiUsage");
                try {
                    await ctx.runMutation(
                        internal.lib.aiUsage.recordUsage,
                        usageToRecordArgs(result.usage, result.provider, {
                            ok: result.error === null,
                            errorCode: result.error ?? undefined,
                            subject: identity?.subject,
                        }),
                    );
                } catch (e) {
                    console.error("[asr] failed to record usage:", e);
                }
            }
            return { text: result.text, error: result.error };
        } catch (error) {
            console.error("[ASR] Unexpected:", error);
            captureException(error, { tags: { service: "asr" } });
            return { text: "", error: "Transcription failed due to a network error. Please check your connection." };
        }
    },
});

// Worker transcription: reachable only from Convex internals (the Changa
// processing worker), so no client quota applies and no identity exists.
export const transcribeAudioInternal = internalAction({
    args: {
        audioBase64: v.string(),
    },
    handler: async (ctx, args) => {
        const result = await transcribeCore(args.audioBase64);
        // Internal calls also record usage (subject = the worker).
        if (result.usage && result.provider) {
            const { usageToRecordArgs } = await import("./lib/aiUsage");
            try {
                await ctx.runMutation(
                    internal.lib.aiUsage.recordUsage,
                    usageToRecordArgs(result.usage, result.provider, {
                        ok: result.error === null,
                        errorCode: result.error ?? undefined,
                        subject: "changa-worker",
                    }),
                );
            } catch (e) {
                console.error("[asr-internal] failed to record usage:", e);
            }
        }
        return { text: result.text, error: result.error };
    },
});
