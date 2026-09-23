"use client";

import React, { useMemo } from "react";
import { useNavigation } from "@/hooks/useNavigation";
import { useUser as useClerkUser, useClerk as useClerkAuth } from "@clerk/nextjs";
import { useUser as useMockUser, useClerk as useMockClerk } from "@/app/MockProviders";
import { isDemoMode } from "@/lib/appMode";
import { useSyncExternalStore } from "react";
import { Screen } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import SettingsShell from "@/components/settings/SettingsShell";

const useUser = isDemoMode ? useMockUser : useClerkUser;
const useClerk = isDemoMode ? useMockClerk : useClerkAuth;

const emptySubscribe = () => () => {};

interface Props {
  activeScreen: Screen;
  children: React.ReactNode;
}

const SettingsLayoutClient: React.FC<Props> = ({ activeScreen, children }) => {
  const { navigate, goBack } = useNavigation();
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();
  const isHydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Single source of truth for the theme — see `useTheme`.
  const { isDark, toggleTheme, saving } = useTheme();

  const appUser = useMemo(() => clerkUser ? {
    name: clerkUser.fullName || "User",
    avatar: clerkUser.imageUrl,
  } : { name: "Guest", avatar: "" }, [clerkUser]);

  if (!isHydrated || !isLoaded) {
    return null;
  }

  return (
    <SettingsShell
      activeScreen={activeScreen}
      navigate={navigate}
      goBack={goBack}
      isDarkMode={isDark}
      toggleTheme={toggleTheme}
      saving={saving}
      onSignOut={async () => {
        try {
          await signOut();
        } catch {
          // ignore — even if Clerk sign-out fails, send the user to the welcome screen.
        }
        navigate(Screen.WELCOME);
      }}
      user={appUser}
    >
      {children}
    </SettingsShell>
  );
};

export default SettingsLayoutClient;
