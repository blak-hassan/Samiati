"use client";

import React, { use } from "react";
import ChallengeDetailsScreen from "@/components/screens/ChallengeDetailsScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { Screen } from "@/types";

export default function ChallengeDetailsPage({ searchParams }: { searchParams: Promise<any> }) {
    const { navigate, goBack } = useNavigation();
    const resolvedSearchParams = use(searchParams);
    const challengeId = resolvedSearchParams.id;

    return (
        <ChallengeDetailsScreen
            navigate={navigate}
            goBack={goBack}
            onViewProfile={(user) => navigate(Screen.PROFILE, { user })}
            challenge={{
                id: challengeId || "1",
                title: "Mock Challenge",
                desc: "Description",
                tag: "Community",
                difficulty: "Medium",
                participants: 120,
                timeLeft: "2 days left",
                reward: "200 XP",
                image: "https://example.com/image.jpg"
            } as any}
        />
    );
}
