import { v } from "convex/values";
import { action } from "../_generated/server";
import { callSunflower } from "../sunflower";
import { requireAuthenticatedAction } from "../lib/aiSecurity";
import { captureException } from "../lib/observability";

const SYSTEM_PROMPT =
    "You generate short, descriptive titles (3-6 words) for chat conversations about African languages and culture. " +
    "The title should capture the topic in the user's first language. " +
    "Respond with ONLY the title — no quotes, no punctuation at the end, no preamble.";

/**
 * Generate a short, descriptive title for a conversation using the Sunflower
 * AI router. Falls back to a deterministic first-message truncation when the
 * AI is unavailable so the Saved Sessions page never blocks on a rename.
 */
export const suggestTitle = action({
    args: {
        messages: v.array(
            v.object({
                sender: v.string(),
                text: v.string(),
            })
        ),
    },
    handler: async (ctx, args) => {
        const fallback = (): string => {
            const firstUser = args.messages.find((m) => m.sender === "user" && m.text.trim().length > 0);
            const seed = firstUser?.text ?? args.messages[0]?.text ?? "New conversation";
            const cleaned = seed.replace(/\s+/g, " ").trim();
            return (cleaned.length > 60 ? cleaned.slice(0, 57) + "..." : cleaned) || "New conversation";
        };

        try {
            await requireAuthenticatedAction(ctx);
        } catch {
            return { title: fallback(), source: "fallback" as const };
        }

        try {
            // Take up to 6 representative messages so the prompt stays cheap.
            const recent = args.messages.slice(-6);
            const transcript = recent
                .map((m) => `${m.sender === "user" ? "User" : "AI"}: ${m.text}`)
                .join("\n")
                .slice(0, 1500);

            const title = await callSunflower(
                [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: `Conversation:\n${transcript}\n\nTitle:` },
                ],
                24,
                0.4,
            );
            const trimmed = title.replace(/^["'`]+|["'`]+$/g, "").replace(/\s+/g, " ").trim();
            if (trimmed.length === 0 || trimmed.length > 80) {
                return { title: fallback(), source: "fallback" as const };
            }
            return { title: trimmed, source: "ai" as const };
        } catch (err) {
            captureException(err, { tags: { feature: "suggestTitle" } });
            return { title: fallback(), source: "fallback" as const };
        }
    },
});
