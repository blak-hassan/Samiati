"use client";

import SettingsNotificationsScreen from "@/components/screens/SettingsNotificationsScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function SettingsNotificationsPage() {
    const { navigate, goBack } = useNavigation();

    return (
        <SettingsNotificationsScreen
            navigate={navigate}
            goBack={goBack}
        />
    );
}
