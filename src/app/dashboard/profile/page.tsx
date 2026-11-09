'use client';

export const dynamic = 'force-dynamic';

import dynamicImport from 'next/dynamic';
import { ServiceUnavailable } from '@/components/shared/ServiceUnavailable';
import { useNavigation } from '@/hooks/useNavigation';
import { useAppUser } from '@/hooks/useAppUser';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { LanguageSkill, User } from '@/types';
import { localConversationService } from '@/services/localConversationService';
import { useEffect, useMemo, useState } from 'react';

const ProfileScreen = dynamicImport(() => import('@/components/screens/ProfileScreen'), {
  ssr: false,
});

export default function ProfilePage() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL)
    return (
      <ServiceUnavailable
        feature="Your profile"
        active="profile"
        description="Your languages, conversations, and contributions, all in one place. Account activity will appear when this workspace is connected."
      />
    );
  return <LiveProfilePage />;
}

function LiveProfilePage() {
  const { navigate, goBack } = useNavigation();
  const { languages, user: clerkUser } = useAppUser();
  const dashboard = useQuery(api.profile.queries.getDashboard, {});

  // Conversations live in localStorage (client-side only), so their counts
  // are honest snapshots of real sessions.
  const conversationCount = useMemo(() => {
    if (typeof window === 'undefined') return { count: 0, messages: 0 };
    const conversations = localConversationService.getConversations();
    const messageCount = conversations.reduce((sum, c) => sum + c.messages.length, 0);
    return {
      count: conversations.length,
      messages: messageCount,
    };
  }, []);

  // dashboard: undefined = still loading, null = resolved with no data
  const profile = dashboard?.profile ?? null;
  const fallbackName = clerkUser?.fullName || 'Guest';
  const fallbackHandle = clerkUser?.username ? `@${clerkUser.username}` : '@guest';

  // Transform database user to App User Type, falling back to clerkUser if profile is null
  const appUser: User = profile
    ? {
        name: (profile.name as string) || fallbackName,
        handle: (profile.handle as string) || fallbackHandle,
        avatar: (profile.avatar as string) || clerkUser?.imageUrl || '',
        isGuest: !!profile.isGuest,
        bio: (profile.bio as string) || '',
        culturalBackground: profile.culturalBackground as string | undefined,
        location: profile.location as string | undefined,
        xp: profile.xp as number | undefined,
        level: profile.level as number | undefined,
        badges: profile.badges as string[] | undefined,
        followerCount: profile.followerCount as number | undefined,
        followingCount: profile.followingCount as number | undefined,
        languages: profile.languages as LanguageSkill[] | undefined,
        role: profile.role as User['role'],
      }
    : {
        name: fallbackName,
        handle: fallbackHandle,
        avatar: clerkUser?.imageUrl || '',
        isGuest: !clerkUser,
        bio: '',
        xp: 0,
        level: 1,
        badges: [],
        followerCount: 0,
        followingCount: 0,
        languages: languages,
        role: 'member',
      };

  // Never block on Convex — show the profile immediately with fallback data.
  // When the query resolves, ProfileScreen re-renders with real data.
  //
  // The skeleton is shown for a short grace period only. If the query is
  // slow, unavailable, or the visitor is not signed in, the page falls back
  // to the profile we already have rather than showing a skeleton forever.
  const [graceExpired, setGraceExpired] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setGraceExpired(true), 1200);
    return () => clearTimeout(timer);
  }, []);
  const showSkeleton = dashboard === undefined && !graceExpired;

  return (
    <ProfileScreen
      user={appUser}
      navigate={navigate}
      goBack={goBack}
      isOwnProfile={dashboard === undefined ? true : !!profile?.isMe}
      languages={languages}
      dashboard={dashboard ?? null}
      loading={showSkeleton}
      conversationCount={conversationCount.count}
      messageCount={conversationCount.messages}
    />
  );
}
