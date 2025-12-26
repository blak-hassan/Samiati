
"use client";

import CommunitiesScreen from "@/components/screens/CommunitiesScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function CommunitiesPage() {
    const { navigate, goBack } = useNavigation();

    return (
        <CommunitiesScreen
            navigate={navigate}
            goBack={goBack}
        />
    );
}
