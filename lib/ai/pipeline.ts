import { getLanguageOrDefault } from "@/lib/languages";

import type { MessageMeta, PipelineRoute } from "@/lib/data/types";

import type { ReasoningService, TranslationService } from "./types";

export type PipelineStage =
  | "input"
  | "translate-input"
  | "reasoning"
  | "translate-output"
  | "done";

export type PipelineEvent =
  | { type: "stage"; stage: PipelineStage; message?: string }
  | { type: "delta"; text: string; stage: "reasoning" | "translation" }
  | { type: "final"; text: string; languageId: string; meta: MessageMeta }
  | { type: "error"; message: string };

export interface PipelineMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface PipelineInput {
  /** The new user message, in the user's chosen language. */
  userMessage: string;
  /** The language the user is conversing in. */
  languageId: string;
  /** Prior turns, oldest first. */
  history: PipelineMessage[];
  signal?: AbortSignal;
}

export interface PipelineDeps {
  translation: TranslationService;
  reasoning: ReasoningService;
  /** System prompt describing how Samiati should behave. */
  systemPrompt?: string;
}

export const SAMIATI_SYSTEM_PROMPT = [
  "You are Samiati, a warm and precise assistant for African languages.",
  "You are answering a user who has chosen a specific African language.",
  "The conversation you receive has already been translated into English, and your answer will be translated back.",
  "Write clearly and concretely. Prefer the user's own vocabulary and cultural context where it helps.",
  "If you are unsure about a local term, say so plainly rather than inventing a translation.",
].join(" ");

/**
 * Runs one turn of the Samiati pipeline.
 *
 *   user input → translate to English → reasoning model → translate back
 *
 * Two deliberate properties:
 *
 *  1. **No duplicate model requests.** History is translated once per message
 *     per turn and the cache is reused across the turn.
 *  2. **Honest degradation.** If a translation step fails, the English answer
 *     is still delivered and the message metadata records that no translation
 *     happened, so the UI can tell the user rather than silently serving an
 *     English answer inside a Kiswahili conversation.
 */
export async function* runChatPipeline(
  deps: PipelineDeps,
  input: PipelineInput,
): AsyncGenerator<PipelineEvent> {
  const { translation, reasoning } = deps;
  const targetLanguage = getLanguageOrDefault(input.languageId);
  const isEnglish = targetLanguage.id === "en";

  const translationCache = new Map<string, string>();
  const translated = { input: false, output: false };

  const translateToEnglish = async (
    text: string,
    languageId: string,
  ): Promise<string> => {
    if (languageId === "en") return text;
    const cacheKey = `${languageId}::${text}`;
    const cached = translationCache.get(cacheKey);
    if (cached !== undefined) return cached;

    const result = await translation.translate({
      text,
      sourceLanguageId: languageId,
      targetLanguageId: "en",
      context: input.history.map((m) => m.content).join("\n").slice(0, 2000),
    });
    translationCache.set(cacheKey, result.text);
    return result.text;
  };

  try {
    /* --------------------------- 1. translate in --------------------------- */
    let englishUserMessage = input.userMessage;
    if (!isEnglish) {
      yield {
        type: "stage",
        stage: "translate-input",
        message: `Translating from ${targetLanguage.name}…`,
      };
      try {
        englishUserMessage = await translateToEnglish(
          input.userMessage,
          targetLanguage.id,
        );
        translated.input = true;
      } catch (error) {
        // Degrade rather than fail: the reasoning model may still understand
        // the original text, and the reply is labelled honestly afterwards.
        englishUserMessage = input.userMessage;
        translated.input = false;
        yield {
          type: "stage",
          stage: "translate-input",
          message: `Could not translate from ${targetLanguage.name} (${
            error instanceof Error ? error.message : "unknown error"
          }). Continuing with your original text.`,
        };
      }
    }

    /* -------------------------- 2. build context -------------------------- */
    const contextMessages: PipelineMessage[] = [];
    for (const message of input.history) {
      if (message.role === "system") {
        contextMessages.push(message);
        continue;
      }
      let english: string;
      try {
        english = await translateToEnglish(message.content, targetLanguage.id);
      } catch {
        english = message.content;
      }
      contextMessages.push({ role: message.role, content: english });
    }
    contextMessages.push({ role: "user", content: englishUserMessage });

    /* ----------------------------- 3. reason ------------------------------ */
    yield {
      type: "stage",
      stage: "reasoning",
      message: "Thinking…",
    };

    const startedAt = Date.now();
    let englishAnswer = "";
    let reasoningModel: string | undefined;
    let tokensUsed: number | undefined;

    for await (const chunk of reasoning.stream(
      {
        messages: contextMessages,
        system: deps.systemPrompt ?? SAMIATI_SYSTEM_PROMPT,
        outputLanguageId: targetLanguage.id,
      },
      input.signal,
    )) {
      if (chunk.delta) {
        englishAnswer += chunk.delta;
        yield { type: "delta", text: chunk.delta, stage: "reasoning" };
      }
      if (chunk.model) reasoningModel = chunk.model;
      if (typeof chunk.tokensUsed === "number") tokensUsed = chunk.tokensUsed;
    }

    /* -------------------------- 4. translate out -------------------------- */
    let finalText = englishAnswer;
    if (!isEnglish && englishAnswer.trim()) {
      yield {
        type: "stage",
        stage: "translate-output",
        message: `Translating into ${targetLanguage.name}…`,
      };
      try {
        const output = await translation.translate({
          text: englishAnswer,
          sourceLanguageId: "en",
          targetLanguageId: targetLanguage.id,
          context: englishUserMessage,
        });
        finalText = output.text;
        translated.output = true;
        if (output.text) {
          yield { type: "delta", text: output.text, stage: "translation" };
        }
      } catch (error) {
        // Degrade honestly: deliver the English answer and say so in the
        // metadata so the UI can label it.
        finalText = englishAnswer;
        translated.output = false;
        yield {
          type: "stage",
          stage: "translate-output",
          message:
            error instanceof Error
              ? `Translation unavailable (${error.message}). Showing the English answer.`
              : "Translation unavailable. Showing the English answer.",
        };
      }
    }

    /* ------------------------------ 5. finish ----------------------------- */
    const route: PipelineRoute = translation.isMock
      ? "mock"
      : translated.output
        ? "translated"
        : "direct";

    const meta: MessageMeta = {
      pipeline: route,
      reasoningModel: reasoningModel ?? reasoning.defaultModel,
      translationModel: translation.isMock ? undefined : translation.label,
      reasoningLanguageId: "en",
      translated: translated.output,
      inputTranslated: translated.input,
      tokensUsed,
      latencyMs: Date.now() - startedAt,
    };

    yield {
      type: "final",
      text: finalText,
      languageId: targetLanguage.id,
      meta,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";
    yield { type: "error", message };
  }
}
