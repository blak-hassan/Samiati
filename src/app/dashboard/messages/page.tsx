"use client";
import DMListScreen from "@/components/screens/DMListScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ChatPreview } from "@/types";

export default function MessagesPage() {
    const { navigate, goBack } = useNavigation();

    const conversationsData = useQuery(api.dms.queries.listConversations);

    const chats: ChatPreview[] = (conversationsData || []).map((c: any) => ({
        id: c._id, // Conversation ID
        name: c.otherUser?.name || "Unknown",
        avatar: c.otherUser?.avatar || "",
        lastMessage: c.lastMessage || "No messages yet",
        time: new Date(c.lastMessageTime).toISOString(),
        unreadCount: c.unreadCount,
        isOnline: c.otherUser?.isOnline || false,
        status: 'read' as const,
        // We can attach the target User ID to helper fields if we define them, 
        // or rely on DMListScreen using this ID as conversation ID.
        // If DMListScreen uses `chat.id` as `chatId`, we are good.
        // But `chatUser` object created in DMListScreen (lines 52-56) only includes name/avatar.
        // We should probably modify DMListScreen to include id in chatUser if possible, 
        // OR we just use conversationID. 
    }));

    // We need to override the navigation behavior or ensure DMListScreen passes correct params.
    // DMListScreen likely iterates chats and calls navigate.

    return (
        <DMListScreen
            navigate={navigate}
            goBack={goBack}
            chats={chats}
        />
    );
}

