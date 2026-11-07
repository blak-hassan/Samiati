import { HuggingFaceTranslationService } from "./providers/huggingface";
import {
  HeuristicLanguageDetector,
  MockReasoningService,
  MockTranslationService,
} from "./providers/mock";
import { OpenAICompatibleReasoningService } from "./providers/openai-compatible";
import type { ReasoningService, TranslationService } from "./types";

export * from "./types";
export * from "./pipeline";

export interface AiRuntime {
  translation: TranslationService;
  reasoning: ReasoningService;
  /** True when either provider is the built-in placeholder. */
  isMock: boolean;
  /** True when the reasoning model is a real, connected model. */
  reasoningConnected: boolean;
  /** True when the translation model is a real, connected model. */
  translationConnected: boolean;
  /** Short, human-readable notes for the status panel in Settings. */
  notes: string[];
}

const DEFAULT_REASONING_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_REASONING_MODEL = "gpt-4o-mini";
const DEFAULT_TRANSLATION_MODEL = "facebook/nllb-200-distilled-600M";

/**
 * Resolves the AI providers from the environment.
 *
 * Samiati deliberately has **no hardcoded provider**. Whatever is configured
 * is used; whatever is not configured falls back to the clearly-labelled
 * placeholder providers so the application still runs end to end.
 */
export function resolveAiRuntime(
  env: NodeJS.ProcessEnv = process.env,
): AiRuntime {
  const notes: string[] = [];

  const reasoningKey =
    env.SAMIATI_REASONING_API_KEY?.trim() || env.OPENAI_API_KEY?.trim();
  const reasoningBaseUrl =
    env.SAMIATI_REASONING_BASE_URL?.trim() ||
    env.OPENAI_BASE_URL?.trim() ||
    DEFAULT_REASONING_BASE_URL;
  const reasoningModel =
    env.SAMIATI_REASONING_MODEL?.trim() ||
    env.OPENAI_MODEL?.trim() ||
    DEFAULT_REASONING_MODEL;

  let reasoning: ReasoningService;
  let reasoningConnected = false;

  if (reasoningKey) {
    reasoning = new OpenAICompatibleReasoningService({
      baseUrl: reasoningBaseUrl,
      apiKey: reasoningKey,
      model: reasoningModel,
      label: `Reasoning model (${reasoningModel})`,
    });
    reasoningConnected = true;
    notes.push(`Reasoning model connected: ${reasoningModel}`);
  } else {
    reasoning = new MockReasoningService();
    notes.push(
      "No reasoning model configured — Samiati is running the built-in placeholder provider.",
    );
  }

  const translationKey = env.HUGGINGFACE_API_KEY?.trim();
  const translationModel =
    env.SAMIATI_TRANSLATION_MODEL?.trim() || DEFAULT_TRANSLATION_MODEL;

  let translation: TranslationService;
  let translationConnected = false;

  if (translationKey) {
    translation = new HuggingFaceTranslationService({
      apiKey: translationKey,
      model: translationModel,
    });
    translationConnected = true;
    notes.push(`Translation model connected: ${translationModel}`);
  } else {
    translation = new MockTranslationService();
    notes.push(
      "No translation model configured — replies are not being translated between languages.",
    );
  }

  return {
    translation,
    reasoning,
    isMock: !reasoningConnected || !translationConnected,
    reasoningConnected,
    translationConnected,
    notes,
  };
}

/** Detects the language of a piece of text using the heuristic detector. */
export function detectLanguageHeuristically(text: string) {
  return new HeuristicLanguageDetector().detect(text);
}
