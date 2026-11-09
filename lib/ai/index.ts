import { HuggingFaceTranslationService } from "./providers/huggingface";
import {
  HeuristicLanguageDetector,
  MockReasoningService,
  MockTranslationService,
} from "./providers/mock";
import { OpenAICompatibleReasoningService } from "./providers/openai-compatible";
import { buildTranslationRoutes } from "./router";
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
 * The prefix of the environment variables that name a dedicated model.
 *
 * `SAMIATI_TRANSLATION_MODEL_KISWAHILI=some/model` gives Kiswahili its own
 * translation model, which the router prefers over the general one.
 */
const DEDICATED_MODEL_PREFIX = "SAMIATI_TRANSLATION_MODEL_";

/**
 * The dedicated translation models named in the environment.
 *
 * The key is the Samiati language id in lower case, so the id in the registry
 * is the id in the environment.
 */
function dedicatedTranslationModels(
  env: Record<string, string | undefined>,
): Record<string, string> {
  const models: Record<string, string> = {};

  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith(DEDICATED_MODEL_PREFIX)) continue;
    const languageId = key.slice(DEDICATED_MODEL_PREFIX.length).toLowerCase();
    const model = value?.trim();
    if (!languageId || !model) continue;
    models[languageId] = model;
  }

  return models;
}

/**
 * Resolves the AI providers from the environment.
 *
 * Samiati deliberately has **no hardcoded provider**. Whatever is configured
 * is used; whatever is not configured falls back to the clearly-labelled
 * placeholder providers so the application still runs end to end.
 */
export function resolveAiRuntime(
  env: Record<string, string | undefined> = process.env,
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

  // The general model covers every language. A language with a dedicated model
  // gets one, and the router prefers it over the general model.
  const generalTranslation = translationKey
    ? new HuggingFaceTranslationService({
        apiKey: translationKey,
        model: translationModel,
      })
    : new MockTranslationService();

  const dedicated: Record<string, TranslationService> = {};

  for (const [languageId, model] of Object.entries(
    dedicatedTranslationModels(env),
  )) {
    if (!translationKey) {
      notes.push(
        `A dedicated translation model is configured for ${languageId}, but no Hugging Face key is set, so it is not used.`,
      );
      continue;
    }
    dedicated[languageId] = new HuggingFaceTranslationService({
      apiKey: translationKey,
      model,
    });
    notes.push(`Dedicated translation model for ${languageId}: ${model}`);
  }

  const translation = buildTranslationRoutes({
    general: generalTranslation,
    dedicated,
  });

  const translationConnected = !translation.isMock;

  if (translationConnected) {
    notes.push(`Translation model connected: ${translationModel}`);
  } else {
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
