"use client";

import React, { use } from "react";
import DirectMessageScreen from "@/components/screens/DirectMessageScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function DirectMessagePage({ searchParams }: { searchParams: Promise<any> }) {
    const { navigate, goBack } = useNavigation();
    const resolvedSearchParams = use(searchParams);
    const chatUser = resolvedSearchParams.chatUser ? JSON.parse(resolvedSearchParams.chatUser as string) : undefined;

    return (
        <DirectMessageScreen
            navigate={navigate}
            goBack={goBack}
            chatUser={chatUser}
        />
    );
}
