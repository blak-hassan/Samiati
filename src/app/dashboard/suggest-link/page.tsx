"use client";

import SuggestLinkScreen from "@/components/screens/SuggestLinkScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function SuggestLinkPage() {
    const { navigate, goBack } = useNavigation();

    return (
        <SuggestLinkScreen
            navigate={navigate}
            goBack={goBack}
        />
    );
}
