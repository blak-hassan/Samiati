import { v } from "convex/values";
import { action } from "./_generated/server";

export const translateText = action({
    args: {
        text: v.string(),
        targetLanguage: v.string(), // NLLB language code (e.g., swh_Latn)
    },
    handler: async (ctx, args) => {
        const apiToken = process.env.HUGGINGFACE_API_KEY;
        console.log("Translation called with target:", args.targetLanguage);
        console.log("API Key present?", !!apiToken);

        if (!apiToken) {
            console.error("HUGGINGFACE_API_KEY is not set in environment variables!");
            return args.text;
        }

        try {
            const response = await fetch(
                "https://router.huggingface.co/models/facebook/nllb-200-distilled-600M",
                {
                    headers: {
                        Authorization: `Bearer ${apiToken}`,
                        "Content-Type": "application/json",
                    },
                    method: "POST",
                    body: JSON.stringify({
                        inputs: args.text,
                        parameters: {
                            src_lang: "eng_Latn",
                            tgt_lang: args.targetLanguage,
                        },
                    }),
                }
            );

            const result = await response.json();

            console.log("Translation API Response:", JSON.stringify(result).substring(0, 200));

            if (result.error) {
                console.error("Hugging Face API error:", result.error);
                if (result.error.includes("currently loading")) {
                    return "⏳ Model is loading... Please try again in 30 seconds.";
                }
                return args.text;
            }

            // NLLB returns array with translation_text field
            if (Array.isArray(result) && result[0]?.translation_text) {
                return result[0].translation_text;
            }

            // Fallback: check for generated_text
            if (Array.isArray(result) && result[0]?.generated_text) {
                return result[0].generated_text;
            }

            return args.text;
        } catch (error) {
            console.error("Translation error:", error);
            return args.text;
        }
    },
});
