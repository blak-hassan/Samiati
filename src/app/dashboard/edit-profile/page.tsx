"use client";

import EditProfileScreen from "@/components/screens/EditProfileScreen";
import { PLACEHOLDER_AVATAR_URL } from "@/lib/defaults";
import { useNavigation } from "@/hooks/useNavigation";
import { useAppUser } from "@/hooks/useAppUser";
import { Screen } from "@/types";
import { User } from "@/types";

export default function EditProfilePage() {
    const { navigate, goBack } = useNavigation();
    const { user: clerkUser } = useAppUser();

    const appUser: User = clerkUser ? {
        name: clerkUser.name || "User",
        avatar: clerkUser.avatar,
        isGuest: false,
        bio: "Digital Storyteller",
    } : {
        name: "Guest",
        avatar: PLACEHOLDER_AVATAR_URL,
        isGuest: true
    };

    return (
        <EditProfileScreen
            navigate={navigate}
            goBack={goBack}
        />
    );
}
