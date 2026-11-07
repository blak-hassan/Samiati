/**
 * Samiati language registry — type definitions.
 *
 * The registry is the single source of truth for every language the product
 * knows about. Nothing outside `lib/languages` should hardcode a language id,
 * display name or availability flag.
 */

/**
 * How well a capability (translation, voice) is supported for a language.
 *
 * `none`     — not supported and not planned for the current cycle.
 * `planned`  — on the roadmap but not implemented yet.
 * `limited`  — partial coverage; usable, but users should expect gaps.
 * `beta`     — broadly usable, quality is being improved.
 * `full`     — mature coverage.
 */
export type CapabilityLevel = "none" | "planned" | "limited" | "beta" | "full";

/** Lifecycle of a language inside Samiati. */
export type LanguageStatus = "active" | "beta" | "planned";

export type TextDirection = "ltr" | "rtl";

export type ScriptName = "Latin" | "Arabic";

/**
 * Cultural visual motif. Reserved for the "future cultural visual
 * representation" requirement — each language maps to an abstract motif so the
 * UI can carry a subtle, non-stereotypical visual identity.
 */
export type CulturalMotif =
  | "acacia"
  | "beadwork"
  | "calabash"
  | "embroidery"
  | "geometry"
  | "kente"
  | "maasai-shuka"
  | "maze"
  | "shield"
  | "weave";

export interface SamiatiLanguage {
  /** Stable, permanent identifier. Never renamed — it is persisted in the DB. */
  id: string;
  /** English display name, e.g. "Kikuyu". */
  name: string;
  /** Endonym — the language's name in the language itself, e.g. "Gĩkũyũ". */
  nativeName: string;
  /** ISO 639-1 code where one exists (e.g. "sw"). */
  iso?: string;
  /** ISO 639-3 code where no 639-1 code exists (e.g. "ggc"). */
  iso3?: string;
  /**
   * When this "language" is really a register or dialect of another entry.
   * Sheng, for example, is an urban sociolect of Kiswahili.
   */
  registerOf?: string;
  /** Primary region, e.g. "Central Kenya". */
  region: string;
  /** Countries where the language is primarily spoken. */
  countries: string[];
  /** Dialect / variety notes shown in the language selector. */
  dialect?: string;
  /** One-line description shown under the language name. */
  description: string;
  direction: TextDirection;
  script: ScriptName;
  translation: CapabilityLevel;
  voice: CapabilityLevel;
  status: LanguageStatus;
  motif: CulturalMotif;
  /** Tailwind text colour class used for the language accent chip. */
  accentClass: string;
  /** A greeting in the language, used on empty states and the onboarding step. */
  greeting: string;
  /** A short sample phrase in the language. */
  sample: string;
  /** The English meaning of {@link sample}. */
  sampleTranslation: string;
}

/** A language paired with a runtime-computed relevance score (search). */
export interface ScoredLanguage {
  language: SamiatiLanguage;
  score: number;
}
