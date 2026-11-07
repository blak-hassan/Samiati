import type { SamiatiLanguage } from "./types";

/**
 * The Samiati language registry.
 *
 * Ordering is deliberate: it is the default display order of the language
 * selector (most-resourced / most-spoken first, so the common case is one
 * tap away).
 *
 * Coverage notes — Samiati must never imply that every language has equal
 * model support. The `translation` and `voice` levels below are surfaced in
 * the UI so users set accurate expectations before they start a conversation.
 */
export const LANGUAGES: readonly SamiatiLanguage[] = [
  {
    id: "kiswahili",
    name: "Kiswahili",
    nativeName: "Kiswahili",
    iso: "sw",
    region: "East Africa",
    countries: ["Kenya", "Tanzania", "Uganda", "DRC", "Somalia", "Comoros"],
    dialect: "Standard Swahili (Kiswahili sanifu) as used in Kenya and Tanzania",
    description:
      "The most widely spoken language in East Africa and the best-resourced in Samiati.",
    direction: "ltr",
    script: "Latin",
    translation: "full",
    voice: "beta",
    status: "active",
    motif: "geometry",
    accentClass: "text-bronze-600 dark:text-bronze-300",
    greeting: "Karibu",
    sample: "Habari za asubuhi",
    sampleTranslation: "Good morning",
  },
  {
    id: "en",
    name: "English",
    nativeName: "English",
    iso: "en",
    region: "International",
    countries: ["Global"],
    dialect: "International English",
    description:
      "The pivot language of Samiati's pipeline, and available for everyday use.",
    direction: "ltr",
    script: "Latin",
    translation: "full",
    voice: "beta",
    status: "active",
    motif: "shield",
    accentClass: "text-espresso-500 dark:text-sand-200",
    greeting: "Welcome",
    sample: "Good morning",
    sampleTranslation: "Good morning",
  },
  {
    id: "sheng",
    name: "Sheng",
    nativeName: "Sheng",
    registerOf: "kiswahili",
    region: "Kenyan cities",
    countries: ["Kenya"],
    dialect:
      "Urban sociolect mixing Kiswahili with English and local slang; not standardised",
    description:
      "The everyday language of Kenyan cities — and the one Samiati helps write most.",
    direction: "ltr",
    script: "Latin",
    translation: "beta",
    voice: "limited",
    status: "active",
    motif: "beadwork",
    accentClass: "text-clay-500 dark:text-clay-400",
    greeting: "Poa",
    sample: "Mambo, mzee? Ukifika vipi?",
    sampleTranslation: "Hey, how are you? Did you arrive well?",
  },
  {
    id: "kikuyu",
    name: "Kikuyu",
    nativeName: "Gĩkũyũ",
    iso: "ki",
    region: "Central Kenya",
    countries: ["Kenya"],
    dialect: "Kiambu, Murang'a, Nyeri, Embu and Machakos varieties",
    description:
      "The Gĩkũyũ language of the Kikuyu people, spoken across Central Kenya.",
    direction: "ltr",
    script: "Latin",
    translation: "beta",
    voice: "limited",
    status: "active",
    motif: "maze",
    accentClass: "text-espresso-500 dark:text-bronze-300",
    greeting: "Karibu",
    sample: "Ũtukũ wa njoki rĩrĩa?",
    sampleTranslation: "How is the morning sun?",
  },
  {
    id: "luhya",
    name: "Luhya",
    nativeName: "Luhya",
    iso: "luy",
    region: "Western Kenya",
    countries: ["Kenya", "Uganda"],
    dialect:
      "Bukusu, Maragoli, Tacholi, Kabras, Mumias, Samia and other sub-varieties",
    description:
      "A cluster of closely related Bantu languages of Western Kenya and Uganda.",
    direction: "ltr",
    script: "Latin",
    translation: "limited",
    voice: "limited",
    status: "active",
    motif: "weave",
    accentClass: "text-espresso-600 dark:text-sand-200",
    greeting: "Karibu",
    sample: "Amakuru asuube?",
    sampleTranslation: "Is there news for the morning?",
  },
  {
    id: "dholuo",
    name: "Dholuo",
    nativeName: "Dholuo",
    iso3: "luo",
    region: "Nyanza, Western Kenya",
    countries: ["Kenya", "Uganda"],
    dialect: "Western Nyanza Luo varieties",
    description:
      "The Luo language of Nyanza, spoken by the Dholuo people of Kenya and Uganda.",
    direction: "ltr",
    script: "Latin",
    translation: "beta",
    voice: "limited",
    status: "active",
    motif: "shield",
    accentClass: "text-clay-600 dark:text-clay-400",
    greeting: "Rap",
    sample: "Yamo thoth?",
    sampleTranslation: "How is the family?",
  },
  {
    id: "somali",
    name: "Somali",
    nativeName: "Soomaali",
    iso: "so",
    region: "Horn of Africa",
    countries: ["Somalia", "Somaliland", "Djibouti", "Ethiopia", "Kenya"],
    dialect: "Northern (Benadir, Galguduud, Puntland) and Southern varieties",
    description:
      "A major language of the Horn of Africa, with strong speech recognition support.",
    direction: "ltr",
    script: "Latin",
    translation: "beta",
    voice: "beta",
    status: "active",
    motif: "acacia",
    accentClass: "text-espresso-400 dark:text-sand-100",
    greeting: "Soo dhowow",
    sample: "Subax maanta ayey u roob tahay.",
    sampleTranslation: "The morning sun is pleasant.",
  },
  {
    id: "kamba",
    name: "Kamba",
    nativeName: "Kĩkamba",
    iso: "kam",
    region: "Eastern Kenya",
    countries: ["Kenya"],
    dialect: "Machakos, Makueni and Kitui varieties",
    description:
      "The language of the Kamba people of Eastern Kenya, rich in agricultural terms.",
    direction: "ltr",
    script: "Latin",
    translation: "limited",
    voice: "limited",
    status: "active",
    motif: "calabash",
    accentClass: "text-bronze-500 dark:text-bronze-300",
    greeting: "Karibu",
    sample: "Mũkũ wa kĩmũa?",
    sampleTranslation: "How is the work of the day?",
  },
  {
    id: "kalenjin",
    name: "Kalenjin",
    nativeName: "Kalenjin",
    iso: "kln",
    region: "Rift Valley, Kenya",
    countries: ["Kenya"],
    dialect: "Kipsigis, Tugen, Nandi and related varieties",
    description:
      "The Kalenjin languages of Kenya's Rift Valley, home of the Kipsigis.",
    direction: "ltr",
    script: "Latin",
    translation: "limited",
    voice: "limited",
    status: "active",
    motif: "embroidery",
    accentClass: "text-espresso-700 dark:text-bronze-400",
    greeting: "Chebo",
    sample: "Tum Chebo!",
    sampleTranslation: "Good afternoon!",
  },
  {
    id: "gusii",
    name: "Gusii",
    nativeName: "Ekegusii",
    iso3: "ggc",
    region: "Nyanza, Kenya",
    countries: ["Kenya"],
    dialect: "Kisii, Gucha and Suba varieties",
    description:
      "The Gusii language of Kisii County in the Nyanza highlands.",
    direction: "ltr",
    script: "Latin",
    translation: "limited",
    voice: "limited",
    status: "active",
    motif: "kente",
    accentClass: "text-clay-500 dark:text-sand-200",
    greeting: "Bwake",
    sample: "Egesaku kw'egakora?",
    sampleTranslation: "What is the plan for today?",
  },
  {
    id: "meru",
    name: "Meru",
    nativeName: "Kimeru",
    iso: "mer",
    region: "Eastern Kenya",
    countries: ["Kenya"],
    dialect: "Meru, Embu and Tharaka varieties",
    description:
      "The Kimeru language of the Meru people of Eastern Kenya's highlands.",
    direction: "ltr",
    script: "Latin",
    translation: "limited",
    voice: "limited",
    status: "active",
    motif: "acacia",
    accentClass: "text-espresso-600 dark:text-sand-300",
    greeting: "Karibu",
    sample: "Mũrī wa mwaci?",
    sampleTranslation: "How is the morning?",
  },
  {
    id: "maasai",
    name: "Maasai",
    nativeName: "Kimaasai",
    iso3: "mas",
    region: "Kenya and northern Tanzania",
    countries: ["Kenya", "Tanzania"],
    dialect: "Northern and Southern Maasai varieties",
    description:
      "The language of the Maasai people of the Great Rift Valley and Serengeti.",
    direction: "ltr",
    script: "Latin",
    translation: "limited",
    voice: "planned",
    status: "beta",
    motif: "maasai-shuka",
    accentClass: "text-clay-600 dark:text-clay-400",
    greeting: "Sopa",
    sample: "Sopa, enkai?",
    sampleTranslation: "Hello, how are you?",
  },
];

/** The language used when a user has not chosen one yet. */
export const DEFAULT_LANGUAGE_ID = "kiswahili";

/** Fast lookup by stable id. */
export const LANGUAGES_BY_ID: Readonly<Record<string, SamiatiLanguage>> =
  Object.freeze(
    Object.fromEntries(LANGUAGES.map((language) => [language.id, language])),
  );

/** All languages the user can actually select right now (active + beta). */
export const SELECTABLE_LANGUAGES = LANGUAGES.filter(
  (language) => language.status !== "planned",
);

/**
 * Returns the language for an id, or `undefined` when the id is unknown.
 * Never throws — an unknown id usually means stale persisted data.
 */
export function getLanguage(
  id: string | undefined | null,
): SamiatiLanguage | undefined {
  if (!id) return undefined;
  return LANGUAGES_BY_ID[id];
}

/** Returns the language for an id, falling back to the default language. */
export function getLanguageOrDefault(
  id: string | undefined | null,
): SamiatiLanguage {
  return getLanguage(id) ?? LANGUAGES_BY_ID[DEFAULT_LANGUAGE_ID]!;
}

/** True when the id refers to a language Samiati knows about. */
export function isKnownLanguage(id: string): boolean {
  return id in LANGUAGES_BY_ID;
}
