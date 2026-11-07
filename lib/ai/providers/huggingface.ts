import type {
  LanguageDetection,
  TranslationRequest,
  TranslationResult,
  TranslationService,
} from "../types";

/**
 * FLORES-200 language codes, the format used by Meta's NLLB-200 family.
 *
 * Samiati's stable language ids map onto these codes here and nowhere else.
 * `null` means "no mapping yet" — the provider then refuses the pair rather
 * than guessing and producing a wrong translation.
 */
const FLORES_CODES: Readonly<Record<string, string | null>> = {
  en: "eng_Latn",
  kiswahili: "swh_Latn",
  sheng: "swh_Latn",
  kikuyu: "kik_Latn",
  luhya: "luy_Latn",
  dholuo: "luo_Latn",
  somali: "som_Latn",
  kamba: "kam_Latn",
  kalenjin: "kln_Latn",
  gusii: "ggc_Latn",
  meru: "mer_Latn",
  maasai: "mas_Latn",
};

export interface HuggingFaceTranslationOptions {
  apiKey: string;
  /** e.g. "facebook/nllb-200-distilled-600M" */
  model: string;
  baseUrl?: string;
}

export class HuggingFaceTranslationService implements TranslationService {
  readonly id = "huggingface";
  readonly label: string;
  readonly isMock = false;
  readonly supportedLanguageIds: readonly string[];

  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(options: HuggingFaceTranslationOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.baseUrl = options.baseUrl ?? "https://api-inference.huggingface.co/models";
    this.label = `Translation model (${options.model})`;
    this.supportedLanguageIds = Object.entries(FLORES_CODES)
      .filter(([, code]) => code !== null)
      .map(([languageId]) => languageId);
  }

  private floresCode(languageId: string): string | null {
    return FLORES_CODES[languageId] ?? null;
  }

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    if (request.sourceLanguageId === request.targetLanguageId) {
      return {
        text: request.text,
        provider: this.id,
        model: this.model,
        confidence: 1,
        isMock: false,
      };
    }

    const source = this.floresCode(request.sourceLanguageId);
    const target = this.floresCode(request.targetLanguageId);

    if (!source || !target) {
      throw new Error(
        `Translation model has no mapping for ${request.sourceLanguageId} → ${request.targetLanguageId}`,
      );
    }

    const response = await fetch(`${this.baseUrl}/${this.model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: request.text,
        parameters: { src_lang: source, tgt_lang: target },
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `Translation model request failed (${response.status})${detail ? `: ${detail.slice(0, 300)}` : ""}`,
      );
    }

    const payload = (await response.json()) as
      | Array<{ translation_text?: string }>
      | { error?: string; translation_text?: string };

    const text = Array.isArray(payload)
      ? (payload[0]?.translation_text ?? "")
      : (payload.translation_text ?? "");

    if (!text) {
      throw new Error(
        `Translation model returned no text${Array.isArray(payload) ? "" : `: ${payload.error ?? "unknown error"}`}`,
      );
    }

    return {
      text,
      provider: this.id,
      model: this.model,
      isMock: false,
    };
  }

  /**
   * NLLB models are translation-only, so language identification is handled by
   * the heuristic detector rather than the model.
   */
  async detectLanguage(text: string): Promise<LanguageDetection> {
    const { HeuristicLanguageDetector } = await import("./mock");
    return new HeuristicLanguageDetector().detect(text);
  }
}
