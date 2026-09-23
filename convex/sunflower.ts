import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { requireAuthenticatedAction, enforceAiQuotaAction } from "./lib/aiSecurity";
import { captureException } from "./lib/observability";
import { internal } from "./_generated/api";
import "./lib/providers";

// =============================================================================
// SEARCH SERVICE — via the AI router
// =============================================================================
// Primary: Sunflower-Gemma4-E2B on HuggingFace. The router adds an
// abstraction layer; if HF degrades, a configured fallback is tried.
// See convex/lib/aiRouter.ts.
// =============================================================================

const MAX_MESSAGE_LENGTH = 10000;
const MAX_HISTORY_LENGTH = 20;

/**
 * Shared chat helper. Wraps the router so the call sites below
 * (sendMessage + runSearchCore) can stay focused on prompt construction.
 * Returns the assistant's reply text on success or throws on permanent
 * failure so the callers can map to their own user-facing strings.
 */
export async function callSunflower(
    messages: { role: "system" | "user" | "assistant"; content: string }[],
    maxTokens = 1024,
    temperature = 0.7,
): Promise<string> {
    const { routeChat } = await import("./lib/aiRouter");
    const result = await routeChat({ messages, maxTokens, temperature });
    if (result.ok) return result.value;
    const e = result.error;
    // Permanent errors throw; transient errors have already been
    // retried via the fallback path inside the router.
    throw new Error(e.message || "AI provider error");
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
                role: "system" as const,
                content: "You are Samiati, a friendly AI assistant focused on African languages and culture. Reply naturally and helpfully.",
            },
            ...limitedHistory.map(msg => ({
                role: msg.sender === "user" ? "user" as const : "assistant" as const,
                content: msg.text,
            })),
            { role: "user" as const, content: args.userMessage },
        ];

        try {
            // callSunflower delegates to the router but re-throws on
            // permanent errors, so we lose the UsageEstimate here.
            // Acceptable: this `sendMessage` is the legacy action and
            // is not the main chat path (`convex/chat.ts` records
            // usage). New callers should use `routeChat` directly.
            return await callSunflower(messages, 1024, 0.9);
        } catch (error) {
            console.error("[Search] sendMessage failed:", error);
            captureException(error, { tags: { service: "chat" } });
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
//
// `callLLM` is injected so the caller decides whether to use the
// router (for usage capture) or `callSunflower` (legacy path). The
// default is the router.
export async function runSearchCore(
    args: SearchArgs,
    callLLM?: (messages: Array<{ role: "system" | "user"; content: string }>, maxTokens: number, temperature: number) => Promise<{ text: string; provider: string; usage: import("./lib/aiRouter").UsageEstimate | undefined }>,
): Promise<SearchResult> {
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

    const messages: Array<{ role: "system" | "user"; content: string }> = [
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

    let rawText: string;
    try {
        if (callLLM) {
            const r = await callLLM(messages, 1024, 0.7);
            rawText = r.text;
        } else {
            rawText = await callSunflower(messages, 1024, 0.7);
        }
    } catch (error) {
        console.error("[Search] LLM call failed:", error);
        captureException(error, { tags: { service: "search" } });
        return { answer: `ERROR: ${error instanceof Error ? error.message : "Search failed."}`, sources: [], followUps: [] };
    }

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
        const identity = await requireAuthenticatedAction(ctx);
        await enforceAiQuotaAction(ctx, "search");
        if (args.language.length > 100) {
            return { answer: "ERROR: Invalid language.", sources: [], followUps: [] };
        }
        return await runSearchCore(args, async (messages, maxTokens, temperature) => {
            const { routeChat } = await import("./lib/aiRouter");
            const r = await routeChat({ messages, maxTokens, temperature });
            if (r.usage) {
                const { usageToRecordArgs } = await import("./lib/aiUsage");
                try {
                    await ctx.runMutation(
                        internal.lib.aiUsage.recordUsage,
                        usageToRecordArgs(r.usage, r.provider, {
                            ok: r.ok,
                            errorCode: r.ok ? undefined : r.error.code,
                            subject: identity?.subject,
                        }),
                    );
                } catch (e) {
                    console.error("[search] failed to record usage:", e);
                }
            }
            if (!r.ok) {
                throw new Error(r.error.message);
            }
            return { text: r.value, provider: r.provider, usage: r.usage };
        });
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
        return await runSearchCore(args, async (messages, maxTokens, temperature) => {
            const { routeChat } = await import("./lib/aiRouter");
            const r = await routeChat({ messages, maxTokens, temperature });
            if (r.usage) {
                const { usageToRecordArgs } = await import("./lib/aiUsage");
                try {
                    await ctx.runMutation(
                        internal.lib.aiUsage.recordUsage,
                        usageToRecordArgs(r.usage, r.provider, {
                            ok: r.ok,
                            errorCode: r.ok ? undefined : r.error.code,
                            subject: "sms-pipeline",
                        }),
                    );
                } catch (e) {
                    console.error("[search-internal] failed to record usage:", e);
                }
            }
            if (!r.ok) {
                throw new Error(r.error.message);
            }
            return { text: r.value, provider: r.provider, usage: r.usage };
        });
    },
});
