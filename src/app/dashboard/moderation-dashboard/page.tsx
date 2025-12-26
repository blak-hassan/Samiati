"use client";

import ModerationDashboardScreen from "@/components/screens/ModerationDashboardScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function ModerationDashboardPage() {
    const { navigate, goBack } = useNavigation();

    return (
        <ModerationDashboardScreen
            navigate={navigate}
            goBack={goBack}
        />
    );
}
