import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  DEFAULT_ACCOUNT_SETTINGS,
  DEFAULT_DEVICE_SETTINGS,
  DeviceSettingKey,
  SETTINGS_CATALOG,
  SETTINGS_ROUTES,
  scoreCatalogEntry,
  searchSettingsCatalog,
} from '../src/lib/settings';
import {
  ACCOUNT_SETTINGS_STORAGE_KEY,
} from '../src/lib/accountSettings';
import { PROFILE_FIELDS } from '../src/lib/profile';
import {
  AVAILABLE_LANGUAGES,
  LANGUAGE_LEVELS,
  LANGUAGE_LEVEL_META,
  getLanguageLevelIcon,
  getLanguagePercent,
} from '../src/lib/languages';

/** Minimal localStorage stand-in so the stores can be exercised in node. */
function createMemoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

describe('settings catalogue', () => {
  it('has a unique id for every entry', () => {
    const ids = SETTINGS_CATALOG.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('points every entry at a route that can host a setting', () => {
    const paths = new Set(SETTINGS_ROUTES);
    for (const entry of SETTINGS_CATALOG) {
      expect(paths.has(entry.path), `${entry.id} -> ${entry.path}`).toBe(true);
    }
  });

  it('keys every entry to a real setting', () => {
    const deviceKeys = Object.keys(DEFAULT_DEVICE_SETTINGS) as DeviceSettingKey[];
    const accountKeys = [
      ...Object.keys(DEFAULT_ACCOUNT_SETTINGS.notificationPreferences),
      ...Object.keys(DEFAULT_ACCOUNT_SETTINGS.privacy),
    ];
    const profileKeys = PROFILE_FIELDS as readonly string[];

    for (const entry of SETTINGS_CATALOG) {
      if (entry.scope === 'device') {
        expect(deviceKeys, `${entry.id} (${entry.key})`).toContain(entry.key);
      } else if (entry.scope === 'profile') {
        expect(profileKeys, `${entry.id} (${entry.key})`).toContain(entry.key);
      } else {
        expect(accountKeys, `${entry.id} (${entry.key})`).toContain(entry.key);
      }
    }
  });

  it('covers every profile field in the catalogue', () => {
    const catalogued = new Set(
      SETTINGS_CATALOG.filter((entry) => entry.scope === 'profile').map((entry) => entry.key)
    );
    for (const field of PROFILE_FIELDS) {
      expect(catalogued.has(field), `profile field "${field}" is not in the catalogue`).toBe(true);
    }
  });

  it('covers every device setting in the catalogue', () => {
    const catalogued = new Set(
      SETTINGS_CATALOG.filter((entry) => entry.scope === 'device').map((entry) => entry.key)
    );
    for (const key of Object.keys(DEFAULT_DEVICE_SETTINGS) as DeviceSettingKey[]) {
      expect(catalogued.has(key), `device setting "${key}" is not in the catalogue`).toBe(true);
    }
  });
});

describe('settings search', () => {
  it('ranks an exact title match first', () => {
    const results = searchSettingsCatalog('theme');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('appearance.theme');
  });

  it('matches on keywords as well as titles', () => {
    const results = searchSettingsCatalog('dark mode');
    expect(results.map((entry) => entry.id)).toContain('appearance.theme');
  });

  it('matches on the description', () => {
    const results = searchSettingsCatalog('weekly digest');
    expect(results.map((entry) => entry.id)).toContain('notifications.emailDigest');
  });

  it('returns nothing for an empty or unmatched query', () => {
    expect(searchSettingsCatalog('')).toEqual([]);
    expect(searchSettingsCatalog('zzzzz-not-a-setting')).toEqual([]);
  });

  it('scores a non-matching entry as zero', () => {
    const entry = SETTINGS_CATALOG[0];
    expect(scoreCatalogEntry(entry, 'zzzzz-not-a-setting')).toBe(0);
  });
});

describe('account settings mirror', () => {
  it('starts new local preferences private without replacing explicit stored choices', async () => {
    const accountSettings = await import('../src/lib/accountSettings');
    expect(Object.values(accountSettings.DEFAULT_PRIVACY_PREFERENCES)).toEqual([false, false, false, false]);
    accountSettings.applyServerSnapshot({
      notificationPreferences: accountSettings.DEFAULT_NOTIFICATION_PREFERENCES,
      privacy: { profileVisible: true, showChanga: true, voiceDataAllowed: true, culturalDataAllowed: true },
    });
    expect(accountSettings.getAccountSettingsSnapshot().privacy).toEqual({ profileVisible: true, showChanga: true, voiceDataAllowed: true, culturalDataAllowed: true });
  });
  it('returns a stable server snapshot for React hydration', async () => {
    const accountSettings = await import('../src/lib/accountSettings');
    const snapshot = accountSettings.getAccountSettingsServerSnapshot();
    expect(accountSettings.getAccountSettingsServerSnapshot()).toBe(snapshot);
    accountSettings.setPrivacyPreference('profileVisible', false);
    expect(accountSettings.getAccountSettingsServerSnapshot()).toBe(snapshot);
  });
  beforeEach(() => {
    vi.resetModules();
    const storage = createMemoryStorage();
    vi.stubGlobal('window', {
      localStorage: storage,
      addEventListener: () => {},
      removeEventListener: () => {},
    });
  });

  it('persists a notification preference and reports it as pending', async () => {
    const accountSettings = await import('../src/lib/accountSettings');

    accountSettings.setNotificationPreference('changa', false);

    expect(accountSettings.getAccountSettingsSnapshot().notificationPreferences.changa).toBe(false);
    expect(accountSettings.takePendingNotifications()).toEqual({ changa: false });
    expect(accountSettings.takePendingNotifications()).toEqual({});
  });

  it('persists a privacy preference', async () => {
    const accountSettings = await import('../src/lib/accountSettings');

    accountSettings.setPrivacyPreference('profileVisible', false);

    expect(accountSettings.getAccountSettingsSnapshot().privacy.profileVisible).toBe(false);
    expect(accountSettings.takePendingPrivacy()).toEqual({ profileVisible: false });
  });

  it('does not let a server snapshot overwrite an unsaved local edit', async () => {
    const accountSettings = await import('../src/lib/accountSettings');

    // The user turns a notification off locally...
    accountSettings.setNotificationPreference('moderation', false);
    // ...and the server snapshot (still holding the old value) arrives.
    accountSettings.applyServerSnapshot({
      notificationPreferences: {
        pauseAll: false,
        changa: true,
        moderation: true,
        sessions: true,
        emailDigest: false,
      },
      privacy: {
        profileVisible: true,
        showChanga: true,
        voiceDataAllowed: true,
        culturalDataAllowed: true,
      },
    });

    expect(accountSettings.getAccountSettingsSnapshot().notificationPreferences.moderation).toBe(
      false
    );
  });

  it('applies server values that the user has not touched', async () => {
    const accountSettings = await import('../src/lib/accountSettings');

    accountSettings.applyServerSnapshot({
      notificationPreferences: {
        pauseAll: true,
        changa: false,
        moderation: true,
        sessions: true,
        emailDigest: false,
      },
      privacy: {
        profileVisible: true,
        showChanga: true,
        voiceDataAllowed: true,
        culturalDataAllowed: true,
      },
    });

    const snapshot = accountSettings.getAccountSettingsSnapshot();
    expect(snapshot.notificationPreferences.pauseAll).toBe(true);
    expect(snapshot.notificationPreferences.changa).toBe(false);
  });

  it('writes the mirror to local storage', async () => {
    const accountSettings = await import('../src/lib/accountSettings');
    const storage = (
      globalThis as unknown as {
        window: { localStorage: ReturnType<typeof createMemoryStorage> };
      }
    ).window.localStorage;

    accountSettings.setNotificationPreference('sessions', false);

    const raw = storage.getItem(ACCOUNT_SETTINGS_STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).notificationPreferences.sessions).toBe(false);
  });
});

describe('language vocabulary', () => {
  it('offers exactly the levels the data model stores', () => {
    expect(LANGUAGE_LEVELS).toEqual(['Learning', 'Conversational', 'Fluent', 'Native']);
  });

  it('gives every level its own icon', () => {
    const icons = LANGUAGE_LEVELS.map((level) => getLanguageLevelIcon(level));
    expect(new Set(icons).size).toBe(LANGUAGE_LEVELS.length);
  });

  it('resolves every stored level to its own metadata', () => {
    for (const level of LANGUAGE_LEVELS) {
      const meta = LANGUAGE_LEVEL_META[level];
      expect(meta, level).toBeDefined();
      expect(meta.percent).toBeGreaterThan(0);
      expect(meta.percent).toBeLessThanOrEqual(100);
    }
  });

  it('falls back to the learning icon for an unknown level', () => {
    expect(getLanguageLevelIcon('Beginner')).toBe(getLanguageLevelIcon('Learning'));
  });

  it('maps a level to a progress percentage', () => {
    expect(getLanguagePercent('Native')).toBe(100);
    expect(getLanguagePercent('Learning')).toBeLessThan(getLanguagePercent('Fluent'));
  });

  it('has no duplicate languages in the picker', () => {
    expect(new Set(AVAILABLE_LANGUAGES).size).toBe(AVAILABLE_LANGUAGES.length);
  });
});
