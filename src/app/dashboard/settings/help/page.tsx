"use client";

import SettingsHelpScreen from "@/components/screens/SettingsHelpScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function SettingsHelpPage() {
    const { navigate, goBack } = useNavigation();

    return (
        <SettingsHelpScreen
            navigate={navigate}
            goBack={goBack}
        />
    );
}
