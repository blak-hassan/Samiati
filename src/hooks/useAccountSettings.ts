"use client";

import { useCallback, useSyncExternalStore } from 'react';
import {
  AccountSettingsMirror,
  getAccountSettingsServerSnapshot,
  getAccountSettingsSnapshot,
  NotificationPreferences,
  PrivacyPreferences,
  setNotificationPreference,
  setPrivacyPreference,
  subscribeAccountSettings,
} from '@/lib/accountSettings';

export interface UseAccountSettingsResult extends AccountSettingsMirror {
  /** Update a single notification preference. Persisted to the server. */
  setNotificationPreference: <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => void;
  /** Update a single privacy preference. Persisted to the server. */
  setPrivacyPreference: <K extends keyof PrivacyPreferences>(
    key: K,
    value: PrivacyPreferences[K]
  ) => void;
}

/**
 * Reads the account-scoped settings mirror (notification preferences and
 * privacy flags).
 *
 * The mirror is kept in sync with the Convex `users` row by
 * `AccountSettingsSync`, so these values are shared across devices and
 * survive a refresh — the behaviour T3Chat gets from its scoped settings.
 */
export function useAccountSettings(): UseAccountSettingsResult {
  const mirror = useSyncExternalStore(
    subscribeAccountSettings,
    getAccountSettingsSnapshot,
    getAccountSettingsServerSnapshot
  );

  const updateNotification = useCallback(
    <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => {
      setNotificationPreference(key, value);
    },
    []
  );

  const updatePrivacy = useCallback(
    <K extends keyof PrivacyPreferences>(key: K, value: PrivacyPreferences[K]) => {
      setPrivacyPreference(key, value);
    },
    []
  );

  return {
    notificationPreferences: mirror.notificationPreferences,
    privacy: mirror.privacy,
    setNotificationPreference: updateNotification,
    setPrivacyPreference: updatePrivacy,
  };
}
