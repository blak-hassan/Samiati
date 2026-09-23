import { v } from "convex/values";
import { action } from "./_generated/server";
import { requireAuthenticatedAction, enforceAiQuotaAction } from "./lib/aiSecurity";
import { captureMessage } from "./lib/observability";
import { internal } from "./_generated/api";
import "./lib/providers";

// =============================================================================
// CHAT SERVICE — via the AI router
// =============================================================================
// Primary: Sunflower-Gemma4-E2B on HuggingFace. See convex/lib/aiRouter.ts.
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
        const identity = await requireAuthenticatedAction(ctx);
        await enforceAiQuotaAction(ctx, "chat");

        const limitedMessages = args.messages.slice(-MAX_MESSAGES_HISTORY);
        const oversizedMessage = limitedMessages.find((msg) => msg.content.length > MAX_CHAT_MESSAGE_LENGTH);
        if (oversizedMessage) {
            return "ERROR: Message too long. Please keep messages under 5,000 characters.";
        }

        const targetLang = args.targetLanguage || "English";
        const clientMessages = limitedMessages
            .filter((msg) => msg.role === "user" || msg.role === "assistant")
            .map((msg) => ({
                role: msg.role as "user" | "assistant",
                content: msg.content,
            }));
        const messages = [
            {
                role: "system" as const,
                content: `You are Samiati, a friendly chat assistant. Your goal is to chat naturally with the user. Reply in ${targetLang} language only. Keep responses short, casual, and friendly. Never explain or define words unless the user explicitly asks.`,
            },
            ...clientMessages,
        ];

        const { routeChat } = await import("./lib/aiRouter");
        const result = await routeChat({
            messages,
            maxTokens: 350,
            temperature: 0.7,
        });

        // Persist usage. Best-effort: failure to record must not block
        // the user-facing response, so we wrap in try/catch and log.
        if (result.usage) {
            const { usageToRecordArgs } = await import("./lib/aiUsage");
            try {
                await ctx.runMutation(
                    internal.lib.aiUsage.recordUsage,
                    usageToRecordArgs(result.usage, result.provider, {
                        ok: result.ok,
                        errorCode: result.ok ? undefined : result.error.code,
                        subject: identity?.subject,
                    }),
                );
            } catch (e) {
                console.error("[chat] failed to record usage:", e);
            }
        }

        if (result.ok) return result.value;

        const e = result.error;
        captureMessage("Chat provider call failed", {
            level: "warning",
            tags: { service: "chat", provider: result.provider, code: e.code },
            extra: { status: e.status },
        });
        if (e.code === "not_implemented") {
            return "ERROR: Chat is temporarily unavailable. Please try again later.";
        }
        return `ERROR: ${e.message}`;
    },
});
