"use client";

import React, { use } from "react";
import ContactInfoScreen from "@/components/screens/ContactInfoScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function ContactInfoPage({ searchParams }: { searchParams: Promise<any> }) {
    const { navigate, goBack } = useNavigation();
    const resolvedSearchParams = use(searchParams);
    const chatUser = resolvedSearchParams.chatUser ? JSON.parse(resolvedSearchParams.chatUser as string) : undefined;

    return (
        <ContactInfoScreen
            navigate={navigate}
            goBack={goBack}
            chatUser={chatUser}
        />
    );
}
