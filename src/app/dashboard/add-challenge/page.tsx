"use client";

import AddChallengeScreen from "@/components/screens/AddChallengeScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function AddChallengePage() {
    const { navigate, goBack } = useNavigation();

    return (
        <AddChallengeScreen
            navigate={navigate}
            goBack={goBack}
        />
    );
}
