"use client";

import SettingsAccountScreen from "@/components/screens/SettingsAccountScreen";
import { PLACEHOLDER_AVATAR_URL } from "@/lib/defaults";
import SettingsLayoutClient from "@/components/settings/SettingsLayoutClient";
import { useNavigation } from "@/hooks/useNavigation";
import { useAppUser } from "@/hooks/useAppUser";
import { Screen, User } from "@/types";

export default function SettingsAccountPage() {
    const { navigate } = useNavigation();
    const { user: clerkUser } = useAppUser();

    const appUser: User = clerkUser ? {
        name: clerkUser.name || "User",
        avatar: clerkUser.avatar,
        isGuest: false,
    } : {
        name: "Guest",
        avatar: PLACEHOLDER_AVATAR_URL,
        isGuest: true
    };

    return (
        <SettingsLayoutClient activeScreen={Screen.SETTINGS_ACCOUNT}>
            <SettingsAccountScreen user={appUser} navigate={navigate} />
        </SettingsLayoutClient>
    );
}
