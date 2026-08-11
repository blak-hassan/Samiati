"use client";

export const dynamic = 'force-dynamic';

import dynamicImport from "next/dynamic";
import { useNavigation } from "@/hooks/useNavigation";
import { useUser } from "../../MockProviders";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { LanguageSkill, User } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

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
    const profile = useQuery(api.users.queries.getProfile, {});

    // Transform database user to App User Type, falling back to clerkUser if profile is null
    const appUser: User = profile ? {
        name: profile.name,
        handle: profile.handle,
        avatar: profile.avatar,
        isGuest: profile.isGuest,
        bio: profile.bio || "",
        xp: profile.xp,
        level: profile.level,
        badges: profile.badges,
        followerCount: profile.followerCount,
        followingCount: profile.followingCount,
        languages: profile.languages as LanguageSkill[] | undefined,
        role: profile.role,
    } : {
        name: clerkUser?.fullName || "Guest",
        handle: clerkUser?.username ? `@${clerkUser.username}` : "@guest",
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
            isOwnProfile={true}
            languages={languages}
        />
    );
}
