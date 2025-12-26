"use client";

import SettingsMutedScreen from "@/components/screens/SettingsMutedScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function SettingsMutedPage() {
    const { navigate, goBack } = useNavigation();

    return (
        <SettingsMutedScreen
            goBack={goBack}
        />
    );
}
