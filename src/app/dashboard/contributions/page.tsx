"use client";

import ContributionsScreen from "@/components/screens/ContributionsScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useUser } from "../../MockProviders";
import { useState } from "react";
import { ContributionItem } from "@/types";
import { INITIAL_CONTRIBUTIONS } from "@/data/mock";

export default function ContributionsPage() {
    const { navigate, goBack } = useNavigation();
    const { languages, myContributions, setMyContributions } = useUser();

    return (
        <ContributionsScreen
            navigate={navigate}
            goBack={goBack}
            initialTab="My Changa"
            onViewProfile={(u) => { }}
            myContributions={myContributions}
            setMyContributions={setMyContributions}
            languages={languages}
        />
    );
}
