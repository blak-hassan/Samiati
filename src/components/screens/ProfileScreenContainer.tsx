"use client";

import React, { useMemo } from "react";
import dynamicImport from "next/dynamic";
import { useNavigation } from "@/hooks/useNavigation";
import { useAppUser } from "@/hooks/useAppUser";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LanguageSkill, User } from "@/types";
import { localConversationService } from "@/services/localConversationService";

const ProfileScreen = dynamicImport(() => import("@/components/screens/ProfileScreen"), {
  ssr: false,
});

/**
 * Data wiring for ProfileScreen (own-profile dashboard query, user
 * transformation, local conversation counts). Shared by the standalone
 * /dashboard/profile page and the settings-shell "View profile" pane so
 * the wiring lives in exactly one place.
 */
const ProfileScreenContainer: React.FC = () => {
    const { navigate, goBack } = useNavigation();
    const { languages, user: clerkUser } = useAppUser();
    const dashboard = useQuery(api.profile.queries.getDashboard, {});

    // Conversations live in localStorage (client-side only), so their counts
    // are honest snapshots of real sessions.
    const conversationCount = useMemo(() => {
        if (typeof window === "undefined") return { count: 0, messages: 0 };
        const conversations = localConversationService.getConversations();
        const messageCount = conversations.reduce((sum, c) => sum + c.messages.length, 0);
        return {
            count: conversations.length,
            messages: messageCount,
        };
    }, []);

    // dashboard: undefined = still loading, null = resolved with no data
    const profile = dashboard?.profile ?? null;
    const fallbackName = clerkUser?.name || "Guest";

    // Transform database user to App User Type, falling back to clerkUser if profile is null
    const appUser: User = profile ? {
        name: (profile.name as string) || fallbackName,
        avatar: (profile.avatar as string) || clerkUser?.avatar || "",
        isGuest: !!profile.isGuest,
        bio: (profile.bio as string) || "",
        culturalBackground: profile.culturalBackground as string | undefined,
        location: profile.location as string | undefined,
        xp: profile.xp as number | undefined,
        level: profile.level as number | undefined,
        badges: profile.badges as string[] | undefined,
        followerCount: profile.followerCount as number | undefined,
        followingCount: profile.followingCount as number | undefined,
        languages: profile.languages as LanguageSkill[] | undefined,
        role: profile.role as User["role"],
    } : {
        name: fallbackName,
        avatar: clerkUser?.avatar || "",
        isGuest: false,
        bio: "",
        xp: 0,
        level: 1,
        badges: [],
        followerCount: 0,
        followingCount: 0,
        languages: languages,
        role: 'member'
    };

    // Never block on Convex — show profile immediately with fallback data.
    // When the query resolves, ProfileScreen re-renders with real data.
    return (
        <ProfileScreen
            user={appUser}
            navigate={navigate}
            goBack={goBack}
            isOwnProfile={dashboard === undefined ? true : !!profile?.isMe}
            languages={languages}
            dashboard={dashboard ?? null}
            loading={false}
            conversationCount={conversationCount.count}
            messageCount={conversationCount.messages}
        />
    );
};

export default ProfileScreenContainer;