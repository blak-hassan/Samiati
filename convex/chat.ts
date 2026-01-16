
import { v } from "convex/values";
import { action } from "./_generated/server";

// =============================================================================
// HUGGING FACE CHAT SERVICE (Replaces Gemini)
// =============================================================================
// API: Hugging Face Serverless Inference API (OpenAI-compatible)
// MODEL: meta-llama/Meta-Llama-3-8B-Instruct
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
            return "I am Samiati. (System Error: API Key missing)";
        }

        // System Prompt for Samiati
        const systemMessage = {
            role: "system",
            content: "You are Samiati, a friend and conversational partner via text. Your goal is to chat naturally with the user. EXPERIMENTAL RULE: You must NEVER explain, define, or lecture about the language. ALWAYS reply in English. If the user says 'Hello' or 'Habari', you simply reply 'I am good' or 'Hello'. Keep your responses short, casual, and direct. Only explain if the user specifically asks 'What does this mean?'."
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
                    model: "meta-llama/Meta-Llama-3-8B-Instruct",
                    messages: apiMessages,
                    max_tokens: 500, // Reasonable limit for chat
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HuggingFace API Error (${response.status}):`, errorText);
                return "Sorry, I'm having trouble connecting to the spirits of knowledge right now. (Provider Error)";
            }

            const result = await response.json();
            const aiResponse = result.choices?.[0]?.message?.content;

            return aiResponse || "I didn't quite catch that. Could you rephrase?";

        } catch (error) {
            console.error("Chat Action execution failed:", error);
            return "Sorry, I'm having trouble connecting to the spirits of knowledge right now. (Network Error)";
        }
    },
});
