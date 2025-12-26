"use client";

import React, { useEffect, useState } from "react";
import SavedConversationsScreen from "@/components/screens/SavedConversationsScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { INITIAL_CONVERSATIONS } from "@/data/mock";
import { Conversation, Screen } from "@/types";

export default function SavedConversationsPage() {
    const { navigate, goBack } = useNavigation();
    const [conversations, setConversations] = useState<Conversation[]>([]);

    useEffect(() => {
        setConversations(INITIAL_CONVERSATIONS);
    }, []);

    return (
        <SavedConversationsScreen
            navigate={navigate}
            goBack={goBack}
            conversations={conversations}
            setConversations={setConversations}
            onChatSelect={(id: string) => navigate(Screen.HOME_CHAT, { chatId: id })}
        />
    );
}
