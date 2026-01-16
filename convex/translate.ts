
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

// Map NLLB codes (used by frontend) to readable names for Llama 3 prompt
const LANGUAGE_MAP: Record<string, string> = {
    'swh_Latn': 'Swahili',
    'kik_Latn': 'Kikuyu',
    'luo_Latn': 'Luo',
    'eng_Latn': 'English',
};

export const translateText = action({
    args: {
        text: v.string(),
        targetLanguage: v.string(), // NLLB code (e.g., swh_Latn)
    },
    handler: async (ctx, args) => {
        const apiKey = process.env.HUGGINGFACE_API_KEY;
        const targetLangName = LANGUAGE_MAP[args.targetLanguage] || args.targetLanguage;

        console.log(`Translation requested: "${args.text.substring(0, 20)}..." -> ${targetLangName}`);

        if (!apiKey) {
            console.error("HUGGINGFACE_API_KEY is not set!");
            return args.text; // Fallback to original
        }

        try {
            // Llama 3 Chat Endpoint (Robust for translation)
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
                            content: args.text
                        }
                    ],
                    max_tokens: 500,
                    temperature: 0.1, // Very low temperature for deterministic output
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HuggingFace API Error (${response.status}):`, errorText);
                return args.text;
            }

            const result = await response.json();
            const translatedText = result.choices?.[0]?.message?.content;

            if (translatedText) {
                // Cleanup: sometimes models wrap in quotes despite instructions
                const cleanedText = translatedText.replace(/^["']|["']$/g, '');
                console.log("Translation success");
                return cleanedText.trim();
            } else {
                console.warn("HuggingFace returned no content");
                return args.text;
            }

        } catch (error) {
            console.error("Translation failed:", error);
            return args.text;
        }
    },
});
