"use client";

import SettingsDataScreen from "@/components/screens/SettingsDataScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function SettingsDataPage() {
    const { navigate, goBack } = useNavigation();

    return (
        <SettingsDataScreen
            goBack={goBack}
        />
    );
}
