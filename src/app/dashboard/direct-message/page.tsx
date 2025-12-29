"use client";

import React, { use, useState, useEffect } from "react";
import DirectMessageScreen from "@/components/screens/DirectMessageScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Message } from "@/types";

export default function DirectMessagePage({ searchParams }: { searchParams: Promise<any> }) {
    const { navigate, goBack } = useNavigation();
    const resolvedSearchParams = use(searchParams);

    // Params might have chatId or chatUser (for new chat)
    const paramChatId = resolvedSearchParams.chatId;
    const paramChatUser = resolvedSearchParams.chatUser ? JSON.parse(resolvedSearchParams.chatUser as string) : undefined;

    // State to handle optimistic or initial setup
    const [conversationId, setConversationId] = useState<Id<"dmConversations"> | undefined>(
        paramChatId ? (paramChatId as Id<"dmConversations">) : undefined
    );

    // If we only have user, check if conversation exists?
    // Convex query `listConversations` returns all, but specialized `getConversation`?
    // For now, if no ID, we rely on creating one on send.

    // Fetch messages if we have an ID
    const messagesData = useQuery(api.dms.queries.listMessages,
        conversationId ? { conversationId } : "skip"
    );

    const sendMessage = useMutation(api.dms.mutations.send);

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;

        // Optimistic UI update? 
        // Or just wait.

        // Send backend mutation
        // If we don't have conversationId, we must have targetUserId.
        // Wait, paramChatUser doesn't give us ID if it's just name/avatar.
        // We need target User ID.
        // Assuming paramChatUser has 'id' field if passed from DMListScreen.
        // Checking DMListScreen... passed `chatUser` object.
        // `chatUser` in DMListScreen (lines 52-56) only includes name, avatar, isOnline.
        // It MISSES ID. Critical flaw in mock logic.
        // We need to fix DMListScreen first or assume passed object has hidden ID.
        // Let's assume we fix DMListScreen to pass ID inside chatUser or separately.

        // Temporarily, let's look at logic below.

        /*
        const result = await sendMessage({
             content: text,
             conversationId: conversationId, 
             targetUserId: targetUserId 
        });
        if (result) setConversationId(result);
        */
    };

    // Mapping messages
    const messages: Message[] = (messagesData || []).map((m: any) => ({
        id: m._id,
        text: m.content,
        sender: m.isMe ? 'user' : 'other', // Need logic to determine this. isMe isn't in schema return.
        // We need current user ID to check sender.
        timestamp: new Date(m.timestamp),
        feedback: undefined // unimplemented
    }));

    return (
        <DirectMessageScreen
            navigate={navigate}
            goBack={goBack}
            chatUser={paramChatUser}
            initialMessages={messages} // This prop might need to be 'messages' stream
            onSendMessage={handleSendMessage}
        />
    );
}
