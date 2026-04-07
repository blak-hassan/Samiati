
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
            return { audioBase64: null, error: "ERROR: API key not configured. Please set HUGGINGFACE_API_KEY in Convex Dashboard." };
        }

        // Select the appropriate TTS model for the language
        const lang = args.language || 'en';
        const modelId = TTS_MODEL_MAP[lang] || DEFAULT_TTS_MODEL;

        console.log(`[TTS] Synthesizing speech with ${modelId} for language: ${lang}`);

        try {
            // Use router.huggingface.co for better reliability on free tier
            const url = `https://router.huggingface.co/${modelId}`;

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

                // Handle 403 Forbidden specifically
                if (response.status === 403) {
                    return { audioBase64: null, error: "ERROR: TTS API access forbidden. This may be due to: (1) Invalid API key, (2) Model requires accepting terms at https://huggingface.co/models/" + modelId + ", or (3) API quota exceeded." };
                }

                // Handle 429 Rate Limit
                if (response.status === 429) {
                    return { audioBase64: null, error: "ERROR: TTS API rate limit exceeded. Please wait a moment and try again." };
                }

                // Handle model loading (common with HF free tier)
                if (response.status === 503) {
                    return { audioBase64: null, error: "TTS Model is loading, please try again in a moment." };
                }

                return { audioBase64: null, error: `TTS API Error: ${response.status}. Please try again.` };
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
            return { audioBase64: null, error: "Speech synthesis failed due to a network error. Please check your connection." };
        }
    },
});
