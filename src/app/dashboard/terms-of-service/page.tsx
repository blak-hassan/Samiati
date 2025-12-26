"use client";

import TermsOfServiceScreen from "@/components/screens/TermsOfServiceScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function TermsOfServicePage() {
    const { goBack } = useNavigation();

    return (
        <TermsOfServiceScreen
            goBack={goBack}
        />
    );
}
