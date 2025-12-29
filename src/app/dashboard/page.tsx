"use client";

import React, { useEffect, useState, use } from "react";
import ChatScreen from "@/components/screens/ChatScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useUser } from "../MockProviders";
import { User, Screen, Conversation } from "@/types";
import { localConversationService } from "@/services/localConversationService";
import { INITIAL_CONVERSATIONS } from "@/data/mock";

export default function DashboardPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const { navigate } = useNavigation();
    const { user: clerkUser } = useUser();

    // Find active conversation from search params if provided
    const resolvedSearchParams = use(searchParams);
    const chatId = typeof resolvedSearchParams.chatId === 'string' ? resolvedSearchParams.chatId : null;

    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

    // Load conversation on mount or when chatId changes
    useEffect(() => {
        if (chatId) {
            const conversation = localConversationService.getConversation(chatId);
            setActiveConversation(conversation || null);
        } else {
            setActiveConversation(null); // Reset for new chat
        }
    }, [chatId]);

    const handleSaveConversation = (messages: any[]) => {
        if (activeConversation) {
            const updated = {
                ...activeConversation,
                messages: messages,
                lastActive: Date.now(),
                messageCount: messages.length,
                // Update preview snippet if needed
            };
            localConversationService.saveConversation(updated);
            setActiveConversation(updated);
        } else {
            // New conversation
            const newConv = localConversationService.createNewConversation();
            newConv.messages = messages;
            newConv.messageCount = messages.length;

            // Try to set title from first message
            if (messages.length > 0) {
                const firstMsg = messages[0].text;
                newConv.title = firstMsg.length > 30 ? firstMsg.substring(0, 30) + "..." : firstMsg;
            }

            localConversationService.saveConversation(newConv);
            setActiveConversation(newConv);
            // Optional: navigate to the new ID to persist URL
            // navigate(Screen.HOME_CHAT, { chatId: newConv.id });
        }
    };

    // Local state for theme (could be moved to context)
    const [isDarkMode, setIsDarkMode] = useState(true);
    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    // Transform Clerk User to App User
    const appUser: User = clerkUser ? {
        name: clerkUser.fullName || "User",
        handle: "@" + (clerkUser.username || "user"),
        avatar: clerkUser.imageUrl,
        isGuest: false,
        bio: "Digital Storyteller",
    } : {
        name: "Guest",
        handle: "@guest",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKkfM9WqTPsqCfuM1KQIQ1QzsbiAaq2rab_EQ2MwL_8b9sbJ3-mIl3CjDCR888PPrsBNhkpl7tkden40rCqo3pJe3Sepe18k46KUvejTidyoAK941vcqejBnqRrcfC5hPZop_XFQ7S9jkteso1RvDSjv8s1JfGwGhOYE1uQ1M1J93quDxOniTqTNGD-1WZq2GOu_Z1EpzGjMzNeyvhYbuIwiqYK1TDLfGX5mpdg--_df6DoewiFO-RhrraeKpwY7MetQ94avb6spo",
        isGuest: true
    };

    return (
        <ChatScreen
            user={appUser}
            navigate={navigate}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            activeConversation={activeConversation}
            onNewChat={() => navigate(Screen.HOME_CHAT)}
            onSaveChat={handleSaveConversation}
        />
    );
}
