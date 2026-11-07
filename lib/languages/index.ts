import { LANGUAGES } from "./registry";
import type { SamiatiLanguage, ScoredLanguage } from "./types";

export * from "./registry";
export * from "./types";

/**
 * Normalises a string for search: lower-cased and stripped of diacritics.
 *
 * This matters for Samiati specifically — "Gĩkũyũ" must be findable when a
 * user types "gikuyu", and "Kiswahili" under "kiswahili".
 */
export function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

/**
 * Scores a language against a search query.
 *
 * Returns 0 when there is no match. Higher scores are better matches:
 *  - 100  exact id / iso code
 *  -  90  exact display name or native name
 *  -  70  display name starts with the query
 *  -  55  word inside the display name
 *  -  40  match in the description, region or dialect
 *  -  25  match in the native name
 */
export function scoreLanguage(
  language: SamiatiLanguage,
  rawQuery: string,
): number {
  const query = normalizeForSearch(rawQuery);
  if (!query) return 0;

  const id = normalizeForSearch(language.id);
  const iso = normalizeForSearch(language.iso ?? "");
  const iso3 = normalizeForSearch(language.iso3 ?? "");
  const name = normalizeForSearch(language.name);
  const nativeName = normalizeForSearch(language.nativeName);

  if (id === query || iso === query || iso3 === query) return 100;
  if (name === query || nativeName === query) return 90;
  if (name.startsWith(query) || nativeName.startsWith(query)) return 70;
  if (name.split(/\s+/).includes(query)) return 55;

  const haystack = normalizeForSearch(
    [language.description, language.region, language.dialect ?? ""].join(" "),
  );
  if (haystack.includes(query)) return 40;

  if (nativeName.includes(query)) return 25;

  return 0;
}

/**
 * Searches the language registry.
 *
 * When the query is empty the registry is returned in its canonical order so
 * the selector always shows the same default list.
 */
export function searchLanguages(
  query: string,
  options: { limit?: number } = {},
): ScoredLanguage[] {
  const trimmed = query.trim();

  if (!trimmed) {
    return LANGUAGES.map((language) => ({ language, score: 0 }));
  }

  const results: ScoredLanguage[] = [];
  for (const language of LANGUAGES) {
    const score = scoreLanguage(language, trimmed);
    if (score > 0) results.push({ language, score });
  }

  results.sort((a, b) => b.score - a.score || a.language.name.localeCompare(b.language.name));

  return options.limit ? results.slice(0, options.limit) : results;
}

/**
 * Orders languages for the selector: favourites first, then recently used,
 * then the registry's canonical order.
 */
export function orderLanguages(
  languages: readonly SamiatiLanguage[],
  options: { favorites?: readonly string[]; recent?: readonly string[] } = {},
): SamiatiLanguage[] {
  const favorites = new Set(options.favorites ?? []);
  const recent = new Set(options.recent ?? []);
  const rank = (language: SamiatiLanguage) => {
    if (favorites.has(language.id)) return 0;
    if (recent.has(language.id)) return 1;
    return 2;
  };

  return [...languages].sort((a, b) => rank(a) - rank(b));
}
