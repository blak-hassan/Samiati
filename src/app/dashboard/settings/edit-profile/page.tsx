"use client";

import EditProfileScreen from "@/components/screens/EditProfileScreen";
import SettingsLayoutClient from "@/components/settings/SettingsLayoutClient";
import { useNavigation } from "@/hooks/useNavigation";
import { Screen } from "@/types";

/**
 * "Edit profile" as a settings section — renders inside the settings shell so
 * the navigation rail stays put next to it on large screens. The standalone
 * /dashboard/edit-profile page remains for entry points outside settings.
 */
export default function SettingsEditProfilePage() {
    const { navigate, goBack } = useNavigation();

    return (
        <SettingsLayoutClient activeScreen={Screen.SETTINGS_EDIT_PROFILE}>
            <EditProfileScreen navigate={navigate} goBack={goBack} />
        </SettingsLayoutClient>
    );
}