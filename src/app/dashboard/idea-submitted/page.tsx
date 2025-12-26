"use client";

import ConfirmationScreen from "@/components/screens/ConfirmationScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { Screen } from "@/types";

export default function IdeaSubmittedPage() {
    const { navigate } = useNavigation();

    return (
        <ConfirmationScreen
            title="Idea Submitted!"
            message="Thank you for your suggestion. Our team will review it and get back to you soon."
            onPrimary={() => navigate(Screen.HOME_CHAT)}
            icon="lightbulb"
        />
    );
}
