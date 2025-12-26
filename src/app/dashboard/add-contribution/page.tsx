"use client";

import AddContributionScreen from "@/components/screens/AddContributionScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function AddContributionPage() {
    const { navigate, goBack } = useNavigation();

    return (
        <AddContributionScreen
            navigate={navigate}
            goBack={goBack}
        />
    );
}
