"use client";

import ManageLanguagesScreen from "@/components/screens/ManageLanguagesScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { INITIAL_LANGUAGES_STATE } from "@/data/mock";
import { useState } from "react";
import { LanguageSkill } from "@/types";

export default function ManageLanguagesPage() {
    const { navigate, goBack } = useNavigation();
    const [languages, setLanguages] = useState<LanguageSkill[]>(INITIAL_LANGUAGES_STATE);

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
