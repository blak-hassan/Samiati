import {
  dictatableLanguages,
  isSpeechSynthesisSupported,
  speakText,
} from "../browser-voice";
import type {
  SpeechSynthesisResult,
  SpeechSynthesisService,
} from "../types";

/**
 * Speech output through the browser's own synthesiser.
 *
 * This is the right default for Samiati: it needs no model download, it
 * works offline, and it costs nothing. It only speaks the languages that have
 * a standard locale, which is stated in `supportedLanguageIds` so the UI can
 * be honest about it.
 */
export class WebSpeechSynthesisService implements SpeechSynthesisService {
  readonly id = "web-speech";
  readonly label = "Browser speech";
  readonly isMock = false;
  readonly supportedLanguageIds: readonly string[] = dictatableLanguages();
  readonly isBrowserSupported = isSpeechSynthesisSupported();

  async synthesize(
    text: string,
    languageId: string,
  ): Promise<SpeechSynthesisResult> {
    if (!this.supportedLanguageIds.includes(languageId)) {
      return { spoken: false, isMock: false };
    }

    const spoken = await speakText(text, languageId);
    return { spoken, isMock: false };
  }
}
