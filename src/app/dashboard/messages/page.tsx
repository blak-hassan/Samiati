"use client";

import DMListScreen from "@/components/screens/DMListScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { INITIAL_MESSAGES_CHATS } from "@/data/mock";

export default function MessagesPage() {
    const { navigate, goBack } = useNavigation();

    return (
        <DMListScreen
            navigate={navigate}
            goBack={goBack}
            chats={INITIAL_MESSAGES_CHATS}
        />
    );
}
