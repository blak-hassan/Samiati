"use client";

import PrivacyPolicyScreen from "@/components/screens/PrivacyPolicyScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function PrivacyPolicyPage() {
    const { goBack } = useNavigation();

    return (
        <PrivacyPolicyScreen
            goBack={goBack}
        />
    );
}
