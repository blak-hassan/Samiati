import { LanguageSkill } from '@/types';

/**
 * Shared language vocabulary.
 *
 * The profile, the edit-profile screen and the manage-languages screen all
 * used to describe proficiency differently — the edit screen offered
 * "Beginner / Intermediate / Fluent" while the data model stores
 * "Learning / Conversational / Fluent / Native". That mismatch made the
 * proficiency icon in `ProfileScreen` fall through to a seedling for every
 * language. This module is the single source of truth.
 */

export type LanguageLevel = LanguageSkill['level'];

export const LANGUAGE_LEVELS: LanguageLevel[] = [
  'Learning',
  'Conversational',
  'Fluent',
  'Native',
];

export interface LanguageLevelMeta {
  label: string;
  /** Progress percentage used for the profile progress bars. */
  percent: number;
  icon: string;
  description: string;
}

export const LANGUAGE_LEVEL_META: Record<LanguageLevel, LanguageLevelMeta> = {
  Learning: {
    label: 'Learning',
    percent: 25,
    icon: '🌱',
    description: 'I am starting out and still building vocabulary.',
  },
  Conversational: {
    label: 'Conversational',
    percent: 50,
    icon: '💬',
    description: 'I can hold a basic conversation.',
  },
  Fluent: {
    label: 'Fluent',
    percent: 75,
    icon: '🗣️',
    description: 'I can speak comfortably and naturally.',
  },
  Native: {
    label: 'Native',
    percent: 100,
    icon: '⭐',
    description: 'This is my first language.',
  },
};

/**
 * The proficiency icon for a stored level.
 *
 * Falls back to the seedling for unknown values, but every level the data
 * model can actually store now resolves to its own icon.
 */
export function getLanguageLevelIcon(level: string): string {
  const meta = LANGUAGE_LEVEL_META[level as LanguageLevel];
  return meta?.icon ?? LANGUAGE_LEVEL_META.Learning.icon;
}

/** The progress percentage for a stored level. */
export function getLanguagePercent(level: string): number {
  const meta = LANGUAGE_LEVEL_META[level as LanguageLevel];
  return meta?.percent ?? LANGUAGE_LEVEL_META.Learning.percent;
}

/**
 * Languages the user can list on their profile.
 *
 * These are the languages the translation models support, and they double as
 * the cultural backgrounds a user can pick from.
 */
export const AVAILABLE_LANGUAGES: string[] = [
  'English',
  'Swahili',
  'Kikuyu',
  'Luo',
  'Kamba',
  'Kalenjin',
  'Luhya',
  'Meru',
  'Maasai',
];

/** Cultural backgrounds offered when editing a profile. */
export const CULTURAL_BACKGROUNDS: string[] = AVAILABLE_LANGUAGES;

/** The languages a new profile starts with. */
export const DEFAULT_LANGUAGE_SKILL: LanguageSkill = {
  id: 'en',
  name: 'English',
  level: 'Fluent',
  percent: LANGUAGE_LEVEL_META.Fluent.percent,
};
