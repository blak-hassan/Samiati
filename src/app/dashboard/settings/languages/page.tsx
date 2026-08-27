"use client";

import ManageLanguagesScreen from "@/components/screens/ManageLanguagesScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useAppUser } from "@/hooks/useAppUser";
import { LanguageSkill } from "@/types";

export default function ManageLanguagesPage() {
    const { navigate, goBack } = useNavigation();
    const { languages, setLanguages } = useAppUser();

    const handleUpdateLanguages = (updatedLanguages: LanguageSkill[]) => {
        setLanguages(updatedLanguages);
    };

    return (
        <ManageLanguagesScreen
            navigate={navigate}
            goBack={goBack}
            languages={languages}
            onUpdateLanguages={handleUpdateLanguages}
        />
    );
}
