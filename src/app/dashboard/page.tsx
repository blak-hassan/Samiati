"use client";

import React from "react";
import { useNavigation } from "@/hooks/useNavigation";
import { useUser as useClerkUser } from "@clerk/nextjs";
import HomeSearchScreen from "@/components/screens/HomeSearchScreen";
import GuestBanner from "@/components/auth/GuestBanner";

export default function DashboardPage() {
  const { navigate } = useNavigation();
  const { user: clerkUser, isLoaded } = useClerkUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-dark">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If not signed in, show the same search interface as homepage (guest mode)
  if (!clerkUser) {
    return (
      <>
        <GuestBanner navigate={navigate} />
        <HomeSearchScreen navigate={navigate} />
      </>
    );
  }

  const appUser = {
    name: clerkUser.fullName || "User",
    handle: "@" + (clerkUser.username || "user"),
    avatar: clerkUser.imageUrl,
    role: "member" as const,
    location: undefined,
    culturalBackground: undefined,
    isGuest: false,
  };

  return (
    <HomeSearchScreen
      user={appUser}
      navigate={navigate}
      unreadCount={0}
      notificationCounts={{ contributions: 0, moderation: 0 }}
    />
  );
}
