"use client";

import ContributionsScreen from "@/components/screens/ContributionsScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useUser } from "../../MockProviders";
import { useState } from "react";
import { ContributionItem } from "@/types";
import { INITIAL_CONTRIBUTIONS } from "@/data/mock";


import React, { use } from "react";

export default function ContributionsPage({ searchParams }: { searchParams: Promise<any> }) {
    const { navigate, goBack } = useNavigation();
    const { languages, myContributions, setMyContributions } = useUser();
    const resolvedSearchParams = use(searchParams);

    return (
        <ContributionsScreen
            navigate={navigate}
            goBack={goBack}
            initialTab={resolvedSearchParams.initialTab || "My Changa"}
            onViewProfile={(u) => { }}
            myContributions={myContributions}
            setMyContributions={setMyContributions}
            languages={languages}
        />
    );
}
