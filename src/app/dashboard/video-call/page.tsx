"use client";

import React, { use } from "react";
import VideoCallScreen from "@/components/screens/VideoCallScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function VideoCallPage({ searchParams }: { searchParams: Promise<any> }) {
    const { navigate, goBack } = useNavigation();
    const resolvedSearchParams = use(searchParams);
    const chatUser = resolvedSearchParams.chatUser ? JSON.parse(resolvedSearchParams.chatUser as string) : undefined;

    return (
        <VideoCallScreen
            goBack={goBack}
            chatUser={chatUser}
        />
    );
}
