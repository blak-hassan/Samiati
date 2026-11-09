"use client";

import { useRouter } from "next/navigation";
import SettingsPrivacyScreen from "@/components/screens/SettingsPrivacyScreen";
import { useAccountSettings } from "@/hooks/useAccountSettings";
import { useSettings } from "@/hooks/useSettings";

export default function SettingsPrivacyPage() {
    const { privacy, setPrivacyPreference } = useAccountSettings();
    const { settings } = useSettings();
    const router = useRouter();

    return (
        <SettingsPrivacyScreen
            privacy={privacy}
            onChange={setPrivacyPreference}
            onNavigate={(path) => router.push(path)}
            mutedCount={settings.mutedWords.length}
            blockedCount={settings.blockedUsers.length}
        />
    );
}
