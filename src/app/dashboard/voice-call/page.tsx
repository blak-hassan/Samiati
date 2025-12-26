"use client";

import React, { use } from "react";
import VoiceCallScreen from "@/components/screens/VoiceCallScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function VoiceCallPage({ searchParams }: { searchParams: Promise<any> }) {
    const { navigate, goBack } = useNavigation();
    const resolvedSearchParams = use(searchParams);
    const chatUser = resolvedSearchParams.chatUser ? JSON.parse(resolvedSearchParams.chatUser as string) : undefined;

    return (
        <VoiceCallScreen
            goBack={goBack}
            chatUser={chatUser}
        />
    );
}
