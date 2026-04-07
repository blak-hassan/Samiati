import { v } from "convex/values";
import { action } from "./_generated/server";

// =============================================================================
// CHAT SERVICE (Ollama Local or HuggingFace Cloud)
// =============================================================================
//
// OPTION 1 - LOCAL OLLAMA (Recommended for privacy/offline):
//   1. Install Ollama: https://ollama.com
//   2. Run: ollama pull gemma4b
//   3. Run: ollama serve
//   4. Set environment variable: OLLAMA_URL=http://localhost:11434
//
// OPTION 2 - HUGGINGFACE CLOUD (Default):
//   - Uses HuggingFace Inference API with google/gemma-4-2b-it
//   - Requires HUGGINGFACE_API_KEY
//   - Must accept terms at: https://huggingface.co/google/gemma-4-2b-it
// =============================================================================

// Configuration: Set OLLAMA_URL for local, or leave empty for HuggingFace
const OLLAMA_URL = process.env.OLLAMA_URL || "";
const USE_OLLAMA = !!OLLAMA_URL;

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
        // System Prompt for Samiati - Gemma supports African languages natively
        const systemMessage = {
            role: "system",
            content: "You are Samiati, a friendly chat assistant. Your goal is to chat naturally with the user. Reply in the same language the user uses (English or Swahili/Kikuyu/Luo/etc.). Keep responses short, casual, and friendly. Never explain or define words unless the user explicitly asks."
        };

        // Prepare messages (prepend system message)
        const apiMessages = [systemMessage, ...args.messages];

        try {
            if (USE_OLLAMA) {
                // =====================================================================
                // LOCAL OLLAMA (Privacy-focused, offline-capable)
                // =====================================================================
                const response = await fetch(`${OLLAMA_URL}/v1/chat/completions`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: "gemma",
                        messages: apiMessages,
                        max_tokens: 350,
                        temperature: 0.7,
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Ollama API Error (${response.status}):`, errorText);
                    return `ERROR: Ollama returned status ${response.status}. Details: ${errorText.substring(0, 200)}. Make sure Ollama is running with 'ollama serve' and the model is loaded with 'ollama pull gemma4b'.`;
                }

                const result = await response.json();
                const aiResponse = result.choices?.[0]?.message?.content;
                return aiResponse || "N/A";

            } else {
                // =====================================================================
                // HUGGINGFACE CLOUD (Default - no local setup needed)
                // =====================================================================
                const apiKey = process.env.HUGGINGFACE_API_KEY;

                if (!apiKey) {
                    console.error("HUGGINGFACE_API_KEY is not set!");
                    return "ERROR: HuggingFace API key not configured. Please set HUGGINGFACE_API_KEY in Convex Dashboard, or set OLLAMA_URL to use local Ollama.";
                }

                const response = await fetch("https://router.huggingface.co/google/gemma-4-2b-it/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: "google/gemma-4-2b-it",
                        messages: apiMessages,
                        max_tokens: 350,
                        temperature: 0.7,
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`HuggingFace API Error (${response.status}):`, errorText);
                    
                    // Handle 400 Bad Request specifically
                    if (response.status === 400) {
                        return `ERROR: Bad Request (400). The model may not be available or requires a different format. Details: ${errorText.substring(0, 200)}. Please check: (1) Model availability at https://huggingface.co/google/gemma-4-2b-it, (2) Accept model terms if required, (3) Try a different model variant.`;
                    }
                    
                    // Handle 403 Forbidden specifically
                    if (response.status === 403) {
                        return "ERROR: HuggingFace API access forbidden. This may be due to: (1) Invalid API key, (2) Model requires accepting terms at https://huggingface.co/google/gemma-4-2b-it, or (3) API quota exceeded. Please check your API key and model access.";
                    }
                    
                    // Handle 429 Rate Limit
                    if (response.status === 429) {
                        return "ERROR: HuggingFace API rate limit exceeded. Please wait a moment and try again.";
                    }
                    
                    // Return detailed error for debugging
                    return `ERROR: HuggingFace API returned status ${response.status}. Details: ${errorText.substring(0, 200)}`;
                }

                const result = await response.json();
                const aiResponse = result.choices?.[0]?.message?.content;

                return aiResponse || "N/A";
            }

        } catch (error) {
            console.error("Chat Action execution failed:", error);
            
            // Differentiate error messages
            if (USE_OLLAMA) {
                return `ERROR: Network error while calling Ollama. Please check: (1) Is 'ollama serve' running? (2) Is OLLAMA_URL correct? (3) Is ngrok tunnel active?`;
            } else {
                return "ERROR: Network error while calling HuggingFace API. Please check your connection.";
            }
        }
    },
});
