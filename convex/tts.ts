
import { v } from "convex/values";
import { action } from "./_generated/server";
import { requireAuthenticatedAction, enforceAiQuotaAction } from "./lib/aiSecurity";
import { captureMessage } from "./lib/observability";
import { internal } from "./_generated/api";
import "./lib/providers";

// =============================================================================
// TTS SERVICE — via the AI router
// =============================================================================
// Primary provider: HuggingFace Orpheus-3B multilingual TTS
// (BlakHasan/orpheus-3b-tts-multilingual), 20+ African languages with
// per-language speaker IDs. See convex/lib/aiRouter.ts.
// =============================================================================

// Map language codes to Orpheus speaker IDs
const ORPHEUS_SPEAKER_MAP: Record<string, string> = {
    'en': 'salt_eng_0001',
    'eng_Latn': 'salt_eng_0001',
    'sw': 'waxal_swa_0006',
    'swh_Latn': 'waxal_swa_0006',
    'ki': 'waxal_kik_0003',
    'kik_Latn': 'waxal_kik_0003',
    'luo': 'waxal_luo_0001',
    'luo_Latn': 'waxal_luo_0001',
    'kam': 'waxal_kam_0001',
    'kam_Latn': 'waxal_kam_0001',
    'mas': 'waxal_mas_0001',
    'mas_Latn': 'waxal_mas_0001',
    'mer': 'waxal_mer_0001',
    'mer_Latn': 'waxal_mer_0001',
    'lug': 'salt_lug_0001',
    'ach': 'salt_ach_0001',
    'hau': 'waxal_hau_0004',
    'ibo': 'waxal_ibo_0003',
    'yor': 'waxal_yor_0002',
    'kin': 'bateesa_kin_0001',
    'lin': 'slr129_lin_0001',
    'sna': 'waxal_sna_0001',
    'tsn': 'waxal_tsn_0001',
    'xho': 'slr32_xho_0012',
    'zul': 'waxal_zul_0001',
    'nya': 'waxal_nya_0001',
    'sot': 'waxal_sot_0001',
    'ewe': 'slr129_ewe_0001',
    'ful': 'waxal_ful_0003',
    'afr': 'slr32_afr_0009',
    'amh': 'waxal_amh_0001',
    'mlg': 'waxal_mlg_0001',
};

const DEFAULT_SPEAKER = 'salt_eng_0001';
const MAX_TTS_LENGTH = 5000;

export const synthesizeSpeech = action({
    args: {
        text: v.string(),
        language: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await requireAuthenticatedAction(ctx);
        await enforceAiQuotaAction(ctx, "tts");

        if (args.text.length > MAX_TTS_LENGTH) {
            return { audioBase64: null, error: "ERROR: Text too long. Please keep text under 5,000 characters." };
        }

        const lang = args.language || 'en';
        const speakerId = ORPHEUS_SPEAKER_MAP[lang] || DEFAULT_SPEAKER;

        console.log(`[TTS] Synthesizing speech with speaker ${speakerId} for language: ${lang}`);

        const text = args.text.slice(0, MAX_TTS_LENGTH);

        const { routeTts } = await import("./lib/aiRouter");
        const result = await routeTts({ text, language: lang, speakerId });

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
                console.error("[tts] failed to record usage:", e);
            }
        }

        if (result.ok) {
            return {
                audioBase64: result.value.audioBase64,
                contentType: result.value.contentType,
                error: null,
            };
        }

        const e = result.error;
        captureMessage("TTS provider call failed", {
            level: "warning",
            tags: { service: "tts", provider: result.provider, code: e.code },
            extra: { status: e.status, language: lang },
        });

        switch (e.code) {
            case "auth_missing":
                return { audioBase64: null, error: "ERROR: API key not configured. Please set HUGGINGFACE_API_KEY in Convex Dashboard." };
            case "auth_invalid":
                return { audioBase64: null, error: "ERROR: TTS API access forbidden. This may be due to: (1) Invalid API key, (2) Model requires accepting terms at https://huggingface.co/models/BlakHasan/orpheus-3b-tts-multilingual, or (3) API quota exceeded." };
            case "rate_limited":
                return { audioBase64: null, error: "ERROR: TTS API rate limit exceeded. Please wait a moment and try again." };
            case "model_loading":
                return { audioBase64: null, error: "TTS Model is loading, please try again in a moment." };
            case "server_error":
            case "bad_response":
                return { audioBase64: null, error: e.status ? `TTS API Error: ${e.status}. Please try again.` : "TTS service returned an unexpected response." };
            case "not_implemented":
                return { audioBase64: null, error: "ERROR: TTS is temporarily unavailable. Please try again later." };
            default:
                return { audioBase64: null, error: "Speech synthesis failed due to a network error. Please check your connection." };
        }
    },
});
