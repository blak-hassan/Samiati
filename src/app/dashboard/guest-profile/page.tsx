"use client";

import ProfileScreen from "@/components/screens/ProfileScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useAppUser } from "@/hooks/useAppUser";
import { User } from "@/types";

export default function GuestProfilePage() {
    const { navigate, goBack } = useNavigation();
    const { user: appUser } = useAppUser();

    const guestUser: User = {
        name: appUser?.fullName || "Guest User",
        handle: "@" + (appUser?.username || "guest"),
        avatar: appUser?.imageUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuDKkfM9WqTPsqCfuM1KQIQ1QzsbiAaq2rab_EQ2MwL_8b9sbJ3-mIl3CjDCR888PPrsBNhkpl7tkden40rCqo3pJe3Sepe18k46KUvejTidyoAK941vcqejBnqRrcfC5hPZop_XFQ7S9jkteso1RvDSjv8s1JfGwGhOYE1uQ1M1J93quDxOniTqTNGD-1WZq2GOu_Z1EpzGjMzNeyvhYbuIwiqYK1TDLfGX5mpdg--_df6DoewiFO-RhrraeKpwY7MetQ94avb6spo",
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
