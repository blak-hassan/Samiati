"use client";
import ProfileScreen from "@/components/screens/ProfileScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useUser } from "../../MockProviders";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { User } from "@/types";

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
        languages: profile.languages as any,
        role: profile.role,
    } : {
        name: clerkUser?.fullName || "Guest",
        handle: clerkUser?.username ? `@${clerkUser.username}` : "@guest",
        avatar: clerkUser?.imageUrl || "",
        isGuest: false,
        bio: "Welcome to my profile!",
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
