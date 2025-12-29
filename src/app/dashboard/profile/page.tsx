"use client";
import ProfileScreen from "@/components/screens/ProfileScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { User } from "@/types";
import { INITIAL_LANGUAGES_STATE } from "@/data/mock";

export default function ProfilePage() {
    const { navigate, goBack } = useNavigation();
    const profile = useQuery(api.users.queries.getProfile, {});

    if (!profile) {
        // Loading state
        return null; // Or a spinner
    }

    // Transform database user to App User Type
    const appUser: User = {
        name: profile.name,
        handle: profile.handle, // Should include @ if needed, logic check
        avatar: profile.avatar,
        isGuest: profile.isGuest,
        bio: profile.bio || "",
        xp: profile.xp,
        level: profile.level,
        badges: profile.badges,
        followerCount: profile.followerCount,
        followingCount: profile.followingCount,
        languages: profile.languages as any, // Type mismatch needs check
        role: profile.role,
    };

    return (
        <ProfileScreen
            user={appUser}
            navigate={navigate}
            goBack={goBack}
            isOwnProfile={true}
            languages={INITIAL_LANGUAGES_STATE} // TODO: Use profile.languages
        />
    );
}

