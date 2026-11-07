/**
 * Samiati AI service contracts.
 *
 * The application never talks to a model provider directly. Everything goes
 * through these four interfaces, so a provider can be swapped without
 * touching the UI or the data layer:
 *
 *   TranslationService          — language ↔ language translation
 *   ReasoningService            — the model that actually thinks
 *   SpeechRecognitionService    — speech → text
 *   SpeechSynthesisService      — text → speech
 *
 * Providers report `isMock` so the UI can be honest with the user about
 * whether a reply came from a real model.
 */

export type LanguageCode = string;

export interface TranslationRequest {
  text: string;
  /** Stable Samiati language id, or "en" for English. */
  sourceLanguageId: LanguageCode;
  targetLanguageId: LanguageCode;
  /** Surrounding conversation, used to disambiguate short phrases. */
  context?: string;
}

export interface TranslationResult {
  text: string;
  /** Provider identifier, e.g. "mock" or "huggingface". */
  provider: string;
  /** Model identifier when the provider exposes one. */
  model?: string;
  /** 0–1 confidence when the provider can report it. */
  confidence?: number;
  /** True when the result was produced by the built-in mock provider. */
  isMock: boolean;
}

export interface LanguageDetection {
  languageId: LanguageCode;
  confidence: number;
  isMock: boolean;
}

export interface TranslationService {
  readonly id: string;
  readonly label: string;
  readonly isMock: boolean;
  /** Languages this provider can actually translate between. */
  readonly supportedLanguageIds: readonly LanguageCode[];
  translate(request: TranslationRequest): Promise<TranslationResult>;
  detectLanguage(text: string): Promise<LanguageDetection>;
}

export type ReasoningRole = "system" | "user" | "assistant";

export interface ReasoningMessage {
  role: ReasoningRole;
  content: string;
}

export interface ReasoningRequest {
  messages: ReasoningMessage[];
  system?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /**
   * The language the answer should be written in. The reasoning layer uses
   * this to decide whether it must translate, and the mock provider uses it
   * to greet the user in their own language.
   */
  outputLanguageId?: LanguageCode;
}

export interface ReasoningChunk {
  /** Incremental text produced by the model. */
  delta: string;
  /** Present on the final chunk. */
  done?: boolean;
  model?: string;
  provider?: string;
  tokensUsed?: number;
}

export interface ReasoningService {
  readonly id: string;
  readonly label: string;
  readonly isMock: boolean;
  readonly defaultModel: string;
  /** Yields incremental text. The caller decides how to persist it. */
  stream(
    request: ReasoningRequest,
    signal?: AbortSignal,
  ): AsyncGenerator<ReasoningChunk>;
}

export interface SpeechRecognitionResult {
  text: string;
  languageId: LanguageCode;
  confidence?: number;
  isMock: boolean;
}

export interface SpeechRecognitionService {
  readonly id: string;
  readonly label: string;
  readonly isMock: boolean;
  readonly supportedLanguageIds: readonly LanguageCode[];
  /** True when the browser's Web Speech API can be used. */
  readonly isBrowserSupported: boolean;
  transcribe(
    audio: Blob,
    languageId: LanguageCode,
  ): Promise<SpeechRecognitionResult>;
}

export interface SpeechSynthesisResult {
  /**
   * The rendered audio, when the provider produces a file. The browser
   * speech synthesiser speaks directly and produces no file.
   */
  audio?: Blob;
  /** True when the text was actually spoken. */
  spoken: boolean;
  isMock: boolean;
}

export interface SpeechSynthesisService {
  readonly id: string;
  readonly label: string;
  readonly isMock: boolean;
  readonly supportedLanguageIds: readonly LanguageCode[];
  /** True when the browser's SpeechSynthesis API can be used. */
  readonly isBrowserSupported: boolean;
  synthesize(
    text: string,
    languageId: LanguageCode,
  ): Promise<SpeechSynthesisResult>;
}
