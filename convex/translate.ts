
import { v } from "convex/values";
import { action } from "./_generated/server";


// =============================================================================
// LLAMA 3 TRANSLATION SERVICE (Hugging Face)
// =============================================================================
// Replaces Gemini (Rate Limited) and NLLB (Deprecated Endpoint).
// Uses Meta-Llama-3-8B-Instruct via Hugging Face Serverless Inference.
//
// API: Hugging Face Router (OpenAI-compatible)
// KEY: HUGGINGFACE_API_KEY (Set in Convex Dashboard)
// =============================================================================

// =============================================================================
// TRANSLATION SERVICE: Hugging Face (NLLB/Llama3)
// =============================================================================
// Uses Meta-Llama-3-8B-Instruct via Hugging Face Serverless Inference to
// simulate NLLB translation behavior.
//
// API: Hugging Face Router (OpenAI-compatible)
// KEY: HUGGINGFACE_API_KEY (Set in Convex Dashboard)
// =============================================================================

// Map NLLB codes (used by frontend) to readable names for Llama 3 fallback
const LANGUAGE_MAP: Record<string, string> = {
    'swh_Latn': 'Swahili',
    'kik_Latn': 'Kikuyu',
    'luo_Latn': 'Luo',
    'eng_Latn': 'English',
    'kam_Latn': 'Kamba',
    'kln_Latn': 'Kalenjin',
    'luy_Latn': 'Luhya',
    'mer_Latn': 'Meru',
    'mas_Latn': 'Maasai',
    // Short codes
    'sw': 'Swahili',
    'ki': 'Kikuyu',
    'luo': 'Luo',
    'en': 'English',
    'kam': 'Kamba',
    'kln': 'Kalenjin',
    'luy': 'Luhya',
    'mer': 'Meru',
    'mas': 'Maasai',
};



async function callNLLB(text: string, targetLang: string): Promise<string> {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    const targetLangName = LANGUAGE_MAP[targetLang] || targetLang;

    console.log(`[NLLB/Llama3 Fallback] Translating to ${targetLangName}...`);

    if (!apiKey) {
        console.error("HUGGINGFACE_API_KEY is not set!");
        return "N/A"; // API unavailable
    }

    try {
        const url = "https://router.huggingface.co/v1/chat/completions";

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "meta-llama/Meta-Llama-3-8B-Instruct",
                messages: [
                    {
                        role: "system",
                        content: `You are a strict translation engine. Translate the user's input into ${targetLangName}.
Rules:
1. Output ONLY the translated text.
2. NO explanations, notes, or "Here is the translation".
3. NO quotes around the output.
4. If the text is simple, keep it simple.
`
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                max_tokens: 500,
                temperature: 0.1,
            }),
        });

        if (!response.ok) {
            console.error(`[Fallback] API Error (${response.status}):`, await response.text());
            return "N/A";
        }

        const result = await response.json();
        const translatedText = result.choices?.[0]?.message?.content;

        if (translatedText) {
            return translatedText.replace(/^["']|["']$/g, '').trim();
        } else {
            return "N/A";
        }

    } catch (error) {
        console.error("[Fallback] Failed:", error);
        return "N/A";
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
