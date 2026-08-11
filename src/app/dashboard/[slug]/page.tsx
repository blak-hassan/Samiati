"use client";

import React, { use, useState } from 'react';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ChatPreview, Conversation, RouteSearchParams, Screen, User } from '@/types';
import { useNavigation } from "@/hooks/useNavigation";
import { useUser } from "../../MockProviders";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import SignInPrompt from "@/components/auth/SignInPrompt";

// Dynamic Screen Imports — each loads only when needed
const ChallengeDetailsScreen = dynamic(() => import('@/components/screens/ChallengeDetailsScreen'), { ssr: false });
const ChallengeWinnersScreen = dynamic(() => import('@/components/screens/ChallengeWinnersScreen'), { ssr: false });
const ProfileScreen = dynamic(() => import('@/components/screens/ProfileScreen'), { ssr: false });
const EditProfileScreen = dynamic(() => import('@/components/screens/EditProfileScreen'), { ssr: false });
const SettingsAccountScreen = dynamic(() => import('@/components/screens/SettingsAccountScreen'), { ssr: false });
const SettingsNotificationsScreen = dynamic(() => import('@/components/screens/SettingsNotificationsScreen'), { ssr: false });
const SettingsPrivacyScreen = dynamic(() => import('@/components/screens/SettingsPrivacyScreen'), { ssr: false });
const SettingsHelpScreen = dynamic(() => import('@/components/screens/SettingsHelpScreen'), { ssr: false });
const SettingsBlockedScreen = dynamic(() => import('@/components/screens/SettingsBlockedScreen'), { ssr: false });
const SettingsMutedScreen = dynamic(() => import('@/components/screens/SettingsMutedScreen'), { ssr: false });
const SettingsDataScreen = dynamic(() => import('@/components/screens/SettingsDataScreen'), { ssr: false });
const NotificationsScreen = dynamic(() => import('@/components/screens/NotificationsScreen'), { ssr: false });
const ContributionsScreen = dynamic(() => import('@/components/screens/ContributionsScreen'), { ssr: false });
const SavedConversationsScreen = dynamic(() => import('@/components/screens/SavedConversationsScreen'), { ssr: false });
const SubmitEntryScreen = dynamic(() => import('@/components/screens/SubmitEntryScreen'), { ssr: false });
const AddChallengeScreen = dynamic(() => import('@/components/screens/AddChallengeScreen'), { ssr: false });
const ProverbDetailScreen = dynamic(() => import('@/components/screens/ProverbDetailScreen'), { ssr: false });
const StoryDetailScreen = dynamic(() => import('@/components/screens/StoryDetailScreen'), { ssr: false });
const WordDetailScreen = dynamic(() => import('@/components/screens/WordDetailScreen'), { ssr: false });
const ModerationDashboardScreen = dynamic(() => import('@/components/screens/ModerationDashboardScreen'), { ssr: false });
const ConfirmationScreen = dynamic(() => import('@/components/screens/ConfirmationScreen'), { ssr: false });
const SuggestChallengeScreen = dynamic(() => import('@/components/screens/SuggestChallengeScreen'), { ssr: false });
const SuggestLinkScreen = dynamic(() => import('@/components/screens/SuggestLinkScreen'), { ssr: false });
const ChangePasswordScreen = dynamic(() => import('@/components/screens/ChangePasswordScreen'), { ssr: false });
const AllAchievementsScreen = dynamic(() => import('@/components/screens/AllAchievementsScreen'), { ssr: false });
const ManageLanguagesScreen = dynamic(() => import('@/components/screens/ManageLanguagesScreen'), { ssr: false });
const PostThreadScreen = dynamic(() => import('@/components/screens/PostThreadScreen'), { ssr: false });
const DirectMessageScreen = dynamic(() => import('@/components/screens/DirectMessageScreen'), { ssr: false });
const NewGroupScreen = dynamic(() => import('@/components/screens/NewGroupScreen'), { ssr: false });
const NewContactScreen = dynamic(() => import('@/components/screens/NewContactScreen'), { ssr: false });
const NewCommunityScreen = dynamic(() => import('@/components/screens/NewCommunityScreen'), { ssr: false });
const VideoCallScreen = dynamic(() => import('@/components/screens/VideoCallScreen'), { ssr: false });
const VoiceCallScreen = dynamic(() => import('@/components/screens/VoiceCallScreen'), { ssr: false });
const ContactInfoScreen = dynamic(() => import('@/components/screens/ContactInfoScreen'), { ssr: false });
const ComposePostScreen = dynamic(() => import('@/components/screens/ComposePostScreen'), { ssr: false });
const TermsOfServiceScreen = dynamic(() => import('@/components/screens/TermsOfServiceScreen'), { ssr: false });
const PrivacyPolicyScreen = dynamic(() => import('@/components/screens/PrivacyPolicyScreen'), { ssr: false });
const ChangaScreen = dynamic(() => import('@/components/screens/ChangaScreen'), { ssr: false });
const DarasaScreen = dynamic(() => import('@/components/screens/DarasaScreen'), { ssr: false });

export default function DashboardCatchAllPage({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<RouteSearchParams> }) {
    const { navigate, goBack } = useNavigation();
    const { user: clerkUser, languages, setLanguages, notifications, unreadCount, markAllAsRead, markAsRead, myContributions, setMyContributions } = useUser();
    const { isGuest } = useCurrentUser();

    // Unwrap params synchronously using React.use() where needed, but params/searchParams are Promises in Next.js 15
    const resolvedParams = use(params);
    const resolvedSearchParams = use(searchParams);

    const slug = resolvedParams.slug;

    // Convert Slug to Screen Enum
    // e.g. "challenge-details" -> "CHALLENGE_DETAILS"
    const screenKey = slug.replace(/-/g, '_').toUpperCase();
    const screen = Screen[screenKey as keyof typeof Screen];

    const [conversations, setConversations] = useState<Conversation[]>([]);

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

    // Render logic — each case only triggers the dynamic import of the screen it needs
    switch (screen) {
        case Screen.CHALLENGE_DETAILS: return <ChallengeDetailsScreen navigate={navigate} goBack={goBack} onViewProfile={handleViewProfile} unreadCount={unreadCount} challenge={resolvedSearchParams?.challenge ? JSON.parse(resolvedSearchParams.challenge as string) : undefined} />;
        case Screen.CHALLENGE_WINNERS: return <ChallengeWinnersScreen navigate={navigate} goBack={goBack} onViewProfile={handleViewProfile} />;
        case Screen.SUBMIT_ENTRY: return <SubmitEntryScreen navigate={navigate} goBack={goBack} challenge={resolvedSearchParams?.challenge ? JSON.parse(resolvedSearchParams.challenge as string) : undefined} />;
        case Screen.ADD_CHALLENGE: return <AddChallengeScreen navigate={navigate} goBack={goBack} />;
        case Screen.SUGGEST_CHALLENGE: return <SuggestChallengeScreen navigate={navigate} goBack={goBack} />;

        // Profile is handled by specific route, but fallback here if needed
        case Screen.PROFILE: return <ProfileScreen user={appUser} navigate={navigate} goBack={goBack} isOwnProfile={true} languages={languages} unreadCount={unreadCount} />;
        case Screen.GUEST_PROFILE: return <ProfileScreen user={appUser} navigate={navigate} goBack={goBack} isOwnProfile={false} languages={languages} />; // Should pass actual other user
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
            if (isGuest) return <SignInPrompt feature="contribute" description="Join to contribute stories, words, and proverbs to the community." navigate={navigate} />;
            return <ContributionsScreen
                navigate={navigate}
                goBack={goBack}
                myContributions={myContributions}
                setMyContributions={setMyContributions}
                languages={languages}
                onViewProfile={handleViewProfile}
                unreadCount={unreadCount}
            />;

        case Screen.CHANGA:
            if (isGuest) return <SignInPrompt feature="Changa" description="Sign in to explore and contribute to cultural challenges." navigate={navigate} />;
            return <ChangaScreen
                navigate={navigate}
                goBack={goBack}
                user={appUser}
                unreadCount={unreadCount}
            />;

        case Screen.NOTIFICATIONS:
            if (isGuest) return <SignInPrompt feature="notifications" description="Sign in to see your activity and updates." navigate={navigate} />;
            return <NotificationsScreen navigate={navigate} goBack={goBack} notifications={notifications} onMarkAllRead={handleMarkAllRead} onNotificationClick={handleNotificationClick} />;

        case Screen.SAVED_CONVERSATIONS:
            if (isGuest) return <SignInPrompt feature="saved conversations" description="Sign in to save and revisit your search conversations." navigate={navigate} />;
            return <SavedConversationsScreen navigate={navigate} goBack={goBack} conversations={conversations} setConversations={setConversations} onChatSelect={(id) => navigate(Screen.HOME_CHAT, { chatId: id })} />;

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
        case Screen.DIRECT_MESSAGE:
            if (isGuest) return <SignInPrompt feature="messages" description="Sign in to send and receive direct messages." navigate={navigate} />;
            return <DirectMessageScreen navigate={navigate} goBack={goBack} chatUser={resolvedSearchParams?.chatUser ? JSON.parse(resolvedSearchParams.chatUser as string) : undefined} />;

        case Screen.NEW_GROUP:
            if (isGuest) return <SignInPrompt feature="groups" description="Sign in to create and join groups." navigate={navigate} />;
            return <NewGroupScreen navigate={navigate} goBack={goBack} onCreateGroup={handleAddChat} />;
        case Screen.NEW_CONTACT:
            if (isGuest) return <SignInPrompt feature="contacts" description="Sign in to add and manage contacts." navigate={navigate} />;
            return <NewContactScreen navigate={navigate} goBack={goBack} />;
        case Screen.NEW_COMMUNITY:
            if (isGuest) return <SignInPrompt feature="communities" description="Sign in to create and join communities." navigate={navigate} />;
            return <NewCommunityScreen navigate={navigate} goBack={goBack} onCreateCommunity={handleAddChat} />;

        case Screen.VIDEO_CALL:
            if (isGuest) return <SignInPrompt feature="video calls" description="Sign in to start video calls with others." navigate={navigate} />;
            return <VideoCallScreen goBack={goBack} chatUser={resolvedSearchParams?.chatUser ? JSON.parse(resolvedSearchParams.chatUser as string) : undefined} />;
        case Screen.VOICE_CALL:
            if (isGuest) return <SignInPrompt feature="voice calls" description="Sign in to start voice calls with others." navigate={navigate} />;
            return <VoiceCallScreen goBack={goBack} chatUser={resolvedSearchParams?.chatUser ? JSON.parse(resolvedSearchParams.chatUser as string) : undefined} />;
        case Screen.CONTACT_INFO: return <ContactInfoScreen navigate={navigate} goBack={goBack} chatUser={resolvedSearchParams?.chatUser ? JSON.parse(resolvedSearchParams.chatUser as string) : undefined} />;

        case Screen.COMPOSE_POST:
            if (isGuest) return <SignInPrompt feature="posting" description="Sign in to create posts and share with the community." navigate={navigate} />;
            return <ComposePostScreen navigate={navigate} goBack={goBack} onPost={() => { }} user={appUser} />;
        case Screen.TERMS_OF_SERVICE: return <TermsOfServiceScreen goBack={goBack} />;
        case Screen.PRIVACY_POLICY: return <PrivacyPolicyScreen goBack={goBack} />;

        case Screen.DARASA: return <DarasaScreen navigate={navigate} goBack={goBack} />;

        default:
            return <div>Screen {slug} not found</div>;
    }
}
