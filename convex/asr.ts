
import { v } from "convex/values";
import { action } from "./_generated/server";

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

export const transcribeAudio = action({
    args: {
        // Audio data as base64-encoded string
        audioBase64: v.string(),
    },
    handler: async (ctx, args) => {
        const apiKey = process.env.HUGGINGFACE_API_KEY;

        if (!apiKey) {
            console.error("HUGGINGFACE_API_KEY is not set!");
            return { text: "", error: "ERROR: API key not configured. Please set HUGGINGFACE_API_KEY in Convex Dashboard." };
        }

        console.log("[Paza Whisper] Transcribing audio...");

        try {
            // Decode base64 to binary
            const binaryString = atob(args.audioBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const url = "https://api-inference.huggingface.co/models/microsoft/paza-whisper-large-v3-turbo";

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
    },
});
