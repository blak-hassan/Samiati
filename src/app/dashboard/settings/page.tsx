"use client";

import SettingsScreen from "@/components/screens/SettingsScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useUser, useClerk } from "../../MockProviders";
import { useState, useEffect } from "react";
import { User } from "@/types";

export default function SettingsPage() {
    const { navigate, goBack } = useNavigation();
    const { user: clerkUser } = useUser();
    const { signOut } = useClerk();
    const [isDarkMode, setIsDarkMode] = useState(true);

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    // Apply theme
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    // Transform Clerk User to App User
    const appUser: User = clerkUser ? {
        name: clerkUser.fullName || "User",
        handle: "@" + (clerkUser.username || "user"),
        avatar: clerkUser.imageUrl,
        isGuest: false,
        role: 'moderator', // For testing moderation features
    } : {
        name: "Guest",
        handle: "@guest",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKkfM9WqTPsqCfuM1KQIQ1QzsbiAaq2rab_EQ2MwL_8b9sbJ3-mIl3CjDCR888PPrsBNhkpl7tkden40rCqo3pJe3Sepe18k46KUvejTidyoAK941vcqejBnqRrcfC5hPZop_XFQ7S9jkteso1RvDSjv8s1JfGwGhOYE1uQ1M1J93quDxOniTqTNGD-1WZq2GOu_Z1EpzGjMzNeyvhYbuIwiqYK1TDLfGX5mpdg--_df6DoewiFO-RhrraeKpwY7MetQ94avb6spo",
        isGuest: true,
        role: 'member',
    };

    return (
        <SettingsScreen
            navigate={navigate}
            goBack={goBack}
            onSignOut={() => {
                signOut(() => navigate('WELCOME' as any)); // Redirect to welcome after signout
            }}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            user={appUser}
        />
    );
}
