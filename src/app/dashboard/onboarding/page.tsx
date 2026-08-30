"use client";

import OnboardingScreen from "@/components/screens/OnboardingScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function OnboardingPage() {
    const { goBack } = useNavigation();

    return <OnboardingScreen goBack={goBack} />;
}
