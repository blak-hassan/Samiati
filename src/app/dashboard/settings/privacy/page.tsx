"use client";

import SettingsPrivacyScreen from "@/components/screens/SettingsPrivacyScreen";
import SettingsLayoutClient from "@/components/settings/SettingsLayoutClient";
import { useNavigation } from "@/hooks/useNavigation";
import { Screen } from "@/types";

export default function SettingsPrivacyPage() {
    const { navigate } = useNavigation();

    return (
        <SettingsLayoutClient activeScreen={Screen.SETTINGS_PRIVACY}>
            <SettingsPrivacyScreen navigate={navigate} />
        </SettingsLayoutClient>
    );
}
