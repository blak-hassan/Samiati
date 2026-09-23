"use client";

import { useUser as useClerkUser } from "@clerk/nextjs";
import { useUser as useMockUser } from "@/app/MockProviders";
import { isDemoMode } from "@/lib/appMode";
import {
  Challenge,
  ContributionItem,
  LanguageSkill,
  NotificationItem,
  User,
  UserRole,
  ValidationItem,
} from "@/types";

/**
 * Unified user hook that works in both demo (mock) and production (Clerk)
 * modes. The mock context carries app-level demo state (languages, Changa
 * contributions, notifications, moderation items); production has no
 * equivalent backend yet, so those fields fall back to safe empty defaults
 * while identity/auth state come from Clerk.
 *
 * Importing `useUser` directly from `@/app/MockProviders` in screens/pages is
 * a bug: in production the mock context is absent and the hook falls back to
 * `user: null`, silently degrading every signed-in user to "Guest".
 */
export function useAppUser() {
  const useUser = isDemoMode ? useMockUser : useClerkUser;
  const data = useUser();

  if (isDemoMode) {
    const mock = data as ReturnType<typeof useMockUser>;
    const demoUser: User | null = mock.user
      ? {
          id: mock.user.id,
          name: mock.user.fullName,
          avatar: mock.user.imageUrl,
          isGuest: false,
          role: 'member',
        }
      : null;
    return {
      user: demoUser,
      isLoaded: mock.isLoaded,
      isSignedIn: mock.isSignedIn,
      languages: mock.languages,
      setLanguages: mock.setLanguages,
      myContributions: mock.myContributions,
      setMyContributions: mock.setMyContributions,
      saveContribution: mock.saveContribution,
      moderationItems: mock.moderationItems,
      reviewContribution: mock.reviewContribution,
      voteOnModerationItem: mock.voteOnModerationItem,
      notifications: mock.notifications,
      unreadCount: mock.unreadCount,
      markAllAsRead: mock.markAllAsRead,
      markAsRead: mock.markAsRead,
      challenges: mock.challenges,
      addChallenge: mock.addChallenge,
    };
  }

  const clerk = data as { user: { id: string; fullName: string | null; username: string | null; imageUrl: string } | null; isLoaded: boolean };

  const noop = () => {};
  const noopState = () => {};
  const clerkUser: User | null = clerk.user
    ? {
        id: clerk.user.id,
        name: clerk.user.fullName ?? clerk.user.username ?? 'Member',
        avatar: clerk.user.imageUrl,
        isGuest: false,
        role: 'member' as UserRole,
      }
    : null;
  return {
    user: clerkUser,
    isLoaded: clerk.isLoaded,
    isSignedIn: !!clerk.user,
    languages: [] as LanguageSkill[],
    setLanguages: noopState as (languages: LanguageSkill[]) => void,
    myContributions: [] as ContributionItem[],
    setMyContributions: noopState,
    saveContribution: ((item: ContributionItem) => item) as (item: ContributionItem) => ContributionItem,
    moderationItems: [] as ValidationItem[],
    reviewContribution: noop,
    voteOnModerationItem: noop,
    notifications: [] as NotificationItem[],
    unreadCount: 0,
    markAllAsRead: noop,
    markAsRead: noop,
    challenges: [] as Challenge[],
    addChallenge: noop,
  };
}