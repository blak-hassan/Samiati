"use client";

import React, { use } from "react";
import StoryDetailScreen from "@/components/screens/StoryDetailScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { RouteSearchParams, Screen } from "@/types";

export default function StoryDetailPage({ searchParams }: { searchParams: Promise<RouteSearchParams> }) {
    const { navigate, goBack } = useNavigation();
    const resolvedSearchParams = use(searchParams);
    const story = resolvedSearchParams.story ? JSON.parse(resolvedSearchParams.story as string) : undefined;

    return (
        <StoryDetailScreen
            key={story?.title ?? "default-story"}
            navigate={navigate}
            goBack={goBack}
            story={story}
            onViewProfile={(user) => navigate(Screen.PROFILE, { user })}
        />
    );
}
