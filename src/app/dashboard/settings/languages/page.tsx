"use client";

import ManageLanguagesScreen from "@/components/screens/ManageLanguagesScreen";
import SettingsLayoutClient from "@/components/settings/SettingsLayoutClient";
import { useAppUser } from "@/hooks/useAppUser";
import { LanguageSkill, Screen } from "@/types";

export default function ManageLanguagesPage() {
    const { languages, setLanguages } = useAppUser();

    const handleUpdateLanguages = (updatedLanguages: LanguageSkill[]) => {
        setLanguages(updatedLanguages);
    };

    return (
        <SettingsLayoutClient activeScreen={Screen.MANAGE_LANGUAGES}>
            <ManageLanguagesScreen
                languages={languages}
                onUpdateLanguages={handleUpdateLanguages}
            />
        </SettingsLayoutClient>
    );
}
