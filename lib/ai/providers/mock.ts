import { getLanguageOrDefault } from "@/lib/languages";

import type {
  LanguageDetection,
  ReasoningChunk,
  ReasoningRequest,
  ReasoningService,
  TranslationRequest,
  TranslationResult,
  TranslationService,
} from "../types";

/**
 * The built-in demo providers.
 *
 * These exist so Samiati is fully explorable with no API keys, no accounts
 * and no network. They are **not** translation or reasoning models:
 *
 *  - The mock translator returns the source text unchanged and flags the
 *    result as mock.
 *  - The mock reasoner returns a fixed, clearly-labelled demo response.
 *
 * Every response that passes through them carries `isMock: true`, and the UI
 * surfaces that fact to the user.
 */

const DEMO_DISCLAIMER =
  "**Demo mode.** Samiati has no AI model connected yet, so this reply was produced by the built-in placeholder provider — no language model wrote it.";

export class MockTranslationService implements TranslationService {
  readonly id = "mock";
  readonly label = "Demo translator (no model connected)";
  readonly isMock = true;
  readonly supportedLanguageIds = ["en"] as const;

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    return {
      text: request.text,
      provider: this.id,
      isMock: true,
      confidence: 0,
    };
  }

  async detectLanguage(text: string): Promise<LanguageDetection> {
    return { languageId: "en", confidence: 0, isMock: true };
  }
}

/**
 * A very small heuristic detector.
 *
 * It looks for characters and function words that are characteristic of the
 * languages Samiati supports. It is intentionally conservative: when nothing
 * matches it returns English with zero confidence rather than guessing.
 */
export class HeuristicLanguageDetector {
  private static readonly SIGNALS: ReadonlyArray<{
    languageId: string;
    characters?: string;
    words?: string[];
  }> = [
    { languageId: "kikuyu", characters: "ĩũũĩĩŋũ", words: ["ndia", "rĩrĩa", "mũthenya"] },
    { languageId: "kamba", characters: "ĩũ", words: ["mũkũ", "kĩmũa", "ũthe"] },
    { languageId: "somali", words: ["ah", "ee", "ah", "ku", "la", "oo"] },
    { languageId: "kiswahili", words: ["kwa", "ni", "wa", "na", "katika", "habari"] },
    { languageId: "dholuo", words: ["kik", "odiero", "gi", "kendo", "tinde"] },
    { languageId: "luhya", words: ["khwats", "shik", "mikh", "khu"] },
    { languageId: "gusii", words: ["egesaku", "totu", "ama", "kebwo"] },
    { languageId: "meru", words: ["mũrī", "mbaa", "kĩrĩ"] },
    { languageId: "maasai", words: ["inka", "olkejutu", "sopa"] },
  ];

  detect(text: string): LanguageDetection {
    const haystack = ` ${text.toLowerCase()} `;

    for (const signal of HeuristicLanguageDetector.SIGNALS) {
      if (signal.characters) {
        const matched = [...signal.characters].some((character) =>
          haystack.includes(character),
        );
        if (matched) {
          return { languageId: signal.languageId, confidence: 0.6, isMock: true };
        }
      }

      if (signal.words) {
        const matched = signal.words.some((word) =>
          haystack.includes(` ${word} `),
        );
        if (matched) {
          return { languageId: signal.languageId, confidence: 0.55, isMock: true };
        }
      }
    }

    return { languageId: "en", confidence: 0.2, isMock: true };
  }
}

/**
 * The placeholder reasoner.
 *
 * It produces a short, informative demo reply that:
 *  1. greets the user in their own language (using the registry),
 *  2. states plainly that no model is connected,
 *  3. points at the parts of Samiati that already work.
 */
export class MockReasoningService implements ReasoningService {
  readonly id = "mock";
  readonly label = "Demo reasoner (no model connected)";
  readonly isMock = true;
  readonly defaultModel = "samiati-demo";

  async *stream(request: ReasoningRequest): AsyncGenerator<ReasoningChunk> {
    const language = getLanguageOrDefault(request.outputLanguageId);
    const lastUserMessage = [...request.messages]
      .reverse()
      .find((message) => message.role === "user");

    const body = [
      `${language.greeting} — ${language.sample}`,
      "",
      DEMO_DISCLAIMER,
      "",
      "To get real answers:",
      "",
      "1. Copy `.env.example` to `.env.local`.",
      "2. Add a reasoning model key and a translation model key.",
      "3. Restart the dev server — Samiati picks the providers up automatically.",
      "",
      "Everything else already works:",
      "",
      "- **Discover** — African news and knowledge, ready to discuss.",
      "- **Changa** — contribute translations that make Samiati better at your language.",
      "- **Communities** — talk with speakers of your language.",
      "",
      lastUserMessage
        ? `You wrote: “${lastUserMessage.content.slice(0, 160)}” — a connected model would answer that in ${language.name}.`
        : "Ask a question and a connected model would answer it in your language.",
    ].join("\n");

    // Stream the reply in small pieces so the UI's streaming path is exercised
    // identically in demo mode and in production.
    const pieces = body.match(/[\s\S]{1,24}/g) ?? [body];
    for (const piece of pieces) {
      yield { delta: piece, provider: this.id, model: this.defaultModel };
      await new Promise((resolve) => setTimeout(resolve, 12));
    }

    yield { delta: "", done: true, provider: this.id, model: this.defaultModel };
  }
}
