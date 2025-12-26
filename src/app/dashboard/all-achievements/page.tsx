"use client";

import AllAchievementsScreen from "@/components/screens/AllAchievementsScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function AllAchievementsPage() {
    const { navigate, goBack } = useNavigation();

    return (
        <AllAchievementsScreen
            goBack={goBack}
        />
    );
}
