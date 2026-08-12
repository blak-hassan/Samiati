"use client";

import SettingsHelpScreen from "@/components/screens/SettingsHelpScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useState, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export default function SettingsHelpPage() {
    const { navigate, goBack } = useNavigation();
    const isHydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);

    if (!isHydrated) {
        return null;
    }

    return (
        <SettingsHelpScreen
            goBack={goBack}
        />
    );
}
