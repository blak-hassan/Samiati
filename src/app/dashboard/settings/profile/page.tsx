"use client";

import ProfileScreenContainer from "@/components/screens/ProfileScreenContainer";
import SettingsLayoutClient from "@/components/settings/SettingsLayoutClient";
import { Screen } from "@/types";

/**
 * "View profile" as a settings pane — renders inside the settings shell so
 * the navigation rail stays put next to it on large screens. The standalone
 * /dashboard/profile page remains for entry points outside settings.
 */
export default function SettingsProfilePage() {
    return (
        <SettingsLayoutClient activeScreen={Screen.SETTINGS_PROFILE}>
            <ProfileScreenContainer />
        </SettingsLayoutClient>
    );
}