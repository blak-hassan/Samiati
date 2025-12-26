"use client";

import ProfileScreen from "@/components/screens/ProfileScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { User } from "@/types";
import { INITIAL_LANGUAGES_STATE } from "@/data/mock";

export default function GuestProfilePage() {
    const { navigate, goBack } = useNavigation();

    const guestUser: User = {
        name: "Guest User",
        handle: "@guest",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKkfM9WqTPsqCfuM1KQIQ1QzsbiAaq2rab_EQ2MwL_8b9sbJ3-mIl3CjDCR888PPrsBNhkpl7tkden40rCqo3pJe3Sepe18k46KUvejTidyoAK941vcqejBnqRrcfC5hPZop_XFQ7S9jkteso1RvDSjv8s1JfGwGhOYE1uQ1M1J93quDxOniTqTNGD-1WZq2GOu_Z1EpzGjMzNeyvhYbuIwiqYK1TDLfGX5mpdg--_df6DoewiFO-RhrraeKpwY7MetQ94avb6spo",
        isGuest: true,
        bio: "Just visiting the Samiati ecosystem."
    };

    return (
        <ProfileScreen
            user={guestUser}
            navigate={navigate}
            goBack={goBack}
            isOwnProfile={false}
            languages={INITIAL_LANGUAGES_STATE}
        />
    );
}
