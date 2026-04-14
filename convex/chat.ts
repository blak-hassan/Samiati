import { v } from "convex/values";
import { action } from "./_generated/server";

// =============================================================================
// CHAT SERVICE (Tunneled Ollama)
// =============================================================================
//
// Uses cloudflared tunnel to connect to local Ollama
// Tunnel URL: https://institutions-toe-der-dir.trycloudflare.com
// Model: gemma4:e4b (E4B - 4B params edge version)
// =============================================================================

const OLLAMA_URL = process.env.OLLAMA_URL || "https://institutions-toe-der-dir.trycloudflare.com";

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
        const targetLang = args.targetLanguage || 'English';
        const systemMessage = {
            role: "system",
            content: `You are Samiati, a friendly chat assistant. Your goal is to chat naturally with the user. Reply in ${targetLang} language only. Keep responses short, casual, and friendly. Never explain or define words unless the user explicitly asks.`
        };

        const apiMessages = [systemMessage, ...args.messages];

        try {
            const response = await fetch(`${OLLAMA_URL}/v1/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "gemma4:e4b",
                    messages: apiMessages,
                    max_tokens: 350,
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Ollama API Error (${response.status}):`, errorText);
                return `ERROR: Ollama returned status ${response.status}. Details: ${errorText.substring(0, 200)}. Make sure Ollama is running and tunnel is active.`;
            }

            const result = await response.json();
            const aiResponse = result.choices?.[0]?.message?.content;
            return aiResponse || "N/A";

        } catch (error) {
            console.error("Chat Action execution failed:", error);
            return "ERROR: Network error. Is the tunnel still running? Try: npx cloudflared tunnel --url http://localhost:11434";
        }
    },
});