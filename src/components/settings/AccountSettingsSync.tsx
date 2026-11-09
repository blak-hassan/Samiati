"use client";

import { useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  applyServerSnapshot,
  takePendingNotifications,
  takePendingPrivacy,
} from '@/lib/accountSettings';
import { useAccountSettings } from '@/hooks/useAccountSettings';

/**
 * Keeps the account-scoped settings mirror in sync with the Convex `users`
 * row.
 *
 * Two directions:
 *   server -> local  the account settings query seeds the mirror.
 *   local  -> server  every toggle is pushed with the existing
 *                      `updateNotificationPreferences` / `updatePrivacy`
 *                      mutations, which previously existed but were never
 *                      called from anywhere.
 */
function ConvexAccountSettingsSync() {
  const settings = useQuery(api.users.queries.getAccountSettings, {});
  const updateNotificationPreferences = useMutation(
    api.users.mutations.updateNotificationPreferences
  );
  const updatePrivacy = useMutation(api.users.mutations.updatePrivacy);

  const { notificationPreferences, privacy } = useAccountSettings();

  // Guests are not allowed to write these flags. Once a write is rejected we
  // stop applying server snapshots so the local choice is not reverted.
  const syncDisabled = useRef(false);

  useEffect(() => {
    if (!settings || syncDisabled.current) return;
    applyServerSnapshot(settings);
  }, [settings]);

  useEffect(() => {
    const pendingNotifications = takePendingNotifications();
    const pendingPrivacy = takePendingPrivacy();

    const hasNotifications = Object.keys(pendingNotifications).length > 0;
    const hasPrivacy = Object.keys(pendingPrivacy).length > 0;
    if (!hasNotifications && !hasPrivacy) return;

    if (hasNotifications) {
      updateNotificationPreferences(pendingNotifications).catch((error) => {
        console.warn('Could not save notification preferences:', error);
        syncDisabled.current = true;
      });
    }
    if (hasPrivacy) {
      updatePrivacy(pendingPrivacy).catch((error) => {
        console.warn('Could not save privacy preferences:', error);
        syncDisabled.current = true;
      });
    }
  }, [
    notificationPreferences,
    privacy,
    updateNotificationPreferences,
    updatePrivacy,
  ]);

  return null;
}

/**
 * Mounted once in the dashboard layout. When Convex is not configured the
 * mirror simply stays on the local values, so the settings screens keep
 * working offline / in demo mode.
 */
export default function AccountSettingsSync() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return null;
  return <ConvexAccountSettingsSync />;
}
