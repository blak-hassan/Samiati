"use client";

import React, { use } from "react";
import VideoCallScreen from "@/components/screens/VideoCallScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { RouteSearchParams } from "@/types";

type CallChatUser = {
    name: string;
    avatar: string;
};

export default function VideoCallPage({ searchParams }: { searchParams: Promise<RouteSearchParams> }) {
    const { goBack } = useNavigation();
    const resolvedSearchParams = use(searchParams);
    const chatUser = resolvedSearchParams.chatUser ? (JSON.parse(resolvedSearchParams.chatUser as string) as CallChatUser) : undefined;

    return (
        <VideoCallScreen
            goBack={goBack}
            chatUser={chatUser}
        />
    );
}
