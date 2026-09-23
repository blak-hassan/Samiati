"use client";

import SettingsNotificationsScreen from "@/components/screens/SettingsNotificationsScreen";
import SettingsLayoutClient from "@/components/settings/SettingsLayoutClient";
import { useNavigation } from "@/hooks/useNavigation";
import { Screen } from "@/types";

export default function SettingsNotificationsPage() {
    const { navigate, goBack } = useNavigation();

    return (
        <SettingsLayoutClient activeScreen={Screen.SETTINGS_NOTIFICATIONS}>
            <SettingsNotificationsScreen navigate={navigate} goBack={goBack} />
        </SettingsLayoutClient>
    );
}
