import { describe, expect, it } from "vitest";

import {
  DEFAULT_LANGUAGE_ID,
  LANGUAGES,
  LANGUAGES_BY_ID,
  getLanguage,
  getLanguageOrDefault,
  isKnownLanguage,
  normalizeForSearch,
  orderLanguages,
  scoreLanguage,
  searchLanguages,
  SELECTABLE_LANGUAGES,
} from "@/lib/languages";
import { capabilityLabel, describeCapability } from "@/lib/languages/capability";
import { starterPrompts } from "@/lib/languages/starters";

describe("language registry", () => {
  it("contains every language Samiati promises to support", () => {
    const ids = LANGUAGES.map((language) => language.id);
    for (const required of [
      "kikuyu",
      "dholuo",
      "kiswahili",
      "sheng",
      "kamba",
      "luhya",
      "kalenjin",
      "somali",
      "gusii",
      "meru",
      "maasai",
    ]) {
      expect(ids).toContain(required);
    }
  });

  it("includes English as the pivot language of the pipeline", () => {
    expect(LANGUAGES_BY_ID.en).toBeDefined();
    expect(LANGUAGES_BY_ID.en?.iso).toBe("en");
  });

  it("uses unique, stable ids", () => {
    const ids = LANGUAGES.map((language) => language.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  it("gives every language the metadata the UI depends on", () => {
    for (const language of LANGUAGES) {
      expect(language.name.length).toBeGreaterThan(0);
      expect(language.nativeName.length).toBeGreaterThan(0);
      expect(language.region.length).toBeGreaterThan(0);
      expect(language.countries.length).toBeGreaterThan(0);
      expect(language.description.length).toBeGreaterThan(0);
      expect(language.greeting.length).toBeGreaterThan(0);
      expect(language.sample.length).toBeGreaterThan(0);
      expect(language.sampleTranslation.length).toBeGreaterThan(0);
      expect(["ltr", "rtl"]).toContain(language.direction);
      expect(["Latin", "Arabic"]).toContain(language.script);
      expect(["active", "beta", "planned"]).toContain(language.status);
      expect(language.translation).not.toBe("none");
      expect(language.voice).not.toBe("none");
    }
  });

  it("marks Sheng as a register of Kiswahili rather than a separate ISO language", () => {
    const sheng = LANGUAGES_BY_ID.sheng!;
    expect(sheng.registerOf).toBe("kiswahili");
    expect(sheng.iso).toBeUndefined();
  });

  it("resolves known, unknown and missing ids safely", () => {
    expect(getLanguage("kiswahili")?.name).toBe("Kiswahili");
    expect(getLanguage("does-not-exist")).toBeUndefined();
    expect(getLanguage(undefined)).toBeUndefined();
    expect(getLanguageOrDefault("does-not-exist").id).toBe(DEFAULT_LANGUAGE_ID);
    expect(isKnownLanguage("kikuyu")).toBe(true);
    expect(isKnownLanguage("klingon")).toBe(false);
  });

  it("only offers selectable languages in the selector", () => {
    expect(SELECTABLE_LANGUAGES.length).toBeGreaterThan(0);
    for (const language of SELECTABLE_LANGUAGES) {
      expect(language.status).not.toBe("planned");
    }
  });

  it("provides starter prompts for every language", () => {
    for (const language of LANGUAGES) {
      const prompts = starterPrompts(language.id);
      expect(prompts.length).toBeGreaterThan(0);
      for (const prompt of prompts) {
        expect(prompt.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe("language search", () => {
  it("matches a language by its id", () => {
    const results = searchLanguages("kikuyu");
    expect(results[0]?.language.id).toBe("kikuyu");
  });

  it("matches a language by its ISO code", () => {
    const results = searchLanguages("sw");
    expect(results[0]?.language.id).toBe("kiswahili");
  });

  it("ignores diacritics so 'gikuyu' finds 'Gĩkũyũ'", () => {
    const results = searchLanguages("gikuyu");
    expect(results[0]?.language.id).toBe("kikuyu");
  });

  it("normalises diacritics and case", () => {
    expect(normalizeForSearch("Gĩkũyũ")).toBe("gikuyu");
    expect(normalizeForSearch("  Kiswahili  ")).toBe("kiswahili");
  });

  it("finds languages by region", () => {
    const results = searchLanguages("nyanza");
    const ids = results.map((result) => result.language.id);
    expect(ids).toContain("dholuo");
    expect(ids).toContain("gusii");
  });

  it("returns nothing for a query that matches nothing", () => {
    expect(searchLanguages("zzzznotalanguage")).toHaveLength(0);
  });

  it("returns the whole registry in canonical order for an empty query", () => {
    const results = searchLanguages("");
    expect(results).toHaveLength(LANGUAGES.length);
    expect(results[0]?.language.id).toBe(LANGUAGES[0]!.id);
  });

  it("scores an exact id higher than a partial name match", () => {
    const exact = scoreLanguage(LANGUAGES_BY_ID.sheng!, "sheng");
    const partial = scoreLanguage(LANGUAGES_BY_ID.sheng!, "sh");
    expect(exact).toBeGreaterThan(partial);
  });

  it("pins favourites to the top of the ordered list", () => {
    const ordered = orderLanguages(LANGUAGES, {
      favorites: ["maasai"],
      recent: ["meru"],
    });
    expect(ordered[0]?.id).toBe("maasai");
    expect(ordered[1]?.id).toBe("meru");
  });
});

describe("capability descriptors", () => {
  it("describes every capability level", () => {
    for (const level of ["full", "beta", "limited", "planned", "none"] as const) {
      expect(capabilityLabel(level).length).toBeGreaterThan(0);
      expect(describeCapability(level).description.length).toBeGreaterThan(0);
    }
  });

  it("does not claim full coverage for languages that lack it", () => {
    const limited = LANGUAGES.filter((l) => l.translation === "limited");
    expect(limited.length).toBeGreaterThan(0);
    for (const language of limited) {
      expect(language.translation).not.toBe("full");
    }
  });
});
