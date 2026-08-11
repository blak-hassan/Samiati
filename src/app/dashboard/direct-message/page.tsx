"use client";

export const dynamic = 'force-dynamic';

import React, { use, useState } from "react";
import DirectMessageScreen from "@/components/screens/DirectMessageScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Message, RouteSearchParams } from "@/types";

type DirectMessageRecord = {
    _id: string;
    content: string;
    timestamp: number;
    senderId: string;
    isRead: boolean;
    image?: string;
};

export default function DirectMessagePage({ searchParams }: { searchParams: Promise<RouteSearchParams> }) {
    const { navigate, goBack } = useNavigation();
    const resolvedSearchParams = use(searchParams);

    const paramChatId = resolvedSearchParams.chatId;
    const paramChatUser = resolvedSearchParams.chatUser ? JSON.parse(resolvedSearchParams.chatUser as string) : undefined;

    const [conversationId, setConversationId] = useState<Id<"dmConversations"> | undefined>(
        paramChatId ? (paramChatId as Id<"dmConversations">) : undefined
    );

    const messagesData = useQuery(api.dms.queries.listMessages,
        conversationId ? { conversationId } : "skip"
    );

    const sendMessage = useMutation(api.dms.mutations.send);

    const handleSendMessage = async (text: string, imageStorageId?: string) => {
        if (!text.trim() && !imageStorageId) return;

        const recipientId = paramChatUser?.id as Id<"users"> | undefined;
        if (!recipientId) return;

        const result = await sendMessage({
            recipientId,
            content: text,
            image: imageStorageId,
        });

        if (result && !conversationId) {
            setConversationId(result);
        }
    };

    const messages: Message[] = ((messagesData || []) as DirectMessageRecord[]).map((m) => ({
        id: m._id,
        text: m.content,
        sender: 'other',
        timestamp: new Date(m.timestamp),
        feedback: undefined
    }));

    return (
        <DirectMessageScreen
            navigate={navigate}
            goBack={goBack}
            chatUser={paramChatUser}
            initialMessages={messages}
            onSendMessage={handleSendMessage}
        />
    );
}
