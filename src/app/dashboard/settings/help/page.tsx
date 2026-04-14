"use client";

import SettingsHelpScreen from "@/components/screens/SettingsHelpScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useEffect, useState } from "react";

export default function SettingsHelpPage() {
    const { navigate, goBack } = useNavigation();
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    if (!isHydrated) {
        return null;
    }

    return (
        <SettingsHelpScreen
            navigate={navigate}
            goBack={goBack}
        />
    );
}
