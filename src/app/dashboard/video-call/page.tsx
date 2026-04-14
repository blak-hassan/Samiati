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
    const chatUserParam = resolvedSearchParams.chatUser;
    const chatUser = (chatUserParam && typeof chatUserParam === 'string') 
        ? (JSON.parse(chatUserParam) as CallChatUser) 
        : undefined;

    if (!chatUser) {
        return <div className="p-4">User not found</div>;
    }

    return (
        <VideoCallScreen
            goBack={goBack}
            chatUser={chatUser}
        />
    );
}
