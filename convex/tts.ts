
import { v } from "convex/values";
import { action } from "./_generated/server";

// =============================================================================
// ORPHEUS-3B TTS SERVICE (HuggingFace Inference API)
// =============================================================================
// Uses Sunbird/orpheus-3b-tts-multilingual for text-to-speech synthesis.
// Supports 20+ African languages with multi-speaker voices.
//
// API: HuggingFace Inference API (Text Generation Pipeline)
// MODEL: Sunbird/orpheus-3b-tts-multilingual
// KEY: HUGGINGFACE_API_KEY (Set in Convex Dashboard)
//
// Note: Orpheus-3B uses a special prompt format with speaker_id tags.
// The model generates SNAC audio codes that need to be decoded.
// For HuggingFace Inference API, we use the text-to-speech pipeline.
// =============================================================================

// Map language codes to Orpheus speaker IDs
const ORPHEUS_SPEAKER_MAP: Record<string, string> = {
    'en': 'salt_eng_0001',
    'eng_Latn': 'salt_eng_0001',
    'sw': 'waxal_swa_0006',
    'swh_Latn': 'waxal_swa_0006',
    'ki': 'waxal_kik_0003',
    'kik_Latn': 'waxal_kik_0003',
    'luo': 'waxal_luo_0001',
    'luo_Latn': 'waxal_luo_0001',
    'kam': 'waxal_kam_0001',
    'kam_Latn': 'waxal_kam_0001',
    'mas': 'waxal_mas_0001',
    'mas_Latn': 'waxal_mas_0001',
    'mer': 'waxal_mer_0001',
    'mer_Latn': 'waxal_mer_0001',
    'lug': 'salt_lug_0001',
    'ach': 'salt_ach_0001',
    'hau': 'waxal_hau_0004',
    'ibo': 'waxal_ibo_0003',
    'yor': 'waxal_yor_0002',
    'kin': 'bateesa_kin_0001',
    'lin': 'slr129_lin_0001',
    'sna': 'waxal_sna_0001',
    'tsn': 'waxal_tsn_0001',
    'xho': 'slr32_xho_0012',
    'zul': 'waxal_zul_0001',
    'nya': 'waxal_nya_0001',
    'sot': 'waxal_sot_0001',
    'ewe': 'slr129_ewe_0001',
    'ful': 'waxal_ful_0003',
    'afr': 'slr32_afr_0009',
    'amh': 'waxal_amh_0001',
    'mlg': 'waxal_mlg_0001',
};

// Default speaker if language not found
const DEFAULT_SPEAKER = 'salt_eng_0001';

const MAX_TTS_LENGTH = 5000;

export const synthesizeSpeech = action({
    args: {
        text: v.string(),
        language: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (args.text.length > MAX_TTS_LENGTH) {
            return { audioBase64: null, error: "ERROR: Text too long. Please keep text under 5,000 characters." };
        }

        const apiKey = process.env.HUGGINGFACE_API_KEY;

        if (!apiKey) {
            console.error("HUGGINGFACE_API_KEY is not set!");
            return { audioBase64: null, error: "ERROR: API key not configured. Please set HUGGINGFACE_API_KEY in Convex Dashboard." };
        }

        // Select the appropriate speaker ID for the language
        const lang = args.language || 'en';
        const speakerId = ORPHEUS_SPEAKER_MAP[lang] || DEFAULT_SPEAKER;

        console.log(`[Orpheus TTS] Synthesizing speech with speaker ${speakerId} for language: ${lang}`);

        const text = args.text.slice(0, MAX_TTS_LENGTH);

        try {
            // Use router.huggingface.co for better reliability on free tier
            // Note: Orpheus-3B requires self-hosting or using a dedicated endpoint
            // This uses the HuggingFace Inference API with the text-generation pipeline
            const url = "https://router.huggingface.co/Sunbird/orpheus-3b-tts-multilingual";

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "Sunbird/orpheus-3b-tts-multilingual",
                    inputs: `${speakerId}: ${text}`,
                    parameters: {
                        max_new_tokens: 1200,
                        temperature: 0.6,
                        top_p: 0.95,
                        repetition_penalty: 1.1,
                    },
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[Orpheus TTS] API Error (${response.status}):`, errorText);

                // Handle 403 Forbidden specifically
                if (response.status === 403) {
                    return { audioBase64: null, error: "ERROR: TTS API access forbidden. This may be due to: (1) Invalid API key, (2) Model requires accepting terms at https://huggingface.co/models/Sunbird/orpheus-3b-tts-multilingual, or (3) API quota exceeded." };
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

            // Response is raw audio binary (WAV)
            const audioBuffer = await response.arrayBuffer();
            const audioBytes = new Uint8Array(audioBuffer);

            // Convert to base64 for transport to frontend
            let binaryString = '';
            for (let i = 0; i < audioBytes.length; i++) {
                binaryString += String.fromCharCode(audioBytes[i]);
            }
            const audioBase64 = btoa(binaryString);

            const contentType = response.headers.get("content-type") || "audio/wav";
            console.log(`[Orpheus TTS] Generated ${audioBytes.length} bytes of audio (${contentType})`);

            return {
                audioBase64,
                contentType,
                error: null,
            };

        } catch (error) {
            console.error("[Orpheus TTS] Failed:", error);
            return { audioBase64: null, error: "Speech synthesis failed due to a network error. Please check your connection." };
        }
    },
});
