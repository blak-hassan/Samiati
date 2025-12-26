"use client";

import React, { use } from "react";
import StoryDetailScreen from "@/components/screens/StoryDetailScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { Screen } from "@/types";

export default function StoryDetailPage({ searchParams }: { searchParams: Promise<any> }) {
    const { navigate, goBack } = useNavigation();
    const resolvedSearchParams = use(searchParams);
    const story = resolvedSearchParams.story ? JSON.parse(resolvedSearchParams.story as string) : undefined;

    return (
        <StoryDetailScreen
            navigate={navigate}
            goBack={goBack}
            story={story}
            onViewProfile={(user) => navigate(Screen.PROFILE, { user })}
        />
    );
}
