import { v } from "convex/values";
import { action } from "./_generated/server";
import { requireAuthenticatedAction, enforceAiQuotaAction } from "./lib/aiSecurity";
import { callSunflower } from "./sunflower";

// =============================================================================
// CHAT SERVICE — Sunflower-Gemma4-E2B via HuggingFace Inference API
// =============================================================================
// Replaces Ollama tunnel. Same model used for all AI services.
// API key: HUGGINGFACE_API_KEY (Set in Convex Dashboard)
// Model: BlakHasan/Sunflower-Gemma4-E2B
// =============================================================================

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

        // Delegate to the shared Sunflower client (single model/HTTP impl).
        try {
            return await callSunflower(messages, 350, 0.7);
        } catch (error) {
            console.error("[Sunflower Chat] Failed:", error);
            return `ERROR: ${error instanceof Error ? error.message : "Failed to get response."}`;
        }
    },
});
