"use client";

import NewContactScreen from "@/components/screens/NewContactScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function NewContactPage() {
    const { navigate, goBack } = useNavigation();

    return (
        <NewContactScreen
            navigate={navigate}
            goBack={goBack}
        />
    );
}
