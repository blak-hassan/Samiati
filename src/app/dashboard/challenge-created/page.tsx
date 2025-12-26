"use client";

import ConfirmationScreen from "@/components/screens/ConfirmationScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { Screen } from "@/types";

export default function ChallengeCreatedPage() {
    const { navigate } = useNavigation();

    return (
        <ConfirmationScreen
            title="Challenge Created!"
            message="Your cultural challenge has been submitted and is now live for the community to participate in."
            onPrimary={() => navigate(Screen.CONTRIBUTIONS, { initialTab: 'Challenges' })}
            onSecondary={() => navigate(Screen.HOME_CHAT)}
            icon="emoji_events"
        />
    );
}
