import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { requireAuthenticatedAction, enforceAiQuotaAction } from "./lib/aiSecurity";

// =============================================================================
// AI SERVICE — Sunflower-Gemma4-E2B via HuggingFace Inference API
// =============================================================================
// Single model for chat + search. Replaces Gemini API, Ollama, and previous providers.
// API key: HUGGINGFACE_API_KEY (Set in Convex Dashboard)
// Model: BlakHasan/Sunflower-Gemma4-E2B (69 African languages)
// =============================================================================

const SUNFLOWER_URL = "https://router.huggingface.co/BlakHasan/Sunflower-Gemma4-E2B";
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
            model: "BlakHasan/Sunflower-Gemma4-E2B",
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
        await requireAuthenticatedAction(ctx);
        await enforceAiQuotaAction(ctx, "chat");

        if (args.userMessage.length > MAX_MESSAGE_LENGTH) {
            return "ERROR: Message too long. Please keep messages under 10,000 characters.";
        }
        if (args.conversationHistory.length > 50) {
            return "ERROR: Too much conversation history.";
        }
        if (args.conversationHistory.some((msg) => msg.text.length > MAX_MESSAGE_LENGTH)) {
            return "ERROR: A message in the conversation history is too long.";
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
const MAX_DOCUMENT_LENGTH = 8000;

interface SearchArgs {
    query: string;
    language: string;
    links?: { title: string; url: string; snippet?: string }[];
    document?: string;
}

interface SearchResult {
    answer: string;
    sources: { title: string; url: string; snippet?: string }[];
    followUps: string[];
}

// Shared search core. Kept free of auth/quota so internal callers (SMS
// pipeline) can reuse it; every public entry point must gate it.
export async function runSearchCore(args: SearchArgs): Promise<SearchResult> {
    if (args.query.length > MAX_QUERY_LENGTH) {
        return { answer: "ERROR: Query too long. Please keep queries under 5,000 characters.", sources: [], followUps: [] };
    }

    const links = args.links ?? [];
    const doc = (args.document ?? "").trim().slice(0, MAX_DOCUMENT_LENGTH);

    const langInstruction = args.language.toLowerCase() === "english"
        ? "Answer in English."
        : `Answer primarily in ${args.language}. If the user asks in English, answer in English but include ${args.language} terms where relevant.`;

    const linksSection = links.length > 0
        ? `\n\nYou may use these web sources for grounding. Whenever you use one, cite it in your answer with [n] where n is its number. Never cite a source not in this list:\n${links.map((l, i) => `[${i + 1}] ${l.title} — ${l.url}`).join("\n")}`
        : "\n\nNo web sources were provided. Answer from your knowledge and do not invent citations.";

    const docSection = doc
        ? `\n\nThe user attached a document. Use it as the primary context when answering:\n---\n${doc}\n---`
        : "";

    const messages = [
        {
            role: "system",
            content: `You are Samiati, an AI assistant focused on African languages and culture. ${langInstruction}`,
        },
        {
            role: "user",
            content: `Answer this question clearly and informatively (2-4 paragraphs). Be specific about African languages, cultures, and traditions when relevant. Cite sources you use with [n]. At the very end of your response add a line starting with "SOURCES:" followed by the numbers of the sources you cited, comma-separated (or "none" if you cited none), then a line starting with "FOLLOWUPS:" followed by exactly 2-3 short follow-up question suggestions separated by "||". Example: SOURCES: 1,3\nFOLLOWUPS: Tell me more about X||How does Y compare to Z${linksSection}${docSection}

Question: ${args.query}`,
        },
    ];

    try {
        const rawText = await callSunflower(messages, 1024, 0.7);

        let answer = rawText;
        let followUps: string[] = [];
        let sources: { title: string; url: string; snippet?: string }[] = [];

        const followUpMatch = rawText.match(/FOLLOWUPS:\s*(.+)$/m);
        if (followUpMatch) {
            followUps = followUpMatch[1].split("||").map(s => s.trim()).filter(Boolean);
            answer = answer.replace(/\n?FOLLOWUPS:\s*.+$/, "").trim();
        }

        const sourcesMatch = answer.match(/SOURCES:\s*(.+)$/m);
        if (sourcesMatch) {
            answer = answer.replace(/\n?SOURCES:\s*.+$/, "").trim();
            const byNumber = new Map(links.map((l, i) => [i + 1, l]));
            const cited = sourcesMatch[1]
                .split(/[,\s]+/)
                .map(s => parseInt(s.replace(/[^0-9]/g, ""), 10))
                .filter(n => !isNaN(n) && byNumber.has(n));
            sources = cited.map(n => byNumber.get(n)!).filter(Boolean);
        }

        if (sources.length === 0) {
            const order: number[] = [];
            const citationRe = /\[(\d+)\]/g;
            let m;
            while ((m = citationRe.exec(answer)) !== null) {
                const n = parseInt(m[1], 10);
                if (!order.includes(n)) order.push(n);
            }
            const byNumber = new Map(links.map((l, i) => [i + 1, l]));
            sources = order.map(n => byNumber.get(n)).filter(Boolean) as { title: string; url: string; snippet?: string }[];
        }

        return { answer, sources, followUps };
    } catch (error) {
        console.error("[Sunflower] search failed:", error);
        return { answer: `ERROR: ${error instanceof Error ? error.message : "Search failed."}`, sources: [], followUps: [] };
    }
}

export const search = action({
    args: {
        query: v.string(),
        language: v.string(),
        links: v.optional(v.array(v.object({
            title: v.string(),
            url: v.string(),
            snippet: v.optional(v.string()),
        }))),
        document: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireAuthenticatedAction(ctx);
        await enforceAiQuotaAction(ctx, "search");
        if (args.language.length > 100) {
            return { answer: "ERROR: Invalid language.", sources: [], followUps: [] };
        }
        return await runSearchCore(args);
    },
});

// Server-to-server search (SMS pipeline). Internal actions are unreachable
// from the public HTTP API, so this cannot be abused externally.
export const searchInternal = internalAction({
    args: {
        query: v.string(),
        language: v.string(),
        links: v.optional(v.array(v.object({
            title: v.string(),
            url: v.string(),
            snippet: v.optional(v.string()),
        }))),
        document: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await runSearchCore(args);
    },
});
