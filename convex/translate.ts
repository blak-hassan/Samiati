
import { v } from "convex/values";
import { action } from "./_generated/server";

// =============================================================================
// NLLB-200 TRANSLATION SERVICE (HuggingFace Inference API)
// =============================================================================
// Uses facebook/nllb-200-distilled-600M via HuggingFace Inference API
// for proper multilingual translation with NLLB language codes.
//
// API: HuggingFace Inference API (Translation Pipeline)
// MODEL: facebook/nllb-200-distilled-600M
// KEY: HUGGINGFACE_API_KEY (Set in Convex Dashboard)
// =============================================================================

// Map short codes (used by frontend) to NLLB-200 BCP-47 codes
const LANGUAGE_TO_NLLB: Record<string, string> = {
    // NLLB codes (already correct)
    'swh_Latn': 'swh_Latn',
    'kik_Latn': 'kik_Latn',
    'luo_Latn': 'luo_Latn',
    'eng_Latn': 'eng_Latn',
    'kam_Latn': 'kam_Latn',
    'kln_Latn': 'kln_Latn',
    'luy_Latn': 'luy_Latn',
    'mer_Latn': 'mer_Latn',
    'mas_Latn': 'mas_Latn',
    // Short codes → NLLB codes
    'sw': 'swh_Latn',
    'ki': 'kik_Latn',
    'luo': 'luo_Latn',
    'en': 'eng_Latn',
    'kam': 'kam_Latn',
    'kln': 'kln_Latn',
    'luy': 'luy_Latn',
    'mer': 'mer_Latn',
    'mas': 'mas_Latn',
};

// Human-readable names for logging
const LANGUAGE_NAMES: Record<string, string> = {
    'swh_Latn': 'Swahili',
    'kik_Latn': 'Kikuyu',
    'luo_Latn': 'Luo',
    'eng_Latn': 'English',
    'kam_Latn': 'Kamba',
    'kln_Latn': 'Kalenjin',
    'luy_Latn': 'Luhya',
    'mer_Latn': 'Meru',
    'mas_Latn': 'Maasai',
};

async function callNLLB(text: string, targetLang: string): Promise<string> {
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    // Resolve the NLLB language code
    const nllbCode = LANGUAGE_TO_NLLB[targetLang] || targetLang;
    const langName = LANGUAGE_NAMES[nllbCode] || nllbCode;

    console.log(`[NLLB-200] Translating to ${langName} (${nllbCode})...`);

    if (!apiKey) {
        console.error("HUGGINGFACE_API_KEY is not set!");
        return "ERROR: HuggingFace API key not configured. Please set HUGGINGFACE_API_KEY in Convex Dashboard.";
    }

    try {
        // Use router.huggingface.co for better reliability on free tier
        const url = "https://router.huggingface.co/facebook/nllb-200-distilled-600M";

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                inputs: text,
                parameters: {
                    src_lang: "eng_Latn",
                    tgt_lang: nllbCode,
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[NLLB-200] API Error (${response.status}):`, errorText);
            
            // Handle 403 Forbidden specifically
            if (response.status === 403) {
                return "ERROR: Translation API access forbidden. This may be due to: (1) Invalid API key, (2) Model requires accepting terms at https://huggingface.co/models/facebook/nllb-200-distilled-600M, or (3) API quota exceeded.";
            }
            
            // Handle 429 Rate Limit
            if (response.status === 429) {
                return "ERROR: Translation API rate limit exceeded. Please wait a moment and try again.";
            }
            
            return `ERROR: Translation API returned status ${response.status}. Please try again.`;
        }

        const result = await response.json();

        // HuggingFace translation pipeline returns: [{ translation_text: "..." }]
        if (Array.isArray(result) && result[0]?.translation_text) {
            return result[0].translation_text.trim();
        }

        // Fallback: some models return { generated_text: "..." }
        if (result?.generated_text) {
            return result.generated_text.trim();
        }

        console.error("[NLLB-200] Unexpected response format:", JSON.stringify(result));
        return "ERROR: Translation service returned an unexpected response format.";

    } catch (error) {
        console.error("[NLLB-200] Failed:", error);
        return "ERROR: Translation failed due to a network error. Please check your connection.";
    }
}

export const translateText = action({
    args: {
        text: v.string(),
        targetLanguage: v.string(),
    },
    handler: async (ctx, args) => {
        return await callNLLB(args.text, args.targetLanguage);
    },
});
