"use client";

import { use } from "react";
import ResetPasswordFlow from "@/components/screens/ResetPasswordFlow";
import { useNavigation } from "@/hooks/useNavigation";
import { Screen } from "@/types";
import { notFound } from "next/navigation";

export default function ForgotPasswordPage({ params }: { params: Promise<{ slug: string }> }) {
    const { navigate } = useNavigation();
    const resolvedParams = use(params);
    const slug = resolvedParams.slug;

    // Map slug to Screen
    const screenMap: { [key: string]: Screen } = {
        'forgot-password': Screen.FORGOT_PASSWORD,
        'reset-link-sent': Screen.RESET_LINK_SENT,
        'set-new-password': Screen.SET_NEW_PASSWORD,
        'password-changed': Screen.PASSWORD_CHANGED,
    };

    const screen = screenMap[slug];

    if (!screen) {
        return notFound();
    }

    return (
        <ResetPasswordFlow screen={screen} navigate={navigate} />
    );
}
