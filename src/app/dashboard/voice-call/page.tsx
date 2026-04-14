"use client";

import React, { use } from "react";
import VoiceCallScreen from "@/components/screens/VoiceCallScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { RouteSearchParams } from "@/types";

type CallChatUser = {
    name: string;
    avatar: string;
};

export default function VoiceCallPage({ searchParams }: { searchParams: Promise<RouteSearchParams> }) {
    const { goBack } = useNavigation();
    const resolvedSearchParams = use(searchParams);
    const chatUserParam = resolvedSearchParams.chatUser;
    const chatUser = (chatUserParam && typeof chatUserParam === 'string') 
        ? (JSON.parse(chatUserParam) as CallChatUser) 
        : undefined;

    if (!chatUser) {
        return <div className="p-4">User not found</div>;
    }

    return (
        <VoiceCallScreen
            goBack={goBack}
            chatUser={chatUser}
        />
    );
}
