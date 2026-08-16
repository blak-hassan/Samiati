import { v } from "convex/values";
import { action } from "./_generated/server";
import { requireAuthenticatedAction, enforceAiQuotaAction } from "./lib/aiSecurity";

// =============================================================================
// CHAT SERVICE — Sunflower-Gemma4-E2B via HuggingFace Inference API
// =============================================================================
// Replaces Ollama tunnel. Same model used for all AI services.
// API key: HUGGINGFACE_API_KEY (Set in Convex Dashboard)
// Model: Sunbird/Sunflower-Gemma4-E2B
// =============================================================================

const SUNFLOWER_URL = "https://router.huggingface.co/Sunbird/Sunflower-Gemma4-E2B";
const MAX_CHAT_MESSAGE_LENGTH = 5000;
const MAX_MESSAGES_HISTORY = 20;

export const sendMessage = action({
    args: {
        messages: v.array(
            v.object({
                role: v.string(),
                content: v.string(),
            })
        ),
        targetLanguage: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireAuthenticatedAction(ctx);
        await enforceAiQuotaAction(ctx, "chat");

        const apiKey = process.env.HUGGINGFACE_API_KEY;
        if (!apiKey) {
            return "ERROR: HUGGINGFACE_API_KEY not configured. Set it in Convex Dashboard.";
        }

        const limitedMessages = args.messages.slice(-MAX_MESSAGES_HISTORY);
        const oversizedMessage = limitedMessages.find((msg) => msg.content.length > MAX_CHAT_MESSAGE_LENGTH);
        if (oversizedMessage) {
            return "ERROR: Message too long. Please keep messages under 5,000 characters.";
        }

        const targetLang = args.targetLanguage || "English";
        const messages = [
            {
                role: "system",
                content: `You are Samiati, a friendly chat assistant. Your goal is to chat naturally with the user. Reply in ${targetLang} language only. Keep responses short, casual, and friendly. Never explain or define words unless the user explicitly asks.`,
            },
            ...limitedMessages.map(msg => ({
                role: msg.role as "user" | "assistant",
                content: msg.content,
            })),
        ];

        try {
            const response = await fetch(SUNFLOWER_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "Sunbird/Sunflower-Gemma4-E2B",
                    messages,
                    max_tokens: 350,
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[Sunflower Chat] API Error (${response.status}):`, errorText);
                if (response.status === 503) return "Model is loading, please try again in a moment.";
                if (response.status === 429) return "Rate limit exceeded. Please wait and try again.";
                return `API error: ${response.status}. Please try again.`;
            }

            const result = await response.json();
            return result.choices?.[0]?.message?.content || "N/A";

        } catch (error) {
            console.error("[Sunflower Chat] Failed:", error);
            return "ERROR: Network error. Please check your connection and try again.";
        }
    },
});
