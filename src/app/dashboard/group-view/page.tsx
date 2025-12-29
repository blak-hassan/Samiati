"use client";
import React, { use } from "react";
import { useNavigation } from "@/hooks/useNavigation";
import GroupScreen from "@/components/screens/GroupScreen";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Community } from "@/types";

export default function GroupViewPage({ searchParams }: { searchParams: Promise<any> }) {
    const { navigate, goBack } = useNavigation();
    const resolvedSearchParams = use(searchParams);

    // Try to get community from params (passed from list)
    const paramCommunity = resolvedSearchParams.community ? JSON.parse(resolvedSearchParams.community) : null;
    const communityId = paramCommunity?.id || resolvedSearchParams.groupId;

    // Fetch fresh data
    const communityData = useQuery(api.communities.queries.get,
        communityId ? { communityId: communityId as Id<"communities"> } : "skip"
    );

    // Merge or fallback
    const community: Community | undefined = communityData ? {
        id: communityData._id,
        name: communityData.name,
        description: communityData.description,
        memberCount: communityData.memberCount,
        avatar: communityData.avatar || "",
        coverImage: communityData.coverImage || "",
        isPrivate: communityData.isPrivate,
        category: communityData.category,
        role: communityData.role || 'none',
        members: [] // fetch members separately if needed
    } : paramCommunity;

    if (!community) {
        return <div className="p-8 text-center">Loading community...</div>;
    }

    return (
        <GroupScreen
            navigate={navigate}
            goBack={goBack}
            community={community}
        />
    );
}

