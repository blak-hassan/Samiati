"use client";

export const dynamic = 'force-dynamic';

import CommunitiesScreen from "@/components/screens/CommunitiesScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Community } from "@/types";
import { Doc } from "../../../../convex/_generated/dataModel";

export default function CommunitiesPage() {
    const { navigate, goBack } = useNavigation();

    // Fetch communities
    // TODO: Add category filter state if needed, for now fetch all
    const communitiesData = useQuery(api.communities.queries.list, {});

    const communities: Community[] = ((communitiesData || []) as (Doc<"communities"> & { role?: Community["role"]; category?: Community["category"] })[]).map((c) => ({
        id: c._id,
        name: c.name,
        description: c.description,
        memberCount: c.memberCount,
        avatar: c.avatar || "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=60",
        coverImage: c.coverImage || "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=60",
        isPrivate: c.isPrivate,
        category: (c.category as Community["category"]) || "General",
        role: c.role || 'member',
        members: []
    }));

    return (
        <CommunitiesScreen
            navigate={navigate}
            goBack={goBack}
            communities={communities}
        />
    );
}
