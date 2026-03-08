"use client";
import MessagesScreen from "@/components/screens/MessagesScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function FeedPage() {
    const { navigate, goBack } = useNavigation();

    return (
        <MessagesScreen
            navigate={navigate}
            goBack={goBack}
        />
    );
}
