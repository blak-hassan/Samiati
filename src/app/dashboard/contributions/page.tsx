"use client";

import ContributionsScreen from "@/components/screens/ContributionsScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useUser } from "../../MockProviders";
import React, { use } from "react";
import { RouteSearchParams } from "@/types";

export default function ContributionsPage({ searchParams }: { searchParams: Promise<RouteSearchParams> }) {
    const { navigate, goBack } = useNavigation();
    const { languages, myContributions, setMyContributions } = useUser();
    const resolvedSearchParams = use(searchParams);

    const initialTab = (resolvedSearchParams.initialTab as 'My Changa' | 'Challenges' | 'Moderation' | 'Saved') || "My Changa";
    const initialStatusFilter = (resolvedSearchParams.statusFilter as string) || "All";

    return (
        <ContributionsScreen
            navigate={navigate}
            goBack={goBack}
            initialTab={initialTab}
            initialTypeFilter={resolvedSearchParams.typeFilter as string | undefined}
            initialStatusFilter={initialStatusFilter}
            onViewProfile={() => {}}
            myContributions={myContributions}
            setMyContributions={setMyContributions}
            languages={languages}
        />
    );
}
