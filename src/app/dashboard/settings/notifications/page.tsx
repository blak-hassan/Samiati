"use client";

import SettingsNotificationsScreen from "@/components/screens/SettingsNotificationsScreen";
import { useAccountSettings } from "@/hooks/useAccountSettings";

export default function SettingsNotificationsPage() {
    const { notificationPreferences, setNotificationPreference } = useAccountSettings();

    return (
        <SettingsNotificationsScreen
            notificationPreferences={notificationPreferences}
            onChange={setNotificationPreference}
        />
    );
}
