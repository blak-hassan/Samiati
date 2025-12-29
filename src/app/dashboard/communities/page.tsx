"use client";

import CommunitiesScreen from "@/components/screens/CommunitiesScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Community } from "@/types";

export default function CommunitiesPage() {
    const { navigate, goBack } = useNavigation();

    // Fetch communities
    // TODO: Add category filter state if needed, for now fetch all
    const communitiesData = useQuery(api.communities.queries.list, {});

    const communities: Community[] = (communitiesData || []).map((c: any) => ({
        id: c._id,
        name: c.name,
        description: c.description,
        memberCount: c.memberCount,
        avatar: c.avatar || "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=60", // Fallback
        coverImage: c.coverImage || "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=60", // Fallback
        isPrivate: c.isPrivate,
        category: c.category,
        role: c.role || 'member',
        members: [] // Placeholder, list query doesn't return members
    }));

    return (
        <CommunitiesScreen
            navigate={navigate}
            goBack={goBack}
            communities={communities}
        />
    );
}

