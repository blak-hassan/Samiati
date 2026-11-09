/**
 * Canonical settings schema for Samiati.
 *
 * Modelled on T3 Chat's settings architecture: one flat settings object with
 * documented defaults (`DEFAULT_UNIFIED_SETTINGS` in T3Chat), plus a
 * searchable catalogue of every individual setting (`settingsSearch.ts` in
 * T3Chat). The stable setting ids back the per-setting "reset to default"
 * affordance and let the settings search point at a specific row.
 *
 * Two scopes exist, mirroring T3Chat's scoped settings:
 *   - `device`  -> persisted in localStorage, per browser/device.
 *   - `account` -> persisted on the Convex `users` row, shared across devices.
 */

export const SETTINGS_STORAGE_KEY = 'samiati:settings:v1';

export type SettingsScope = 'device' | 'account' | 'profile';

export type ThemeMode = 'system' | 'light' | 'dark';
export type AccentColor = 'heritage' | 'rasta-red' | 'rasta-green' | 'rasta-gold';
export type TextSize = 'sm' | 'md' | 'lg' | 'xl';
export type ChatWidth = 'narrow' | 'default' | 'wide';
export type TimeFormat = '12h' | '24h';

export interface BlockedUser {
  id: string;
  name: string;
  handle: string;
  avatar: string;
}

/**
 * Device-scoped preferences. Everything here survives a refresh and is
 * restored on the next visit.
 */
export interface DeviceSettings {
  // Appearance
  theme: ThemeMode;
  accent: AccentColor;
  textSize: TextSize;
  chatWidth: ChatWidth;
  reduceMotion: boolean;
  highContrast: boolean;
  // Chat
  preferredLanguage: string;
  showTimestamps: boolean;
  timeFormat: TimeFormat;
  autoTranslate: boolean;
  sendOnEnter: boolean;
  // Data & media
  dataSaver: boolean;
  highQualityUploads: boolean;
  autoDownloadMedia: boolean;
  // Moderation
  mutedWords: string[];
  blockedUsers: BlockedUser[];
}

/**
 * Account-scoped preferences. These live on the Convex `users` row so they
 * follow the user between devices.
 */
export interface AccountSettings {
  notificationPreferences: {
    pauseAll: boolean;
    changa: boolean;
    moderation: boolean;
    sessions: boolean;
    emailDigest: boolean;
  };
  privacy: {
    profileVisible: boolean;
    showChanga: boolean;
    voiceDataAllowed: boolean;
    culturalDataAllowed: boolean;
  };
}

export type DeviceSettingKey = keyof DeviceSettings;

export const DEFAULT_DEVICE_SETTINGS: DeviceSettings = {
  theme: 'dark',
  accent: 'heritage',
  textSize: 'md',
  chatWidth: 'default',
  reduceMotion: false,
  highContrast: false,
  preferredLanguage: 'sw',
  showTimestamps: true,
  timeFormat: '24h',
  autoTranslate: true,
  sendOnEnter: true,
  dataSaver: false,
  highQualityUploads: true,
  autoDownloadMedia: true,
  mutedWords: [],
  blockedUsers: [],
};

export const DEFAULT_ACCOUNT_SETTINGS: AccountSettings = {
  notificationPreferences: {
    pauseAll: false,
    changa: true,
    moderation: true,
    sessions: true,
    emailDigest: false,
  },
  privacy: {
    profileVisible: false,
    showChanga: false,
    voiceDataAllowed: false,
    culturalDataAllowed: false,
  },
};

/** Human-readable labels for the option-style device settings. */
export const THEME_LABELS: Record<ThemeMode, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

export const ACCENT_LABELS: Record<AccentColor, string> = {
  heritage: 'Heritage Brown',
  'rasta-red': 'Rasta Red',
  'rasta-green': 'Rasta Green',
  'rasta-gold': 'Rasta Gold',
};

export const TEXT_SIZE_LABELS: Record<TextSize, string> = {
  sm: 'Small',
  md: 'Default',
  lg: 'Large',
  xl: 'Extra large',
};

export const CHAT_WIDTH_LABELS: Record<ChatWidth, string> = {
  narrow: 'Narrow',
  default: 'Default',
  wide: 'Wide',
};

export const TIME_FORMAT_LABELS: Record<TimeFormat, string> = {
  '12h': '12-hour',
  '24h': '24-hour',
};

/** CSS custom properties applied to <html> for the accent colour. */
export const ACCENT_VARS: Record<AccentColor, { accent: string; accentHover: string }> = {
  heritage: { accent: 'var(--heritage-action)', accentHover: 'var(--heritage-action-hover)' },
  'rasta-red': { accent: 'var(--red-action)', accentHover: 'var(--red-action-hover)' },
  'rasta-green': { accent: 'var(--green-action)', accentHover: 'var(--green-action-hover)' },
  'rasta-gold': { accent: 'var(--gold-action)', accentHover: 'var(--gold-action-hover)' },
};

/** Top-level groups used by the settings navigation rail and the search. */
export type SettingsSectionId =
  | 'appearance'
  | 'profile'
  | 'account'
  | 'notifications'
  | 'privacy'
  | 'data'
  | 'moderation'
  | 'languages'
  | 'support'
  | 'legal';

export interface SettingsSectionMeta {
  id: SettingsSectionId;
  title: string;
  description: string;
  path: string;
}

/**
 * The navigable settings areas, in the order they appear in the rail.
 * Mirrors the sectioned layout of T3Chat's settings page.
 */
export const SETTINGS_SECTIONS: SettingsSectionMeta[] = [
  {
    id: 'appearance',
    title: 'Appearance',
    description: 'Theme, accent colour, text size and layout',
    path: '/dashboard/settings/appearance',
  },
  {
    id: 'profile',
    title: 'Profile',
    description: 'Your name, bio, picture and languages',
    path: '/dashboard/edit-profile',
  },
  {
    id: 'account',
    title: 'Account',
    description: 'Email, password, two-factor authentication',
    path: '/dashboard/settings/account',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Push, email and in-app alerts',
    path: '/dashboard/settings/notifications',
  },
  {
    id: 'privacy',
    title: 'Privacy & Safety',
    description: 'Visibility, consent, blocked and muted accounts',
    path: '/dashboard/settings/privacy',
  },
  {
    id: 'data',
    title: 'Data & Storage',
    description: 'Data saver, media quality and exports',
    path: '/dashboard/settings/data',
  },
  {
    id: 'languages',
    title: 'Languages',
    description: 'The languages you are learning and contributing in',
    path: '/dashboard/settings/languages',
  },
  {
    id: 'support',
    title: 'Help & Support',
    description: 'FAQ, contact and feedback',
    path: '/dashboard/settings/help',
  },
  {
    id: 'legal',
    title: 'Legal',
    description: 'Privacy policy and terms of service',
    path: '/dashboard/privacy-policy',
  },
];

/**
 * Every route that can host a setting. The catalogue is validated against
 * this list by `tests/settings.test.ts`, so a renamed route can never leave
 * the settings search pointing at a 404.
 */
export const SETTINGS_ROUTES: string[] = [
  '/languages',
  '/dashboard/settings/appearance',
  '/dashboard/settings/account',
  '/dashboard/settings/notifications',
  '/dashboard/settings/privacy',
  '/dashboard/settings/data',
  '/dashboard/settings/muted',
  '/dashboard/settings/blocked',
  '/dashboard/settings/languages',
  '/dashboard/settings/help',
  '/dashboard/edit-profile',
  '/dashboard/profile',
  '/dashboard/privacy-policy',
  '/dashboard/terms-of-service',
];

export interface SettingsCatalogEntry {
  /** Stable id — also the DOM hook used to focus a row from search. */
  id: string;
  section: SettingsSectionId;
  title: string;
  description: string;
  /** Extra terms the settings search should match on. */
  keywords: string[];
  scope: SettingsScope;
  /** Key inside `DeviceSettings` (device scope) or the account settings group. */
  key: string;
  /** Route that owns this setting. */
  path: string;
}

/**
 * Every individual setting, in one searchable list. T3Chat keeps the same
 * thing in `settingsSearch.ts`; the ids are what the reset button and the
 * "changed" indicators key off.
 */
export const SETTINGS_CATALOG: SettingsCatalogEntry[] = [
  {
    id: 'languages.preferredLanguage',
    section: 'languages',
    title: 'Default chat language',
    description: 'Choose the language for new conversations on this device',
    keywords: ['language', 'chat', 'default', 'preferred'],
    scope: 'device',
    key: 'preferredLanguage',
    path: '/languages',
  },
  // --- Profile ----------------------------------------------------------
  {
    id: 'profile.name',
    section: 'profile',
    title: 'Full name',
    description: 'How your name appears across Samiati',
    keywords: ['display name', 'real name', 'username'],
    scope: 'profile',
    key: 'name',
    path: '/dashboard/edit-profile',
  },
  {
    id: 'profile.bio',
    section: 'profile',
    title: 'Bio',
    description: 'A short introduction for other members',
    keywords: ['about me', 'biography', 'description'],
    scope: 'profile',
    key: 'bio',
    path: '/dashboard/edit-profile',
  },
  {
    id: 'profile.avatar',
    section: 'profile',
    title: 'Profile picture',
    description: 'A link to the picture shown next to your name',
    keywords: ['photo', 'image', 'avatar', 'picture'],
    scope: 'profile',
    key: 'avatar',
    path: '/dashboard/edit-profile',
  },
  {
    id: 'profile.location',
    section: 'profile',
    title: 'Location',
    description: 'Where you are based',
    keywords: ['city', 'country', 'where i live'],
    scope: 'profile',
    key: 'location',
    path: '/dashboard/edit-profile',
  },
  {
    id: 'profile.culturalBackground',
    section: 'profile',
    title: 'Cultural background',
    description: 'The culture you most identify with',
    keywords: ['ethnicity', 'heritage', 'culture', 'community'],
    scope: 'profile',
    key: 'culturalBackground',
    path: '/dashboard/edit-profile',
  },
  {
    id: 'profile.languages',
    section: 'profile',
    title: 'My languages',
    description: 'The languages you speak and your level in each',
    keywords: ['proficiency', 'fluent', 'native', 'tongue'],
    scope: 'profile',
    key: 'languages',
    path: '/dashboard/settings/languages',
  },

  // --- Appearance -------------------------------------------------------
  {
    id: 'appearance.theme',
    section: 'appearance',
    title: 'Theme',
    description: 'Light, dark, or follow your system setting',
    keywords: ['dark mode', 'light mode', 'colour scheme', 'night'],
    scope: 'device',
    key: 'theme',
    path: '/dashboard/settings/appearance',
  },
  {
    id: 'appearance.accent',
    section: 'appearance',
    title: 'Accent colour',
    description: 'Highlight colour used across buttons and links',
    keywords: ['primary colour', 'brown', 'rasta', 'brand'],
    scope: 'device',
    key: 'accent',
    path: '/dashboard/settings/appearance',
  },
  {
    id: 'appearance.textSize',
    section: 'appearance',
    title: 'Text size',
    description: 'Scale type across the whole app',
    keywords: ['font size', 'typography', 'bigger text', 'accessibility'],
    scope: 'device',
    key: 'textSize',
    path: '/dashboard/settings/appearance',
  },
  {
    id: 'appearance.chatWidth',
    section: 'appearance',
    title: 'Chat width',
    description: 'How wide conversation bubbles and messages are allowed to grow',
    keywords: ['layout', 'column width', 'narrow', 'wide'],
    scope: 'device',
    key: 'chatWidth',
    path: '/dashboard/settings/appearance',
  },
  {
    id: 'appearance.reduceMotion',
    section: 'appearance',
    title: 'Reduce motion',
    description: 'Minimise animations and transitions',
    keywords: ['animation', 'accessibility', 'motion', 'transitions'],
    scope: 'device',
    key: 'reduceMotion',
    path: '/dashboard/settings/appearance',
  },
  {
    id: 'appearance.highContrast',
    section: 'appearance',
    title: 'High contrast',
    description: 'Stronger borders and text contrast',
    keywords: ['accessibility', 'contrast', 'readability'],
    scope: 'device',
    key: 'highContrast',
    path: '/dashboard/settings/appearance',
  },
  {
    id: 'appearance.showTimestamps',
    section: 'appearance',
    title: 'Show timestamps',
    description: 'Display the time next to each message',
    keywords: ['time', 'clock', 'date'],
    scope: 'device',
    key: 'showTimestamps',
    path: '/dashboard/settings/appearance',
  },
  {
    id: 'appearance.timeFormat',
    section: 'appearance',
    title: 'Time format',
    description: 'Show times as 12-hour or 24-hour clock',
    keywords: ['clock', '12 hour', '24 hour', 'military time'],
    scope: 'device',
    key: 'timeFormat',
    path: '/dashboard/settings/appearance',
  },
  {
    id: 'appearance.autoTranslate',
    section: 'appearance',
    title: 'Auto-translate replies',
    description: 'Translate incoming messages without tapping translate',
    keywords: ['translation', 'language', 'automatic'],
    scope: 'device',
    key: 'autoTranslate',
    path: '/dashboard/settings/appearance',
  },
  {
    id: 'appearance.sendOnEnter',
    section: 'appearance',
    title: 'Send with Enter',
    description: 'Press Enter to send, Shift + Enter for a new line',
    keywords: ['keyboard', 'shortcut', 'newline', 'return'],
    scope: 'device',
    key: 'sendOnEnter',
    path: '/dashboard/settings/appearance',
  },

  // --- Notifications ----------------------------------------------------
  {
    id: 'notifications.pauseAll',
    section: 'notifications',
    title: 'Pause all notifications',
    description: 'Mute every notification temporarily',
    keywords: ['mute', 'silence', 'snooze', 'quiet'],
    scope: 'account',
    key: 'pauseAll',
    path: '/dashboard/settings/notifications',
  },
  {
    id: 'notifications.changa',
    section: 'notifications',
    title: 'Changa',
    description: 'Contribution, validation and campaign updates',
    keywords: ['contributions', 'campaign', 'updates'],
    scope: 'account',
    key: 'changa',
    path: '/dashboard/settings/notifications',
  },
  {
    id: 'notifications.moderation',
    section: 'notifications',
    title: 'Moderation',
    description: 'Review requests and moderation alerts',
    keywords: ['moderator', 'review', 'reports'],
    scope: 'account',
    key: 'moderation',
    path: '/dashboard/settings/notifications',
  },
  {
    id: 'notifications.sessions',
    section: 'notifications',
    title: 'Sessions',
    description: 'Saved conversation and translation updates',
    keywords: ['saved', 'history', 'conversations'],
    scope: 'account',
    key: 'sessions',
    path: '/dashboard/settings/notifications',
  },
  {
    id: 'notifications.emailDigest',
    section: 'notifications',
    title: 'Weekly digest',
    description: 'A summary of your week by email',
    keywords: ['email', 'newsletter', 'summary'],
    scope: 'account',
    key: 'emailDigest',
    path: '/dashboard/settings/notifications',
  },

  // --- Privacy ----------------------------------------------------------
  {
    id: 'privacy.profileVisible',
    section: 'privacy',
    title: 'Public profile',
    description: 'Let other people find and view your profile',
    keywords: ['private account', 'visibility', 'hidden'],
    scope: 'account',
    key: 'profileVisible',
    path: '/dashboard/settings/privacy',
  },
  {
    id: 'privacy.showChanga',
    section: 'privacy',
    title: 'Show Changa activity',
    description: 'Show your contributions on your public profile',
    keywords: ['contributions', 'public', 'activity'],
    scope: 'account',
    key: 'showChanga',
    path: '/dashboard/settings/privacy',
  },
  {
    id: 'privacy.voiceDataAllowed',
    section: 'privacy',
    title: 'Voice data consent',
    description: 'Allow your voice recordings to be used for model training',
    keywords: ['voice', 'recording', 'consent', 'training'],
    scope: 'account',
    key: 'voiceDataAllowed',
    path: '/dashboard/settings/privacy',
  },
  {
    id: 'privacy.culturalDataAllowed',
    section: 'privacy',
    title: 'Cultural data consent',
    description: 'Allow your cultural contributions to improve the models',
    keywords: ['culture', 'consent', 'training'],
    scope: 'account',
    key: 'culturalDataAllowed',
    path: '/dashboard/settings/privacy',
  },

  // --- Data & storage ---------------------------------------------------
  {
    id: 'data.dataSaver',
    section: 'data',
    title: 'Data saver',
    description: 'Reduce image quality and stop autoplay on mobile data',
    keywords: ['bandwidth', 'mobile data', 'battery'],
    scope: 'device',
    key: 'dataSaver',
    path: '/dashboard/settings/data',
  },
  {
    id: 'data.highQualityUploads',
    section: 'data',
    title: 'High quality uploads',
    description: 'Upload photos and videos in higher resolution',
    keywords: ['resolution', 'photos', 'videos', 'camera'],
    scope: 'device',
    key: 'highQualityUploads',
    path: '/dashboard/settings/data',
  },
  {
    id: 'data.autoDownloadMedia',
    section: 'data',
    title: 'Auto-download media',
    description: 'Automatically download photos on mobile data',
    keywords: ['download', 'wifi', 'roaming'],
    scope: 'device',
    key: 'autoDownloadMedia',
    path: '/dashboard/settings/data',
  },

  // --- Moderation -------------------------------------------------------
  {
    id: 'moderation.mutedWords',
    section: 'moderation',
    title: 'Muted words',
    description: 'Hide posts that contain words or phrases you mute',
    keywords: ['filter', 'profanity', 'block words', 'hide'],
    scope: 'device',
    key: 'mutedWords',
    path: '/dashboard/settings/muted',
  },
  {
    id: 'moderation.blockedUsers',
    section: 'moderation',
    title: 'Blocked accounts',
    description: 'People who can no longer see or contact you',
    keywords: ['block', 'unblock', 'safety'],
    scope: 'device',
    key: 'blockedUsers',
    path: '/dashboard/settings/blocked',
  },
];

/**
 * Format a message timestamp using the user's chosen time format.
 *
 * The 12/24-hour choice lives in Settings > Appearance, so this is the one
 * place that decides how times are rendered.
 */
export function formatMessageTime(date: Date, format: TimeFormat): string {
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: format === '12h',
  });
}

/** Normalise a string for search comparisons. */
export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Score a catalogue entry against a search query. Higher is a better match;
 * 0 means "no match". Title matches beat description matches beat keywords.
 */
export function scoreCatalogEntry(entry: SettingsCatalogEntry, query: string): number {
  const q = normalizeSearchText(query);
  if (!q) return 1;

  const title = normalizeSearchText(entry.title);
  const description = normalizeSearchText(entry.description);
  const keywords = entry.keywords.map(normalizeSearchText);
  const haystack = `${title} ${description} ${keywords.join(' ')}`;

  if (!haystack.includes(q)) return 0;
  if (title === q) return 100;
  if (title.startsWith(q)) return 80;
  if (title.includes(q)) return 60;
  if (keywords.some((k) => k.includes(q))) return 40;
  if (description.includes(q)) return 20;
  return 10;
}

/** Search the catalogue, returning the best matches first. */
export function searchSettingsCatalog(query: string): SettingsCatalogEntry[] {
  if (!query.trim()) return [];
  return SETTINGS_CATALOG.map((entry) => ({ entry, score: scoreCatalogEntry(entry, query) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((result) => result.entry);
}
