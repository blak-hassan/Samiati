"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import EditProfileScreen, { ProfilePatch } from "@/components/screens/EditProfileScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useAppUser } from "@/hooks/useAppUser";
import { LanguageSkill, User } from "@/types";

export default function EditProfilePage() {
    const { navigate, goBack } = useNavigation();
    const { user: clerkUser, languages, setLanguages } = useAppUser();
    const dashboard = useQuery(api.profile.queries.getDashboard, {});
    const updateProfile = useMutation(api.users.mutations.updateProfile);
    const [unreadCount] = useState(0);

    // The Convex row is the source of truth; Clerk only supplies the fields
    // Samiati does not own (the sign-in identity itself).
    const profile = dashboard?.profile;

    const appUser: User = profile ? {
        name: (profile.name as string) || clerkUser?.fullName || "User",
        handle: "@" + ((profile.handle as string) || clerkUser?.username || "user"),
        avatar: (profile.avatar as string) || clerkUser?.imageUrl || "",
        isGuest: !!profile.isGuest,
        bio: (profile.bio as string) || "",
        culturalBackground: profile.culturalBackground as string | undefined,
        location: profile.location as string | undefined,
    } : {
        name: clerkUser?.fullName || "User",
        handle: "@" + (clerkUser?.username || "user"),
        avatar: clerkUser?.imageUrl || "",
        isGuest: false,
        bio: "",
    };

    const profileLanguages: LanguageSkill[] =
        (profile?.languages as LanguageSkill[] | undefined) ?? languages;

    const handleSave = async (patch: ProfilePatch) => {
        await updateProfile(patch);
        // Keep the in-memory language list in step with what was just saved.
        if (patch.languages) {
            setLanguages(patch.languages);
        }
    };

    return (
        <EditProfileScreen
            navigate={navigate}
            goBack={goBack}
            user={appUser}
            languages={profileLanguages}
            onSave={handleSave}
            unreadCount={unreadCount}
        />
    );
}
