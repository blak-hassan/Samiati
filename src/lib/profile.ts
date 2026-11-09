import { LanguageSkill } from '@/types';

/**
 * The fields a profile can be updated with.
 *
 * These mirror the `updateProfile` Convex mutation, which enforces the same
 * limits server-side.
 */
export interface ProfilePatch {
  name?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  culturalBackground?: string;
  languages?: LanguageSkill[];
}

/** Server-side limits, mirrored here so the form can validate before saving. */
export const PROFILE_FIELD_LIMITS = {
  name: 100,
  bio: 500,
  location: 200,
} as const;

/** The editable profile fields, used by the settings catalogue and the form. */
export const PROFILE_FIELDS = [
  'name',
  'bio',
  'avatar',
  'location',
  'culturalBackground',
  'languages',
] as const satisfies readonly (keyof ProfilePatch)[];

export type ProfileField = (typeof PROFILE_FIELDS)[number];
