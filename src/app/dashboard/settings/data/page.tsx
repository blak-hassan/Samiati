"use client";

import SettingsDataScreen from "@/components/screens/SettingsDataScreen";
import SettingsLayoutClient from "@/components/settings/SettingsLayoutClient";
import { useNavigation } from "@/hooks/useNavigation";
import { Screen } from "@/types";

export default function SettingsDataPage() {
    const { navigate } = useNavigation();

    return (
        <SettingsLayoutClient activeScreen={Screen.SETTINGS_DATA}>
            <SettingsDataScreen navigate={navigate} />
        </SettingsLayoutClient>
    );
}
