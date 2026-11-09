"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import ManageLanguagesScreen from "@/components/screens/ManageLanguagesScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useAppUser } from "@/hooks/useAppUser";
import { LanguageSkill } from "@/types";

export default function ManageLanguagesPage() {
    const { navigate, goBack } = useNavigation();
    const { languages, setLanguages } = useAppUser();
    const dashboard = useQuery(api.profile.queries.getDashboard, {});
    const updateProfile = useMutation(api.users.mutations.updateProfile);

    // The saved profile is the source of truth; fall back to the in-memory
    // list until the query resolves.
    const savedLanguages: LanguageSkill[] =
        (dashboard?.profile?.languages as LanguageSkill[] | undefined) ?? languages;

    const handleSave = async (next: LanguageSkill[]) => {
        await updateProfile({ languages: next });
        setLanguages(next);
    };

    return (
        <ManageLanguagesScreen
            navigate={navigate}
            goBack={goBack}
            languages={savedLanguages}
            onSave={handleSave}
        />
    );
}
