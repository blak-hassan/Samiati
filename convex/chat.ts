
import { v } from "convex/values";
import { action } from "./_generated/server";

// =============================================================================
// QWEN CHAT SERVICE (HuggingFace Inference API)
// =============================================================================
// API: Hugging Face Serverless Inference API (OpenAI-compatible)
// MODEL: Qwen/Qwen2.5-0.5B-Instruct
// KEY: HUGGINGFACE_API_KEY (Set in Convex Dashboard)
// =============================================================================

export const sendMessage = action({
    args: {
        messages: v.array(
            v.object({
                role: v.string(), // 'user' | 'assistant' | 'system'
                content: v.string(),
            })
        ),
    },
    handler: async (ctx, args) => {
        const apiKey = process.env.HUGGINGFACE_API_KEY;

        if (!apiKey) {
            console.error("HUGGINGFACE_API_KEY is not set!");
            return "ERROR: HuggingFace API key not configured. Please set HUGGINGFACE_API_KEY in Convex Dashboard.";
        }

        // System Prompt for Samiati
        const systemMessage = {
            role: "system",
            content: "You are Samiati, a friendly chat assistant. Your goal is to chat naturally with the user. Reply in English. Keep responses short, casual, and friendly. Never explain or define words unless the user explicitly asks."
        };

        // Prepare messages (prepend system message)
        const apiMessages = [systemMessage, ...args.messages];

        try {
            const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
                    messages: apiMessages,
                    max_tokens: 300,
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HuggingFace API Error (${response.status}):`, errorText);
                return `ERROR: HuggingFace API returned status ${response.status}. Check your API key and try again.`;
            }

            const result = await response.json();
            const aiResponse = result.choices?.[0]?.message?.content;

            return aiResponse || "N/A";

        } catch (error) {
            console.error("Chat Action execution failed:", error);
            return "ERROR: Network error while calling HuggingFace API. Please check your connection.";
        }
    },
});
