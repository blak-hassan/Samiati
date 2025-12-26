"use client";

import React, { useEffect, useState, use } from "react";
import ChatScreen from "@/components/screens/ChatScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useUser } from "../MockProviders";
import { User, Screen, Conversation } from "@/types";
import { INITIAL_CONVERSATIONS } from "@/data/mock";

export default function DashboardPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const { navigate } = useNavigation();
    const { user: clerkUser } = useUser();

    // Find active conversation from search params if provided
    const resolvedSearchParams = use(searchParams);
    const chatId = typeof resolvedSearchParams.chatId === 'string' ? resolvedSearchParams.chatId : null;

    // We use allConversations to find the active one
    const [allConversations, setAllConversations] = useState<Conversation[]>([]);

    useEffect(() => {
        setAllConversations(INITIAL_CONVERSATIONS);
    }, []);

    const activeConversation = chatId ? allConversations.find(c => c.id === chatId) || null : null;


    // Local state for theme (could be moved to context)
    const [isDarkMode, setIsDarkMode] = useState(true);
    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    // Sync User on load
    useEffect(() => {
        if (clerkUser) {
            // storeUser logic...
        }
    }, [clerkUser]);

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
            onSaveChat={() => { }}
        />
    );
}
