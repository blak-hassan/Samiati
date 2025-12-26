"use client";

import NewGroupScreen from "@/components/screens/NewGroupScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function NewGroupPage() {
    const { navigate, goBack } = useNavigation();

    return (
        <NewGroupScreen
            navigate={navigate}
            goBack={goBack}
        />
    );
}
