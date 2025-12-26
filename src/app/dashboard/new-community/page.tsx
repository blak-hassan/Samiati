"use client";

import NewCommunityScreen from "@/components/screens/NewCommunityScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function NewCommunityPage() {
    const { navigate, goBack } = useNavigation();

    return (
        <NewCommunityScreen
            navigate={navigate}
            goBack={goBack}
        />
    );
}
