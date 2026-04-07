"use client";

import React, { use } from "react";
import { RouteSearchParams, Screen } from "@/types";
import ChallengeWinnersScreen from "@/components/screens/ChallengeWinnersScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function ChallengeWinnersPage({ searchParams }: { searchParams: Promise<RouteSearchParams> }) {
    const { navigate, goBack } = useNavigation();
    const resolvedSearchParams = use(searchParams);
    const challengeId = resolvedSearchParams.challengeId;

    return (
        <ChallengeWinnersScreen
            navigate={navigate}
            goBack={goBack}
            onViewProfile={(user) => navigate(Screen.PROFILE, { user })}
        />
    );
}
