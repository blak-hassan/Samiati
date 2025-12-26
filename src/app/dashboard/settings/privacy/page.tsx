"use client";

import SettingsPrivacyScreen from "@/components/screens/SettingsPrivacyScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function SettingsPrivacyPage() {
    const { navigate, goBack } = useNavigation();

    return (
        <SettingsPrivacyScreen
            navigate={navigate}
            goBack={goBack}
        />
    );
}
