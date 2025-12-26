"use client";

import SettingsAboutScreen from "@/components/screens/SettingsAboutScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function SettingsAboutPage() {
    const { navigate, goBack } = useNavigation();

    return (
        <SettingsAboutScreen
            navigate={navigate}
            goBack={goBack}
        />
    );
}
