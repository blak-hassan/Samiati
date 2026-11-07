/**
 * Browser voice support.
 *
 * Samiati uses the Web Speech API for voice input and output. It is the only
 * option that works on a phone without downloading a model, which matters for
 * the bandwidth Samiati targets.
 *
 * The honest limits of the Web Speech API:
 *
 *  - It only recognises a limited set of locales. Languages without a
 *    standard BCP-47 tag — Kikuyu, Dholuo, Sheng and the rest — cannot be
 *    dictated by the browser, and Samiati says so rather than pretending.
 *  - Speech recognition is a live session, not a transcription of a recorded
 *    file. The `SpeechRecognitionService` interface models the latter, so the
 *    browser path lives here instead.
 */

/**
 * BCP-47 locales for the languages the browser actually supports.
 *
 * `null` means there is no standard tag, so dictation is not available for
 * that language in the browser.
 */
const VOICE_LOCALES: Readonly<Record<string, string | null>> = {
  en: "en-US",
  kiswahili: "sw-KE",
  // Sheng has no ISO code of its own; the closest standard tag is Kiswahili.
  sheng: "sw-KE",
  somali: "so-SO",
  kikuyu: null,
  luhya: null,
  dholuo: null,
  kamba: null,
  kalenjin: null,
  gusii: null,
  meru: null,
  maasai: null,
};

/** The BCP-47 locale to use for a language, or null if there is none. */
export function voiceLocale(languageId: string): string | null {
  return VOICE_LOCALES[languageId] ?? null;
}

/** True when the browser can recognise speech at all. */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const scope = window as unknown as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return Boolean(scope.SpeechRecognition ?? scope.webkitSpeechRecognition);
}

/** True when the browser can speak text aloud. */
export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.speechSynthesis !== "undefined"
  );
}

/** The languages that can be dictated in the browser right now. */
export function dictatableLanguages(): string[] {
  return Object.entries(VOICE_LOCALES)
    .filter(([, locale]) => locale !== null)
    .map(([languageId]) => languageId);
}

export interface DictationHandlers {
  /** Called with each partial result as the user speaks. */
  onPartial?: (text: string) => void;
  /** Called once when the user stops speaking. */
  onFinal?: (text: string) => void;
  /** Called when recognition fails or is unavailable. */
  onError?: (message: string) => void;
}

/**
 * The shape of the browser's SpeechRecognition object that Samiati uses.
 *
 * Declared locally so the class field and the constructor agree on a
 * non-nullable type.
 */
interface BrowserRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
}

/**
 * A live dictation session.
 *
 * The wrapper exists so the UI does not have to deal with the differences
 * between `SpeechRecognition` and `webkitSpeechRecognition`, or with the
 * fact that the API is not available at all on some browsers.
 */
export class BrowserDictation {
  private recognition: BrowserRecognition | null = null;

  private finalText = "";

  /** True when a session is running. */
  get isListening(): boolean {
    return this.recognition !== null;
  }

  /**
   * Starts dictation.
   *
   * Returns false when the browser does not support the language, so the UI
   * can explain why rather than failing silently.
   */
  start(languageId: string, handlers: DictationHandlers = {}): boolean {
    if (!isSpeechRecognitionSupported()) {
      handlers.onError?.(
        "This browser cannot recognise speech. Try Chrome or Edge, or type your message.",
      );
      return false;
    }

    const locale = voiceLocale(languageId);
    if (!locale) {
      handlers.onError?.(
        "Your browser cannot dictate in this language yet. Type your message instead — it will be translated the same way.",
      );
      return false;
    }

    this.stop();

    const scope = window as unknown as {
      SpeechRecognition?: new () => BrowserRecognition;
      webkitSpeechRecognition?: new () => BrowserRecognition;
    };
    const Recognition =
      scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
    if (!Recognition) return false;

    const recognition = new Recognition();
    recognition.lang = locale;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: unknown) => {
      const results = (
        event as { results?: ArrayLike<ArrayLike<{ transcript: string }>> }
      ).results;
      if (!results) return;

      let interim = "";
      for (let index = 0; index < results.length; index += 1) {
        const alternative = results[index]?.[0];
        if (!alternative) continue;
        if (index === results.length - 1) {
          this.finalText = alternative.transcript;
        } else {
          interim += alternative.transcript;
        }
      }

      handlers.onPartial?.(interim || this.finalText);
    };

    recognition.onerror = (event: unknown) => {
      const code = (event as { error?: string }).error ?? "unknown";
      handlers.onError?.(
        code === "not-allowed"
          ? "Microphone access was blocked. Allow it in your browser settings to dictate."
          : `Voice input failed (${code}). Type your message instead.`,
      );
    };

    recognition.onend = () => {
      this.recognition = null;
      if (this.finalText) handlers.onFinal?.(this.finalText);
    };

    this.recognition = recognition;
    this.finalText = "";

    try {
      recognition.start();
      return true;
    } catch {
      this.recognition = null;
      handlers.onError?.("Could not start voice input.");
      return false;
    }
  }

  /** Stops the session and keeps whatever was heard. */
  stop(): void {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch {
      // The session may already have ended.
    }
    this.recognition = null;
  }

  /** Aborts the session and discards the result. */
  abort(): void {
    if (!this.recognition) return;
    try {
      this.recognition.abort();
    } catch {
      // The session may already have ended.
    }
    this.recognition = null;
  }
}
/**
 * Speaks text aloud using the browser's speech synthesiser.
 *
 * Resolves when the utterance finishes, or when it is cancelled.
 */
export function speakText(
  text: string,
  languageId: string,
  options: { rate?: number; pitch?: number } = {},
): Promise<boolean> {
  if (!isSpeechSynthesisSupported() || !text.trim()) {
    return Promise.resolve(false);
  }

  const locale = voiceLocale(languageId) ?? "en-US";

  return new Promise<boolean>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    utterance.rate = options.rate ?? 1;
    utterance.pitch = options.pitch ?? 1;

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((entry) => entry.lang === locale);
    if (voice) utterance.voice = voice;

    utterance.onend = () => resolve(true);
    utterance.onerror = () => resolve(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}

/** Stops any speech that is currently playing. */
export function stopSpeaking(): void {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.cancel();
}
