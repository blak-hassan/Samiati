"use client";

import SettingsBlockedScreen from "@/components/screens/SettingsBlockedScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function SettingsBlockedPage() {
    const { navigate, goBack } = useNavigation();

    return (
        <SettingsBlockedScreen
            goBack={goBack}
        />
    );
}
