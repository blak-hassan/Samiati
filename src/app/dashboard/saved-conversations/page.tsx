"use client";

import React, { useEffect, useState } from "react";
import SavedConversationsScreen from "@/components/screens/SavedConversationsScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { localConversationService } from "@/services/localConversationService";
import { Conversation, Screen } from "@/types";

export default function SavedConversationsPage() {
    const { navigate, goBack } = useNavigation();
    const [conversations, setConversations] = useState<Conversation[]>([]);

    useEffect(() => {
        setConversations(localConversationService.getConversations());
    }, []);

    const handleRenameConversation = (id: string, newTitle: string) => {
        const conversation = localConversationService.getConversation(id);
        if (conversation) {
            const updated = { ...conversation, title: newTitle };
            localConversationService.saveConversation(updated);
            // Refresh local state
            setConversations(localConversationService.getConversations());
        }
    };

    return (
        <SavedConversationsScreen
            navigate={navigate}
            goBack={() => navigate(Screen.HOME_CHAT)}
            conversations={conversations}
            setConversations={setConversations}
            onChatSelect={(id: string) => navigate(Screen.HOME_CHAT, { chatId: id })}
            onRename={handleRenameConversation}
        />
    );
}
