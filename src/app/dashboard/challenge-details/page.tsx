"use client";

import React, { use } from "react";
import ChallengeDetailsScreen from "@/components/screens/ChallengeDetailsScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { RouteSearchParams, Screen } from "@/types";


export default function ChallengeDetailsPage({ searchParams }: { searchParams: Promise<RouteSearchParams> }) {
    const { navigate, goBack } = useNavigation();
    const resolvedSearchParams = use(searchParams);

    let challengeData = null;
    if (resolvedSearchParams.challenge) {
        try {
            challengeData = JSON.parse(resolvedSearchParams.challenge);
        } catch (e) {
            console.error("Failed to parse challenge data", e);
        }
    }

    // Fallback or ID fetch could go here if needed

    return (
        <ChallengeDetailsScreen
            navigate={navigate}
            goBack={goBack}
            onViewProfile={(user) => navigate(Screen.PROFILE, { user })}
            challenge={challengeData}
        />
    );
}

