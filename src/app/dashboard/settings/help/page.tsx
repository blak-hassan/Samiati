"use client";

import SettingsHelpScreen from "@/components/screens/SettingsHelpScreen";
import SettingsLayoutClient from "@/components/settings/SettingsLayoutClient";
import { Screen } from "@/types";

export default function SettingsHelpPage() {
    return (
        <SettingsLayoutClient activeScreen={Screen.SETTINGS_HELP}>
            <SettingsHelpScreen />
        </SettingsLayoutClient>
    );
}
