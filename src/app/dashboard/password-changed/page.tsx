"use client";

import ConfirmationScreen from "@/components/screens/ConfirmationScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { Screen } from "@/types";

export default function PasswordChangedPage() {
    const { navigate } = useNavigation();

    return (
        <ConfirmationScreen
            title="Password Updated"
            message="Your account security has been updated successfully. You can now use your new password to sign in."
            onPrimary={() => navigate(Screen.SETTINGS)}
            icon="lock"
        />
    );
}
