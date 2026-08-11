import { v } from "convex/values";
import { action } from "./_generated/server";

// =============================================================================
// AI SERVICE — Sunflower-Gemma4-E2B via HuggingFace Inference API
// =============================================================================
// Single model for chat + search. Replaces both Gemini API and Ollama.
// API key: HUGGINGFACE_API_KEY (Set in Convex Dashboard)
// Model: Sunbird/Sunflower-Gemma4-E2B (69 African languages)
// =============================================================================

const SUNFLOWER_URL = "https://router.huggingface.co/Sunbird/Sunflower-Gemma4-E2B";
const MAX_MESSAGE_LENGTH = 10000;
const MAX_HISTORY_LENGTH = 20;

async function callSunflower(
    messages: { role: string; content: string }[],
    maxTokens = 1024,
    temperature = 0.7,
): Promise<string> {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
        throw new Error("HUGGINGFACE_API_KEY not configured in Convex Dashboard.");
    }

    const response = await fetch(SUNFLOWER_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "Sunbird/Sunflower-Gemma4-E2B",
            messages,
            max_tokens: maxTokens,
            temperature,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Sunflower] API Error (${response.status}):`, errorText);
        if (response.status === 503) throw new Error("Model is loading, please try again in a moment.");
        if (response.status === 429) throw new Error("Rate limit exceeded. Please wait and try again.");
        throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Unexpected response format from Sunflower API.");
    return content.trim();
}

export const sendMessage = action({
    args: {
        userMessage: v.string(),
        conversationHistory: v.array(v.object({
            sender: v.string(),
            text: v.string(),
        })),
    },
    handler: async (ctx, args) => {
        if (args.userMessage.length > MAX_MESSAGE_LENGTH) {
            return "ERROR: Message too long. Please keep messages under 10,000 characters.";
        }

        const limitedHistory = args.conversationHistory.slice(-MAX_HISTORY_LENGTH);

        const messages = [
            {
                role: "system",
                content: "You are Samiati, a friendly AI assistant focused on African languages and culture. Reply naturally and helpfully.",
            },
            ...limitedHistory.map(msg => ({
                role: msg.sender === "user" ? "user" as const : "assistant" as const,
                content: msg.text,
            })),
            { role: "user" as const, content: args.userMessage },
        ];

        try {
            return await callSunflower(messages, 1024, 0.9);
        } catch (error) {
            console.error("[Sunflower] sendMessage failed:", error);
            return `ERROR: ${error instanceof Error ? error.message : "Failed to get response."}`;
        }
    },
});

const MAX_QUERY_LENGTH = 5000;

export const search = action({
    args: {
        query: v.string(),
        language: v.string(),
    },
    handler: async (ctx, args) => {
        if (args.query.length > MAX_QUERY_LENGTH) {
            return { answer: "ERROR: Query too long. Please keep queries under 5,000 characters.", sources: [], followUps: [] };
        }

        const langInstruction = args.language.toLowerCase() === "english"
            ? "Answer in English."
            : `Answer primarily in ${args.language}. If the user asks in English, answer in English but include ${args.language} terms where relevant.`;

        const messages = [
            {
                role: "system",
                content: `You are Samiati, an AI assistant focused on African languages and culture. ${langInstruction}`,
            },
            {
                role: "user",
                content: `Answer this question clearly and informatively (2-4 paragraphs). Be specific about African languages, cultures, and traditions when relevant. At the very end of your response, add a line starting with "FOLLOWUPS:" followed by exactly 2-3 short follow-up question suggestions separated by "||". Example: FOLLOWUPS: Tell me more about X||How does Y compare to Z

Question: ${args.query}`,
            },
        ];

        try {
            const rawText = await callSunflower(messages, 1024, 0.7);

            let answer = rawText;
            let followUps: string[] = [];

            const followUpMatch = rawText.match(/FOLLOWUPS:\s*(.+)$/m);
            if (followUpMatch) {
                followUps = followUpMatch[1].split("||").map(s => s.trim()).filter(Boolean);
                answer = rawText.replace(/\n?FOLLOWUPS:\s*.+$/, "").trim();
            }

            return { answer, sources: [], followUps };
        } catch (error) {
            console.error("[Sunflower] search failed:", error);
            return { answer: `ERROR: ${error instanceof Error ? error.message : "Search failed."}`, sources: [], followUps: [] };
        }
    },
});
