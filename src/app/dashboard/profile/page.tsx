"use client";

export const dynamic = 'force-dynamic';

import dynamicImport from "next/dynamic";
import { useNavigation } from "@/hooks/useNavigation";
import { useUser } from "../../MockProviders";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { LanguageSkill, User } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { localConversationService } from "@/services/localConversationService";
import { useMemo } from "react";

const ProfileScreen = dynamicImport(() => import("@/components/screens/ProfileScreen"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background-dark gap-4">
      <Skeleton className="w-8 h-8 rounded-full" />
      <Skeleton className="w-32 h-4" />
    </div>
  ),
});

export default function ProfilePage() {
    const { navigate, goBack } = useNavigation();
    const { languages, user: clerkUser } = useUser();
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

    const profile = dashboard?.profile ?? null;
    const fallbackName = clerkUser?.fullName || "Guest";
    const fallbackHandle = clerkUser?.username ? `@${clerkUser.username}` : "@guest";

    // Transform database user to App User Type, falling back to clerkUser if profile is null
    const appUser: User = profile ? {
        name: (profile.name as string) || fallbackName,
        handle: (profile.handle as string) || fallbackHandle,
        avatar: (profile.avatar as string) || clerkUser?.imageUrl || "",
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
        handle: fallbackHandle,
        avatar: clerkUser?.imageUrl || "",
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

    return (
        <ProfileScreen
            user={appUser}
            navigate={navigate}
            goBack={goBack}
            isOwnProfile={dashboard === undefined ? true : !!profile?.isMe}
            languages={languages}
            dashboard={dashboard}
            loading={dashboard === undefined}
            conversationCount={conversationCount.count}
            messageCount={conversationCount.messages}
        />
    );
}