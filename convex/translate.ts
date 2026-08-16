
import { v } from "convex/values";
import { action } from "./_generated/server";
import { requireAuthenticatedAction, enforceAiQuotaAction } from "./lib/aiSecurity";

// =============================================================================
// SUNFLOWER-GEMMA4-E2B TRANSLATION SERVICE (HuggingFace Inference API)
// =============================================================================
// Uses Sunbird/Sunflower-Gemma4-E2B via HuggingFace Inference API
// for multilingual translation across 69 African languages.
//
// API: HuggingFace Inference API (Text Generation Pipeline)
// MODEL: Sunbird/Sunflower-Gemma4-E2B
// KEY: HUGGINGFACE_API_KEY (Set in Convex Dashboard)
// =============================================================================

// Map short codes to human-readable language names for Sunflower prompt format
const LANGUAGE_MAP: Record<string, string> = {
    'sw': 'Swahili',
    'swh_Latn': 'Swahili',
    'ki': 'Kikuyu',
    'kik_Latn': 'Kikuyu',
    'luo': 'Luo',
    'luo_Latn': 'Luo',
    'en': 'English',
    'eng_Latn': 'English',
    'kam': 'Kamba',
    'kam_Latn': 'Kamba',
    'kln': 'Kalenjin',
    'kln_Latn': 'Kalenjin',
    'luy': 'Luhya',
    'luy_Latn': 'Luhya',
    'mer': 'Meru',
    'mer_Latn': 'Meru',
    'mas': 'Maasai',
    'mas_Latn': 'Maasai',
    'lug': 'Luganda',
    'ach': 'Acholi',
    'afr': 'Afrikaans',
    'hau': 'Hausa',
    'ibo': 'Igbo',
    'yor': 'Yoruba',
    'fra': 'French',
    'som': 'Somali',
    'kin': 'Kinyarwanda',
    'lin': 'Lingala',
    'orm': 'Oromo',
    'sna': 'Shona',
    'tsn': 'Tswana',
    'xho': 'Xhosa',
    'zul': 'Zulu',
    'nya': 'Chichewa',
    'sot': 'Sotho',
    'ewe': 'Ewe',
    'ful': 'Fulani',
    'bam': 'Bambara',
    'amh': 'Amharic',
    'mlg': 'Malagasy',
    'nbl': 'Ndebele',
    'pcm': 'Nigerian Pidgin',
    'run': 'Kirundi',
    'nyo': 'Runyoro',
    'nyn': 'Runyankole',
    'cgg': 'Rukiga',
    'xog': 'Lusoga',
    'ttj': 'Rutooro',
    'ruc': 'Ruruuli',
    'kik': 'Kikuyu',
    'teo': 'Ateso',
    'wol': 'Wolof',
    'bfa': 'Bari',
    'rwm': 'Kwamba',
    'dag': 'Dagbani',
    'keo': 'Kakwa',
    'ber': 'Berber',
    'mhi': "Ma'di",
    'led': 'Lendu',
    'kdj': 'Karamojong',
    'pok': 'Pokot',
    'ikx': 'Ik',
    'kpz': 'Kupsabiny',
    'dga': 'Dagaare',
    'kau': 'Kanuri',
    'din': 'Dinka',
    'kpo': 'Ikposo',
};

async function callSunflower(text: string, targetLang: string): Promise<string> {
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    // Resolve the language name
    const langName = LANGUAGE_MAP[targetLang] || targetLang;

    console.log(`[Sunflower] Translating to ${langName}...`);

    if (!apiKey) {
        console.error("HUGGINGFACE_API_KEY is not set!");
        return "ERROR: HuggingFace API key not configured. Please set HUGGINGFACE_API_KEY in Convex Dashboard.";
    }

    try {
        // Use router.huggingface.co for better reliability on free tier
        const url = "https://router.huggingface.co/Sunbird/Sunflower-Gemma4-E2B";

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "Sunbird/Sunflower-Gemma4-E2B",
                messages: [
                    {
                        role: "system",
                        content: "You are Sunflower, a helpful assistant made by Sunbird AI who knows many African languages."
                    },
                    {
                        role: "user",
                        content: `Translate from English to ${langName}: ${text}`
                    }
                ],
                max_tokens: 512,
                temperature: 0.0,
                do_sample: false,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Sunflower] API Error (${response.status}):`, errorText);
            
            // Handle 403 Forbidden specifically
            if (response.status === 403) {
                return "ERROR: Translation API access forbidden. This may be due to: (1) Invalid API key, (2) Model requires accepting terms at https://huggingface.co/models/Sunbird/Sunflower-Gemma4-E2B, or (3) API quota exceeded.";
            }
            
            // Handle 429 Rate Limit
            if (response.status === 429) {
                return "ERROR: Translation API rate limit exceeded. Please wait a moment and try again.";
            }
            
            // Handle model loading (common with HF free tier)
            if (response.status === 503) {
                return "Translation Model is loading, please try again in a moment.";
            }
            
            return `ERROR: Translation API returned status ${response.status}. Please try again.`;
        }

        const result = await response.json();

        // HuggingFace chat completion returns: { choices: [{ message: { content: "..." } }] }
        if (result?.choices?.[0]?.message?.content) {
            return result.choices[0].message.content.trim();
        }

        console.error("[Sunflower] Unexpected response format:", JSON.stringify(result));
        return "ERROR: Translation service returned an unexpected response format.";

    } catch (error) {
        console.error("[Sunflower] Failed:", error);
        return "ERROR: Translation failed due to a network error. Please check your connection.";
    }
}

const MAX_TRANSLATE_LENGTH = 5000;

export const translateText = action({
    args: {
        text: v.string(),
        targetLanguage: v.string(),
    },
    handler: async (ctx, args) => {
        await requireAuthenticatedAction(ctx);
        await enforceAiQuotaAction(ctx, "translate");

        if (args.text.length > MAX_TRANSLATE_LENGTH) {
            return "ERROR: Text too long. Please keep text under 5,000 characters.";
        }
        if (args.targetLanguage.length > 50) {
            return "ERROR: Invalid language code.";
        }
        return await callSunflower(args.text, args.targetLanguage);
    },
});
