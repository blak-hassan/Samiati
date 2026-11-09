"use client";

import { useClerk as useClerkAuth } from "@clerk/nextjs";
import { useClerk as useMockClerk } from "@/app/MockProviders";
import { isDemoMode } from "@/lib/appMode";
import SettingsAccountScreen from "@/components/screens/SettingsAccountScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useAppUser } from "@/hooks/useAppUser";
import { Screen, User } from "@/types";

const useClerk = isDemoMode ? useMockClerk : useClerkAuth;

export default function SettingsAccountPage() {
    const { navigate } = useNavigation();
    const { user: clerkUser, email, twoFactorEnabled } = useAppUser();
    const clerk = useClerk();

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

    // The identity provider owns password, 2FA, sessions and account
    // deletion, so those actions hand off to its own account panel.
    const openAccountPanel = () => {
        const openUserProfile = (clerk as { openUserProfile?: () => void }).openUserProfile;
        if (typeof openUserProfile === 'function') {
            openUserProfile.call(clerk);
        }
    };

    return (
        <SettingsAccountScreen
            user={appUser}
            email={email}
            twoFactorEnabled={twoFactorEnabled}
            onManageAccount={openAccountPanel}
            onChangePassword={() => navigate(Screen.CHANGE_PASSWORD)}
        />
    );
}
