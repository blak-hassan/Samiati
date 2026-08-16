import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { requireAuthenticatedAction, enforceAiQuotaAction } from "./lib/aiSecurity";

// =============================================================================
// PAZA WHISPER ASR SERVICE (HuggingFace Inference API)
// =============================================================================
// Uses microsoft/paza-whisper-large-v3-turbo for automatic speech recognition.
// This model is fine-tuned for Kenyan languages: Swahili, Kikuyu, Luo,
// Kalenjin, Maasai, and Somali, while maintaining general Whisper robustness.
//
// API: HuggingFace Inference API (Automatic Speech Recognition Pipeline)
// MODEL: microsoft/paza-whisper-large-v3-turbo
// KEY: HUGGINGFACE_API_KEY (Set in Convex Dashboard)
// =============================================================================

const MAX_AUDIO_BASE64_LENGTH = 50_000_000; // ~37MB in base64

interface TranscribeResult {
    text: string;
    error: string | null;
}

async function transcribeCore(audioBase64: string): Promise<TranscribeResult> {
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    if (!apiKey) {
        console.error("HUGGINGFACE_API_KEY is not set!");
        return { text: "", error: "ERROR: API key not configured. Please set HUGGINGFACE_API_KEY in Convex Dashboard." };
    }

    // Validate audio size
    if (audioBase64.length > MAX_AUDIO_BASE64_LENGTH) {
        return { text: "", error: "ERROR: Audio file too large. Maximum size is ~37MB." };
    }

    console.log("[Paza Whisper] Transcribing audio...");

    try {
        // Decode base64 to binary
        const binaryString = atob(audioBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Use router.huggingface.co for better reliability on free tier
        const url = "https://router.huggingface.co/microsoft/paza-whisper-large-v3-turbo";

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                // Send raw audio bytes
                "Content-Type": "audio/webm",
            },
            body: bytes.buffer,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Paza Whisper] API Error (${response.status}):`, errorText);

            // Handle 403 Forbidden specifically
            if (response.status === 403) {
                return { text: "", error: "ERROR: ASR API access forbidden. This may be due to: (1) Invalid API key, (2) Model requires accepting terms at https://huggingface.co/models/microsoft/paza-whisper-large-v3-turbo, or (3) API quota exceeded." };
            }

            // Handle 429 Rate Limit
            if (response.status === 429) {
                return { text: "", error: "ERROR: ASR API rate limit exceeded. Please wait a moment and try again." };
            }

            // Handle model loading (common with HF free tier)
            if (response.status === 503) {
                return { text: "", error: "ASR Model is loading, please try again in a moment." };
            }

            return { text: "", error: `ASR API Error: ${response.status}. Please try again.` };
        }

        const result = await response.json();

        // HuggingFace ASR pipeline returns: { text: "transcribed text" }
        if (result?.text) {
            console.log(`[Paza Whisper] Transcription: "${result.text}"`);
            return { text: result.text.trim(), error: null };
        }

        console.error("[Paza Whisper] Unexpected response:", JSON.stringify(result));
        return { text: "", error: "ASR service returned an unexpected response format." };

    } catch (error) {
        console.error("[Paza Whisper] Failed:", error);
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
        await requireAuthenticatedAction(ctx);
        await enforceAiQuotaAction(ctx, "asr");
        return await transcribeCore(args.audioBase64);
    },
});

// Worker transcription: reachable only from Convex internals (the Changa
// processing worker), so no client quota applies and no identity exists.
export const transcribeAudioInternal = internalAction({
    args: {
        audioBase64: v.string(),
    },
    handler: async (ctx, args) => {
        return await transcribeCore(args.audioBase64);
    },
});