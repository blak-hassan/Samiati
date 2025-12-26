"use client";

import ComposePostScreen from "@/components/screens/ComposePostScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { Screen } from "@/types";
import { useUser } from "../../MockProviders";
import { User } from "@/types";

export default function ComposePostPage() {
    const { navigate, goBack } = useNavigation();
    const { user: clerkUser } = useUser();

    const appUser: User = clerkUser ? {
        name: clerkUser.fullName || "User",
        handle: "@" + (clerkUser.username || "user"),
        avatar: clerkUser.imageUrl,
        isGuest: false,
    } : {
        name: "Guest",
        handle: "@guest",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKkfM9WqTPsqCfuM1KQIQ1QzsbiAaq2rab_EQ2MwL_8b9sbJ3-mIl3CjDCR888PPrsBNhkpl7tkden40rCqo3pJe3Sepe18k46KUvejTidyoAK941vcqejBnqRrcfC5hPZop_XFQ7S9jkteso1RvDSjv8s1JfGwGhOYE1uQ1M1J93quDxOniTqTNGD-1WZq2GOu_Z1EpzGjMzNeyvhYbuIwiqYK1TDLfGX5mpdg--_df6DoewiFO-RhrraeKpwY7MetQ94avb6spo",
        isGuest: true
    };

    return (
        <ComposePostScreen
            user={appUser}
            navigate={navigate}
            goBack={goBack}
            onPost={() => navigate(Screen.MESSAGES)}
        />
    );
}
