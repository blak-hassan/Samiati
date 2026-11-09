"use client";

import { useClerk as useClerkAuth } from "@clerk/nextjs";
import { useClerk as useMockClerk } from "@/app/MockProviders";
import { isDemoMode } from "@/lib/appMode";
import SettingsDataScreen from "@/components/screens/SettingsDataScreen";

const useClerk = isDemoMode ? useMockClerk : useClerkAuth;

export default function SettingsDataPage() {
    const clerk = useClerk();

    // Deletion is handled by the identity provider so the sign-in identity
    // and the Samiati data are removed together.
    const openAccountPanel = () => {
        const openUserProfile = (clerk as { openUserProfile?: () => void }).openUserProfile;
        if (typeof openUserProfile === 'function') {
            openUserProfile.call(clerk);
        }
    };

    return <SettingsDataScreen onDeleteAccount={openAccountPanel} />;
}
