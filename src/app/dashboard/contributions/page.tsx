"use client";

import ContributionsScreen from "@/components/screens/ContributionsScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useUser } from "../../MockProviders";
import { useState } from "react";
import { ContributionItem } from "@/types";
import { INITIAL_CONTRIBUTIONS } from "@/data/mock";

export default function ContributionsPage() {
    const { navigate, goBack } = useNavigation();
    // Use local state for now until global context is established
    const [myContributions, setMyContributions] = useState<ContributionItem[]>(INITIAL_CONTRIBUTIONS);

    return (
        <ContributionsScreen
            navigate={navigate}
            goBack={goBack}
            initialTab="My Changa"
            onViewProfile={(u) => console.log('View profile', u)}
            myContributions={myContributions}
            setMyContributions={setMyContributions}
        />
    );
}
