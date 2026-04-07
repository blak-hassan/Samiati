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

    return (
        <ContributionsScreen
            navigate={navigate}
            goBack={goBack}
            initialTab={resolvedSearchParams.initialTab || "My Changa"}
            initialTypeFilter={resolvedSearchParams.typeFilter}
            onViewProfile={() => {}}
            myContributions={myContributions}
            setMyContributions={setMyContributions}
            languages={languages}
        />
    );
}
