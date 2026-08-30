"use client";

import SettingsDataScreen from "@/components/screens/SettingsDataScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function SettingsDataPage() {
    const { goBack } = useNavigation();

    return (
        <SettingsDataScreen
            goBack={goBack}
        />
    );
}
