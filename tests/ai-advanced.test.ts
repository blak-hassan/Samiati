import { describe, expect, it } from "vitest";

import {
  SentenceWindow,
  isTerminatedSentence,
  splitSentences,
} from "@/lib/ai/sentence-window";
import { dictatableLanguages, voiceLocale } from "@/lib/ai/browser-voice";
import { RoutedTranslationService, buildTranslationRoutes } from "@/lib/ai/router";
import type { TranslationRequest, TranslationService } from "@/lib/ai/types";

describe("sentence window", () => {
  it("releases a sentence once it is complete", () => {
    const window = new SentenceWindow();
    expect(window.push("Hello there. How are ")).toEqual(["Hello there. "]);
    expect(window.push("you? ")).toEqual(["How are you? "]);
  });

  it("keeps the separator so the sentences rejoin exactly", () => {
    const text = "One. Two! Three?";
    const window = new SentenceWindow();
    const released = window.push(text);
    expect(released.join("") + window.flush().join("")).toBe(text);
  });

  it("holds back a fragment that is too short", () => {
    const window = new SentenceWindow();
    expect(window.push("Hi. ")).toEqual([]);
    expect(window.flush()).toEqual(["Hi."]);
  });

  it("does not split on an abbreviation", () => {
    const window = new SentenceWindow();
    expect(window.push("Dr. Smith arrived late. ")).toEqual([
      "Dr. Smith arrived late. ",
    ]);
  });

  it("does not split on a decimal number", () => {
    expect(isTerminatedSentence("It costs 3.50")).toBe(false);
  });

  it("does not split on a single initial", () => {
    expect(isTerminatedSentence("Signed by J.")).toBe(false);
  });

  it("splits a full text into sentences", () => {
    expect(
      splitSentences("One. Two! Three? Four without a stop"),
    ).toEqual(["One.", "Two!", "Three?", "Four without a stop"]);
  });

  it("reports when nothing is pending", () => {
    const window = new SentenceWindow();
    window.push("Something complete here. ");
    expect(window.isEmpty).toBe(true);
  });
});

describe("voice locales", () => {
  it("maps the languages the browser can speak", () => {
    expect(voiceLocale("kiswahili")).toBe("sw-KE");
    expect(voiceLocale("somali")).toBe("so-SO");
    expect(voiceLocale("en")).toBe("en-US");
  });

  it("uses the closest standard tag for Sheng", () => {
    expect(voiceLocale("sheng")).toBe("sw-KE");
  });

  it("returns null for languages with no standard tag", () => {
    expect(voiceLocale("kikuyu")).toBeNull();
    expect(voiceLocale("dholuo")).toBeNull();
    expect(voiceLocale("maasai")).toBeNull();
  });

  it("lists only the languages that can be dictated", () => {
    const languages = dictatableLanguages();
    expect(languages).toContain("kiswahili");
    expect(languages).not.toContain("kikuyu");
  });
});

/** A translation service that records what it was asked to translate. */
class FakeService implements TranslationService {
  readonly id: string;
  readonly label: string;
  readonly isMock = false;
  readonly supportedLanguageIds: readonly string[];
  calls: TranslationRequest[] = [];

  constructor(id: string, languages: string[]) {
    this.id = id;
    this.label = id;
    this.supportedLanguageIds = languages;
  }

  async translate(request: TranslationRequest) {
    this.calls.push(request);
    return {
      text: `${request.targetLanguageId}:${request.text}`,
      provider: this.id,
      isMock: false,
    };
  }

  async detectLanguage() {
    return { languageId: "en", confidence: 1, isMock: false };
  }
}

describe("translation routing", () => {
  it("prefers a dedicated route over the general one", async () => {
    const dedicated = new FakeService("kiswahili-model", ["kiswahili", "en"]);
    const general = new FakeService("general", ["en", "kiswahili", "kikuyu"]);

    const router = buildTranslationRoutes({
      general,
      dedicated: { kiswahili: dedicated },
    });

    const result = await router.translate({
      text: "Habari",
      sourceLanguageId: "en",
      targetLanguageId: "kiswahili",
    });

    expect(dedicated.calls).toHaveLength(1);
    expect(general.calls).toHaveLength(0);
    expect(result.provider).toBe("routed:dedicated-kiswahili");
  });

  it("falls back to the general route", async () => {
    const general = new FakeService("general", ["en", "kikuyu"]);
    const router = buildTranslationRoutes({ general });

    await router.translate({
      text: "Habari",
      sourceLanguageId: "en",
      targetLanguageId: "kikuyu",
    });

    expect(general.calls).toHaveLength(1);
  });

  it("refuses a pair no route covers", async () => {
    // The general route always covers every language, so a gap can only
    // appear in a hand-built router.
    const limited = new FakeService("limited", ["en"]);
    const router = new RoutedTranslationService([
      { id: "limited", label: "limited", service: limited, languages: ["en"] },
    ]);

    await expect(
      router.translate({
        text: "Habari",
        sourceLanguageId: "en",
        targetLanguageId: "maasai",
      }),
    ).rejects.toThrow(/no translation route/i);
  });

  it("reports whether it is a mock", () => {
    const router = new RoutedTranslationService([]);
    expect(router.isMock).toBe(true);
  });
});
