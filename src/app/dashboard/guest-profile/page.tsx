"use client";

import ProfileScreen from "@/components/screens/ProfileScreen";
import { PLACEHOLDER_AVATAR_URL } from "@/lib/defaults";
import { useNavigation } from "@/hooks/useNavigation";
import { useAppUser } from "@/hooks/useAppUser";
import { User } from "@/types";

export default function GuestProfilePage() {
    const { navigate, goBack } = useNavigation();
    const { user: appUser } = useAppUser();

    const guestUser: User = {
        name: appUser?.name || "Guest User",
        avatar: appUser?.avatar || PLACEHOLDER_AVATAR_URL,
        isGuest: true,
        bio: "You're exploring Samiati as a guest. Sign in to save your conversations, keep your contributions, and unlock Changa rewards.",
    };

    return (
        <ProfileScreen
            user={guestUser}
            navigate={navigate}
            goBack={goBack}
            isOwnProfile={false}
            languages={[]}
        />
    );
}
