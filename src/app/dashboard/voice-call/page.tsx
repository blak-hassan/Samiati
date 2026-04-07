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
    const chatUser = resolvedSearchParams.chatUser ? (JSON.parse(resolvedSearchParams.chatUser as string) as CallChatUser) : undefined;

    return (
        <VoiceCallScreen
            goBack={goBack}
            chatUser={chatUser}
        />
    );
}
