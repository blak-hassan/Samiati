
import { v } from "convex/values";
import { action } from "./_generated/server";
import { requireAuthenticatedAction, enforceAiQuotaAction } from "./lib/aiSecurity";
import { captureMessage } from "./lib/observability";
import { internal } from "./_generated/api";
import "./lib/providers";

// =============================================================================
// TRANSLATION SERVICE — via the AI router
// =============================================================================
// Primary: Sunflower-Gemma4-E2B on HuggingFace. 69 African languages.
// =============================================================================

// Map short codes to human-readable language names for Sunflower prompt format
const LANGUAGE_MAP: Record<string, string> = {
    'sw': 'Swahili', 'swh_Latn': 'Swahili',
    'ki': 'Kikuyu', 'kik_Latn': 'Kikuyu',
    'luo': 'Luo', 'luo_Latn': 'Luo',
    'en': 'English', 'eng_Latn': 'English',
    'kam': 'Kamba', 'kam_Latn': 'Kamba',
    'kln': 'Kalenjin', 'kln_Latn': 'Kalenjin',
    'luy': 'Luhya', 'luy_Latn': 'Luhya',
    'mer': 'Meru', 'mer_Latn': 'Meru',
    'mas': 'Maasai', 'mas_Latn': 'Maasai',
    'lug': 'Luganda',
    'ach': 'Acholi',
    'afr': 'Afrikaans',
    'hau': 'Hausa',
    'ibo': 'Igbo',
    'yor': 'Yoruba',
    'fra': 'French',
    'som': 'Somali',
    'kin': 'Kinyarwanda',
    'lin': 'Lingala',
    'orm': 'Oromo',
    'sna': 'Shona',
    'tsn': 'Tswana',
    'xho': 'Xhosa',
    'zul': 'Zulu',
    'nya': 'Chichewa',
    'sot': 'Sotho',
    'ewe': 'Ewe',
    'ful': 'Fulani',
    'bam': 'Bambara',
    'amh': 'Amharic',
    'mlg': 'Malagasy',
    'nbl': 'Ndebele',
    'pcm': 'Nigerian Pidgin',
    'run': 'Kirundi',
    'nyo': 'Runyoro',
    'nyn': 'Runyankole',
    'cgg': 'Rukiga',
    'xog': 'Lusoga',
    'ttj': 'Rutooro',
    'ruc': 'Ruruuli',
    'kik': 'Kikuyu',
    'teo': 'Ateso',
    'wol': 'Wolof',
    'bfa': 'Bari',
    'rwm': 'Kwamba',
    'dag': 'Dagbani',
    'keo': 'Kakwa',
    'ber': 'Berber',
    'mhi': "Ma'di",
    'led': 'Lendu',
    'kdj': 'Karamojong',
    'pok': 'Pokot',
    'ikx': 'Ik',
    'kpz': 'Kupsabiny',
    'dga': 'Dagaare',
    'kau': 'Kanuri',
    'din': 'Dinka',
    'kpo': 'Ikposo',
};

const MAX_TRANSLATE_LENGTH = 5000;

export const translateText = action({
    args: {
        text: v.string(),
        targetLanguage: v.string(),
        context: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await requireAuthenticatedAction(ctx);
        await enforceAiQuotaAction(ctx, "translate");

        if (args.text.length > MAX_TRANSLATE_LENGTH) {
            return "ERROR: Text too long. Please keep text under 5,000 characters.";
        }
        if (args.targetLanguage.length > 50) {
            return "ERROR: Invalid language code.";
        }

        const langName = LANGUAGE_MAP[args.targetLanguage] || args.targetLanguage;
        const contextNote =
            args.context && args.context.trim().length > 0
                ? `\n\nContext (prior exchange, for tone/register only — do not translate): ${args.context.trim().slice(0, 1000)}`
                : "";

        const { routeChat } = await import("./lib/aiRouter");
        const result = await routeChat({
            messages: [
                {
                    role: "system",
                    content:
                        "You are Sunflower, a helpful assistant made by Sunbird AI who knows many African languages.",
                },
                {
                    role: "user",
                    content: `Translate from English to ${langName}: ${args.text}${contextNote}`,
                },
            ],
            maxTokens: 512,
            temperature: 0.0,
        });

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
                console.error("[translate] failed to record usage:", e);
            }
        }

        if (result.ok) {
            return result.value;
        }

        const e = result.error;
        captureMessage("Translate provider call failed", {
            level: "warning",
            tags: { service: "translate", provider: result.provider, code: e.code },
            extra: { status: e.status, targetLanguage: args.targetLanguage },
        });

        switch (e.code) {
            case "auth_missing":
                return "ERROR: HuggingFace API key not configured. Please set HUGGINGFACE_API_KEY in Convex Dashboard.";
            case "auth_invalid":
                return "ERROR: Translation API access forbidden. This may be due to: (1) Invalid API key, (2) Model requires accepting terms at https://huggingface.co/models/BlakHasan/Sunflower-Gemma4-E2B, or (3) API quota exceeded.";
            case "rate_limited":
                return "ERROR: Translation API rate limit exceeded. Please wait a moment and try again.";
            case "model_loading":
                return "Translation Model is loading, please try again in a moment.";
            case "not_implemented":
                return "ERROR: Translation is temporarily unavailable. Please try again later.";
            case "server_error":
            case "bad_response":
                return e.status ? `ERROR: Translation API returned status ${e.status}. Please try again.` : "ERROR: Translation service returned an unexpected response format.";
            default:
                return "ERROR: Translation failed due to a network error. Please check your connection.";
        }
    },
});
