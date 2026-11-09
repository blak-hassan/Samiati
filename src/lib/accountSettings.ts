/**
 * Account-scoped settings mirror.
 *
 * Notification and privacy preferences belong to the *account*, not the
 * device, so they are stored on the Convex `users` row. This module keeps a
 * local mirror so the UI can render and toggle instantly (and so the screens
 * still work when Convex is unreachable), while `AccountSettingsSync` pushes
 * changes to the server.
 */

export const ACCOUNT_SETTINGS_STORAGE_KEY = 'samiati:account-settings:v1';

export interface NotificationPreferences {
  pauseAll: boolean;
  changa: boolean;
  moderation: boolean;
  sessions: boolean;
  emailDigest: boolean;
}

export interface PrivacyPreferences {
  profileVisible: boolean;
  showChanga: boolean;
  voiceDataAllowed: boolean;
  culturalDataAllowed: boolean;
}

export interface AccountSettingsMirror {
  notificationPreferences: NotificationPreferences;
  privacy: PrivacyPreferences;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  pauseAll: false,
  changa: true,
  moderation: true,
  sessions: true,
  emailDigest: false,
};

export const DEFAULT_PRIVACY_PREFERENCES: PrivacyPreferences = {
  profileVisible: false,
  showChanga: false,
  voiceDataAllowed: false,
  culturalDataAllowed: false,
};

type Listener = () => void;

const listeners = new Set<Listener>();
let cache: AccountSettingsMirror | null = null;

/**
 * Keys the user changed locally but that have not been confirmed by the
 * server yet. The server snapshot must not overwrite these.
 */
let pendingNotifications: Partial<NotificationPreferences> = {};
let pendingPrivacy: Partial<PrivacyPreferences> = {};

function readMirror(): AccountSettingsMirror {
  if (typeof window === 'undefined') {
    return {
      notificationPreferences: { ...DEFAULT_NOTIFICATION_PREFERENCES },
      privacy: { ...DEFAULT_PRIVACY_PREFERENCES },
    };
  }
  if (cache) return cache;

  try {
    const raw = window.localStorage.getItem(ACCOUNT_SETTINGS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<AccountSettingsMirror>) : {};
    cache = {
      notificationPreferences: {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...(parsed.notificationPreferences ?? {}),
      },
      privacy: { ...DEFAULT_PRIVACY_PREFERENCES, ...(parsed.privacy ?? {}) },
    };
  } catch {
    cache = {
      notificationPreferences: { ...DEFAULT_NOTIFICATION_PREFERENCES },
      privacy: { ...DEFAULT_PRIVACY_PREFERENCES },
    };
  }
  return cache;
}

function writeMirror(next: AccountSettingsMirror) {
  cache = next;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(ACCOUNT_SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore quota / private-mode failures — the in-memory value stands.
    }
  }
  listeners.forEach((listener) => listener());
}

export function subscribeAccountSettings(listener: Listener) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== ACCOUNT_SETTINGS_STORAGE_KEY) return;
    cache = null;
    readMirror();
    listeners.forEach((l) => l());
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export const getAccountSettingsSnapshot = () => readMirror();
// React requires a cached server snapshot; returning a fresh object on each
// read can repeatedly trigger hydration updates across the settings screens.
const serverSnapshot: AccountSettingsMirror = {
  notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
  privacy: DEFAULT_PRIVACY_PREFERENCES,
};
export const getAccountSettingsServerSnapshot = () => serverSnapshot;

/** Update one notification preference locally and mark it for the server. */
export function setNotificationPreference<K extends keyof NotificationPreferences>(
  key: K,
  value: NotificationPreferences[K]
) {
  const current = readMirror();
  pendingNotifications = { ...pendingNotifications, [key]: value };
  writeMirror({
    ...current,
    notificationPreferences: { ...current.notificationPreferences, [key]: value },
  });
}

/** Update one privacy preference locally and mark it for the server. */
export function setPrivacyPreference<K extends keyof PrivacyPreferences>(
  key: K,
  value: PrivacyPreferences[K]
) {
  const current = readMirror();
  pendingPrivacy = { ...pendingPrivacy, [key]: value };
  writeMirror({
    ...current,
    privacy: { ...current.privacy, [key]: value },
  });
}

/** Apply a snapshot received from the server, keeping unsaved local edits. */
export function applyServerSnapshot(snapshot: {
  notificationPreferences: NotificationPreferences;
  privacy: PrivacyPreferences;
}) {
  const current = readMirror();

  const notificationPreferences = { ...current.notificationPreferences };
  (Object.keys(snapshot.notificationPreferences) as (keyof NotificationPreferences)[]).forEach(
    (key) => {
      if (pendingNotifications[key] === undefined) {
        notificationPreferences[key] = snapshot.notificationPreferences[key];
      }
    }
  );

  const privacy = { ...current.privacy };
  (Object.keys(snapshot.privacy) as (keyof PrivacyPreferences)[]).forEach((key) => {
    if (pendingPrivacy[key] === undefined) {
      privacy[key] = snapshot.privacy[key];
    }
  });

  writeMirror({ notificationPreferences, privacy });
}

/** The notification changes that still need to reach the server. */
export function takePendingNotifications(): Partial<NotificationPreferences> {
  const pending = pendingNotifications;
  pendingNotifications = {};
  return pending;
}

/** The privacy changes that still need to reach the server. */
export function takePendingPrivacy(): Partial<PrivacyPreferences> {
  const pending = pendingPrivacy;
  pendingPrivacy = {};
  return pending;
}
