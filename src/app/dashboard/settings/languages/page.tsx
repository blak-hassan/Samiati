"use client";

import ManageLanguagesScreen from "@/components/screens/ManageLanguagesScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useAppUser } from "@/hooks/useAppUser";
import { LanguageSkill } from "@/types";

export default function ManageLanguagesPage() {
    const { goBack } = useNavigation();
    const { languages, setLanguages } = useAppUser();

    const handleUpdateLanguages = (updatedLanguages: LanguageSkill[]) => {
        setLanguages(updatedLanguages);
    };

    return (
        <ManageLanguagesScreen
            goBack={goBack}
            languages={languages}
            onUpdateLanguages={handleUpdateLanguages}
        />
    );
}
