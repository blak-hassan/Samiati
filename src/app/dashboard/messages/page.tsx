"use client";

export const dynamic = 'force-dynamic';

import DMListScreen from "@/components/screens/DMListScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ChatPreview } from "@/types";
import { Id } from "../../../../convex/_generated/dataModel";

type ConversationSummary = {
    _id: Id<"dmConversations">;
    lastMessage: string;
    lastMessageTime: number;
    unreadCount: number;
    otherUser?: {
        name?: string;
        avatar?: string;
        isOnline?: boolean;
    };
};

export default function MessagesPage() {
    const { navigate, goBack } = useNavigation();

    const conversationsData = useQuery(api.dms.queries.listConversations);

    // Convex returns undefined while loading
    const isLoading = conversationsData === undefined;

    const chats: ChatPreview[] = ((conversationsData || []) as ConversationSummary[]).map((c) => ({
        id: c._id, // Conversation ID - proper Convex typed ID
        name: c.otherUser?.name || "Unknown",
        avatar: c.otherUser?.avatar || "",
        lastMessage: c.lastMessage || "No messages yet",
        time: new Date(c.lastMessageTime).toISOString(),
        unreadCount: c.unreadCount,
        isOnline: c.otherUser?.isOnline || false,
        status: 'read' as const,
    }));

    return (
        <DMListScreen
            navigate={navigate}
            goBack={goBack}
            chats={chats}
            isLoading={isLoading}
        />
    );
}
