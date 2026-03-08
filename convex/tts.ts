
import { v } from "convex/values";
import { action } from "./_generated/server";

// =============================================================================
// COQUI / MMS TTS SERVICE (HuggingFace Inference API)
// =============================================================================
// Uses facebook/mms-tts models for text-to-speech synthesis.
// Supports multiple languages via language-specific model variants.
//
// API: HuggingFace Inference API (Text-to-Speech Pipeline)
// MODELS: facebook/mms-tts-eng (English), facebook/mms-tts-swh (Swahili), etc.
// KEY: HUGGINGFACE_API_KEY (Set in Convex Dashboard)
//
// Note: Coqui XTTS-v2 does not support HuggingFace Inference API directly.
// We use Meta's MMS-TTS models which are available on the free inference tier
// and support many of the same languages relevant to Samiati.
// =============================================================================

// Map language codes to the corresponding MMS-TTS model
const TTS_MODEL_MAP: Record<string, string> = {
    'en': 'facebook/mms-tts-eng',
    'eng_Latn': 'facebook/mms-tts-eng',
    'sw': 'facebook/mms-tts-swh',
    'swh_Latn': 'facebook/mms-tts-swh',
    'ki': 'facebook/mms-tts-kik',
    'kik_Latn': 'facebook/mms-tts-kik',
    'luo': 'facebook/mms-tts-luo',
    'luo_Latn': 'facebook/mms-tts-luo',
    'kam': 'facebook/mms-tts-kam',
    'kam_Latn': 'facebook/mms-tts-kam',
    'mas': 'facebook/mms-tts-mas',
    'mas_Latn': 'facebook/mms-tts-mas',
    'mer': 'facebook/mms-tts-mer',
    'mer_Latn': 'facebook/mms-tts-mer',
};

// Default model if language not found
const DEFAULT_TTS_MODEL = 'facebook/mms-tts-eng';

export const synthesizeSpeech = action({
    args: {
        text: v.string(),
        language: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const apiKey = process.env.HUGGINGFACE_API_KEY;

        if (!apiKey) {
            console.error("HUGGINGFACE_API_KEY is not set!");
            return { audioBase64: null, error: "API key missing" };
        }

        // Select the appropriate TTS model for the language
        const lang = args.language || 'en';
        const modelId = TTS_MODEL_MAP[lang] || DEFAULT_TTS_MODEL;

        console.log(`[TTS] Synthesizing speech with ${modelId} for language: ${lang}`);

        try {
            const url = `https://api-inference.huggingface.co/models/${modelId}`;

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    inputs: args.text,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[TTS] API Error (${response.status}):`, errorText);

                // Handle model loading (common with HF free tier)
                if (response.status === 503) {
                    return { audioBase64: null, error: "Model is loading, please try again in a moment." };
                }

                return { audioBase64: null, error: `API Error: ${response.status}` };
            }

            // Response is raw audio binary (FLAC/WAV)
            const audioBuffer = await response.arrayBuffer();
            const audioBytes = new Uint8Array(audioBuffer);

            // Convert to base64 for transport to frontend
            let binaryString = '';
            for (let i = 0; i < audioBytes.length; i++) {
                binaryString += String.fromCharCode(audioBytes[i]);
            }
            const audioBase64 = btoa(binaryString);

            const contentType = response.headers.get("content-type") || "audio/flac";
            console.log(`[TTS] Generated ${audioBytes.length} bytes of audio (${contentType})`);

            return {
                audioBase64,
                contentType,
                error: null,
            };

        } catch (error) {
            console.error("[TTS] Failed:", error);
            return { audioBase64: null, error: "Speech synthesis failed" };
        }
    },
});
