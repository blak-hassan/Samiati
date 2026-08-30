"use client";

import SettingsNotificationsScreen from "@/components/screens/SettingsNotificationsScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function SettingsNotificationsPage() {
    const { goBack } = useNavigation();

    return (
        <SettingsNotificationsScreen
            goBack={goBack}
        />
    );
}
