"use client";

import SettingsMutedScreen from "@/components/screens/SettingsMutedScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function SettingsMutedPage() {
    const { goBack } = useNavigation();

    return (
        <SettingsMutedScreen
            goBack={goBack}
        />
    );
}
