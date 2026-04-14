"use client";

import React, { use, useState } from 'react';
import { notFound } from 'next/navigation';
import { ChatPreview, RouteSearchParams, Screen, User } from '@/types';
import { useNavigation } from "@/hooks/useNavigation";
import { useUser } from "../../MockProviders";

// Mock Data
import {
    INITIAL_CONVERSATIONS,
    INITIAL_LANGUAGES_STATE,
} from "@/data/mock";

// Screen Imports
import ChallengeDetailsScreen from '@/components/screens/ChallengeDetailsScreen';
import ChallengeWinnersScreen from '@/components/screens/ChallengeWinnersScreen';
import ProfileScreen from '@/components/screens/ProfileScreen';
import EditProfileScreen from '@/components/screens/EditProfileScreen';
import SettingsAccountScreen from '@/components/screens/SettingsAccountScreen';
import SettingsNotificationsScreen from '@/components/screens/SettingsNotificationsScreen';
import SettingsPrivacyScreen from '@/components/screens/SettingsPrivacyScreen';
import SettingsHelpScreen from '@/components/screens/SettingsHelpScreen';
import SettingsBlockedScreen from '@/components/screens/SettingsBlockedScreen';
import SettingsMutedScreen from '@/components/screens/SettingsMutedScreen';
import SettingsDataScreen from '@/components/screens/SettingsDataScreen';
import NotificationsScreen from '@/components/screens/NotificationsScreen';
import ContributionsScreen from '@/components/screens/ContributionsScreen';
import SavedConversationsScreen from '@/components/screens/SavedConversationsScreen';
import SubmitEntryScreen from '@/components/screens/SubmitEntryScreen';
import AddChallengeScreen from '@/components/screens/AddChallengeScreen';
import ProverbDetailScreen from '@/components/screens/ProverbDetailScreen';
import StoryDetailScreen from '@/components/screens/StoryDetailScreen';
import WordDetailScreen from '@/components/screens/WordDetailScreen';
import ModerationDashboardScreen from '@/components/screens/ModerationDashboardScreen';
import ConfirmationScreen from '@/components/screens/ConfirmationScreen';
import SuggestChallengeScreen from '@/components/screens/SuggestChallengeScreen';
import SuggestLinkScreen from '@/components/screens/SuggestLinkScreen';
import ChangePasswordScreen from '@/components/screens/ChangePasswordScreen';
import AllAchievementsScreen from '@/components/screens/AllAchievementsScreen';
import ManageLanguagesScreen from '@/components/screens/ManageLanguagesScreen';
import PostThreadScreen from '@/components/screens/PostThreadScreen';
import DirectMessageScreen from '@/components/screens/DirectMessageScreen';
import NewGroupScreen from '@/components/screens/NewGroupScreen';
import NewContactScreen from '@/components/screens/NewContactScreen';
import NewCommunityScreen from '@/components/screens/NewCommunityScreen';
import VideoCallScreen from '@/components/screens/VideoCallScreen';
import VoiceCallScreen from '@/components/screens/VoiceCallScreen';
import ContactInfoScreen from '@/components/screens/ContactInfoScreen';
import ComposePostScreen from '@/components/screens/ComposePostScreen';
import TermsOfServiceScreen from '@/components/screens/TermsOfServiceScreen';
import PrivacyPolicyScreen from '@/components/screens/PrivacyPolicyScreen';
// import ResetPasswordFlow from '@/components/screens/ResetPasswordFlow'; // Usually auth flow, but check logic

export default function DashboardCatchAllPage({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<RouteSearchParams> }) {
    const { navigate, goBack } = useNavigation();
    const { user: clerkUser, languages, setLanguages, notifications, unreadCount, markAllAsRead, markAsRead } = useUser();

    // Unwrap params synchronously using React.use() where needed, but params/searchParams are Promises in Next.js 15
    const resolvedParams = use(params);
    const resolvedSearchParams = use(searchParams);

    const slug = resolvedParams.slug;

    // Convert Slug to Screen Enum
    // e.g. "challenge-details" -> "CHALLENGE_DETAILS"
    const screenKey = slug.replace(/-/g, '_').toUpperCase();
    const screen = Screen[screenKey as keyof typeof Screen];

    const { myContributions, setMyContributions } = useUser();
    const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);

    // Transform Clerk User to App User
    const appUser: User = clerkUser ? {
        name: clerkUser.fullName || "User",
        handle: "@" + (clerkUser.username || "user"),
        avatar: clerkUser.imageUrl,
        isGuest: false,
        bio: "Digital Storyteller",
    } : {
        name: "Guest",
        handle: "@guest",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKkfM9WqTPsqCfuM1KQIQ1QzsbiAaq2rab_EQ2MwL_8b9sbJ3-mIl3CjDCR888PPrsBNhkpl7tkden40rCqo3pJe3Sepe18k46KUvejTidyoAK941vcqejBnqRrcfC5hPZop_XFQ7S9jkteso1RvDSjv8s1JfGwGhOYE1uQ1M1J93quDxOniTqTNGD-1WZq2GOu_Z1EpzGjMzNeyvhYbuIwiqYK1TDLfGX5mpdg--_df6DoewiFO-RhrraeKpwY7MetQ94avb6spo",
        isGuest: true
    };

    if (!screen) {
        return notFound();
    }

    // Helper handlers
    const handleViewProfile = (_user: User) => { };
    const handleLikePost = (_postId: string) => { };
    const handleRepost = (_postId: string) => { };
    const handleMarkAllRead = () => {
        markAllAsRead();
    };
    const handleNotificationClick = (id: string, targetScreen?: Screen) => {
        markAsRead(id);
        if (targetScreen) {
            navigate(targetScreen);
        }
    };
    const handleAddChat = (_chat: ChatPreview) => { };

    // Render logic adapted from App.tsx
    switch (screen) {
        case Screen.CHALLENGE_DETAILS: return <ChallengeDetailsScreen navigate={navigate} goBack={goBack} onViewProfile={handleViewProfile} unreadCount={unreadCount} challenge={resolvedSearchParams?.challenge ? JSON.parse(resolvedSearchParams.challenge as string) : undefined} />;
        case Screen.CHALLENGE_WINNERS: return <ChallengeWinnersScreen navigate={navigate} goBack={goBack} onViewProfile={handleViewProfile} />;
        case Screen.SUBMIT_ENTRY: return <SubmitEntryScreen navigate={navigate} goBack={goBack} challenge={resolvedSearchParams?.challenge ? JSON.parse(resolvedSearchParams.challenge as string) : undefined} />;
        case Screen.ADD_CHALLENGE: return <AddChallengeScreen navigate={navigate} goBack={goBack} />;
        case Screen.SUGGEST_CHALLENGE: return <SuggestChallengeScreen navigate={navigate} goBack={goBack} />;

        // Profile is handled by specific route, but fallback here if needed
        case Screen.PROFILE: return <ProfileScreen user={appUser} navigate={navigate} goBack={goBack} isOwnProfile={true} languages={languages} unreadCount={unreadCount} />;
        case Screen.GUEST_PROFILE: return <ProfileScreen user={appUser} navigate={navigate} goBack={goBack} isOwnProfile={false} languages={INITIAL_LANGUAGES_STATE} />; // Should pass actual other user
        case Screen.EDIT_PROFILE: return <EditProfileScreen navigate={navigate} goBack={goBack} unreadCount={unreadCount} />;

        // Settings sub-pages
        case Screen.SETTINGS_ACCOUNT: return <SettingsAccountScreen navigate={navigate} goBack={goBack} user={appUser} />;
        case Screen.SETTINGS_NOTIFICATIONS: return <SettingsNotificationsScreen navigate={navigate} goBack={goBack} />;
        case Screen.SETTINGS_PRIVACY: return <SettingsPrivacyScreen navigate={navigate} goBack={goBack} />;
        case Screen.SETTINGS_BLOCKED: return <SettingsBlockedScreen goBack={goBack} />;
        case Screen.SETTINGS_MUTED: return <SettingsMutedScreen goBack={goBack} />;
        case Screen.SETTINGS_DATA: return <SettingsDataScreen goBack={goBack} />;
        case Screen.SETTINGS_HELP: return <SettingsHelpScreen navigate={navigate} goBack={goBack} />;

        case Screen.CONTRIBUTIONS:
            return <ContributionsScreen
                navigate={navigate}
                goBack={goBack}
                myContributions={myContributions}
                setMyContributions={setMyContributions}
                languages={languages}
                onViewProfile={handleViewProfile}
                unreadCount={unreadCount}
            />;

        case Screen.NOTIFICATIONS:
            return <NotificationsScreen navigate={navigate} goBack={goBack} notifications={notifications} onMarkAllRead={handleMarkAllRead} onNotificationClick={handleNotificationClick} />;

        case Screen.SAVED_CONVERSATIONS: return <SavedConversationsScreen navigate={navigate} goBack={goBack} conversations={conversations} setConversations={setConversations} onChatSelect={(id) => navigate(Screen.HOME_CHAT, { chatId: id })} />;

        case Screen.PROVERB_DETAIL: return <ProverbDetailScreen navigate={navigate} goBack={goBack} unreadCount={unreadCount} />;
        case Screen.STORY_DETAIL: return <StoryDetailScreen navigate={navigate} goBack={goBack} unreadCount={unreadCount} story={resolvedSearchParams?.story ? JSON.parse(resolvedSearchParams.story as string) : undefined} onViewProfile={handleViewProfile} />;
        case Screen.WORD_DETAIL: return <WordDetailScreen navigate={navigate} goBack={goBack} unreadCount={unreadCount} />;

        case Screen.MODERATION_DASHBOARD: return <ModerationDashboardScreen navigate={navigate} goBack={goBack} unreadCount={unreadCount} />;

        case Screen.CHALLENGE_CREATED: return <ConfirmationScreen title="Challenge Created!" message="Your challenge is now live." onPrimary={() => navigate(Screen.CHALLENGE_DETAILS)} onSecondary={() => navigate(Screen.CONTRIBUTIONS)} />;
        case Screen.IDEA_SUBMITTED: return <ConfirmationScreen title="Idea Submitted" message="Your idea has been submitted." onPrimary={() => navigate(Screen.CONTRIBUTIONS)} onSecondary={() => navigate(Screen.HOME_CHAT)} icon="check" />;

        case Screen.SUGGEST_LINK: return <SuggestLinkScreen navigate={navigate} goBack={goBack} />;
        case Screen.CHANGE_PASSWORD: return <ChangePasswordScreen navigate={navigate} goBack={goBack} />;
        case Screen.ALL_ACHIEVEMENTS: return <AllAchievementsScreen goBack={goBack} />;
        case Screen.MANAGE_LANGUAGES: return <ManageLanguagesScreen navigate={navigate} goBack={goBack} languages={languages} onUpdateLanguages={setLanguages} />;

        case Screen.POST_THREAD: return <PostThreadScreen navigate={navigate} goBack={goBack} post={resolvedSearchParams?.post ? JSON.parse(resolvedSearchParams.post as string) : undefined} onLike={handleLikePost} onRepost={handleRepost} autoFocusReply={resolvedSearchParams?.autoFocusReply === 'true'} />;
        case Screen.DIRECT_MESSAGE: return <DirectMessageScreen navigate={navigate} goBack={goBack} chatUser={resolvedSearchParams?.chatUser ? JSON.parse(resolvedSearchParams.chatUser as string) : undefined} />;

        case Screen.NEW_GROUP: return <NewGroupScreen navigate={navigate} goBack={goBack} onCreateGroup={handleAddChat} />;
        case Screen.NEW_CONTACT: return <NewContactScreen navigate={navigate} goBack={goBack} />;
        case Screen.NEW_COMMUNITY: return <NewCommunityScreen navigate={navigate} goBack={goBack} onCreateCommunity={handleAddChat} />;

        case Screen.VIDEO_CALL: return <VideoCallScreen goBack={goBack} chatUser={resolvedSearchParams?.chatUser ? JSON.parse(resolvedSearchParams.chatUser as string) : undefined} />;
        case Screen.VOICE_CALL: return <VoiceCallScreen goBack={goBack} chatUser={resolvedSearchParams?.chatUser ? JSON.parse(resolvedSearchParams.chatUser as string) : undefined} />;
        case Screen.CONTACT_INFO: return <ContactInfoScreen navigate={navigate} goBack={goBack} chatUser={resolvedSearchParams?.chatUser ? JSON.parse(resolvedSearchParams.chatUser as string) : undefined} />;

        case Screen.COMPOSE_POST: return <ComposePostScreen navigate={navigate} goBack={goBack} onPost={() => { }} user={appUser} />;
        case Screen.TERMS_OF_SERVICE: return <TermsOfServiceScreen goBack={goBack} />;
        case Screen.PRIVACY_POLICY: return <PrivacyPolicyScreen goBack={goBack} />;

        default:
            return <div>Screen {slug} not found</div>;
    }
}
