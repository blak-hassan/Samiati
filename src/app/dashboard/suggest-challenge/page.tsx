"use client";

import SuggestChallengeScreen from "@/components/screens/SuggestChallengeScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function SuggestChallengePage() {
    const { navigate, goBack } = useNavigation();

    return (
        <SuggestChallengeScreen
            navigate={navigate}
            goBack={goBack}
        />
    );
}
