'use client';

import React, { useCallback, useState, useSyncExternalStore } from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import { useUser as useClerkUser } from '@clerk/nextjs';
import { useUser as useMockUser } from '@/app/MockProviders';
import { isDemoMode } from '@/lib/appMode';
import { useRouter, useSearchParams } from 'next/navigation';
import HomeSearchScreen from '@/components/screens/HomeSearchScreen';
import type { Language } from '@/components/chat/LanguageSelector';
import { buildSavedConversation } from '@/components/chat/history';
import { localConversationService } from '@/services/localConversationService';
import { Conversation, Message } from '@/types';

const useUser = isDemoMode ? useMockUser : useClerkUser;
const subscribeHydration = () => () => {};
const clientHydrated = () => true;
const serverHydrated = () => false;

export const dynamic = 'force-dynamic';

// Resolve which conversation the home screen should show from the URL/active chat
function resolveConversation(chatId: string | null): Conversation | null {
  if (chatId) {
    const conversation = localConversationService.getConversation(chatId) ?? null;
    if (conversation) {
      localConversationService.setActiveConversationId(conversation.id);
    }
    return conversation;
  }
  const lastId = localConversationService.getActiveConversationId();
  return lastId ? (localConversationService.getConversation(lastId) ?? null) : null;
}

export default function DashboardPage() {
  const { navigate } = useNavigation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams.get('chatId');
  const discoverQuery = searchParams.get('q');
  const { user: clerkUser, isLoaded } = useUser();

  // Load all conversations for sidebar
  const historyLoaded = useSyncExternalStore(subscribeHydration, clientHydrated, serverHydrated);
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    localConversationService.getConversations()
  );

  // Active conversation state — lives here so it survives remounts of the search screen
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(() =>
    resolveConversation(chatId)
  );

  // Follow deep-link changes without a second navigation overwriting the id.
  // Browser-only history is exposed after hydration to match server markup.
  const [lastChatId, setLastChatId] = useState(chatId);
  if (lastChatId !== chatId) {
    setLastChatId(chatId);
    setActiveConversation(resolveConversation(chatId));
  }

  // Persist a chat: create the conversation on first save, then update it.
  // Reads the current conversation fresh from localStorage (no stale closures).
  const handleSaveChat = useCallback(
    (conversationId: string | null, messages: Message[], language?: Language) => {
      if (messages.length === 0) return;

      const existing = conversationId
        ? localConversationService.getConversation(conversationId)
        : undefined;
      const updated = buildSavedConversation(messages, existing, Date.now(), language);

      localConversationService.saveConversation(updated);
      localConversationService.setActiveConversationId(updated.id);
      setActiveConversation(updated);
      setConversations(localConversationService.getConversations());
    },
    []
  );

  // Start a fresh chat and clear the ?chatId= param so the URL stays clean
  const handleNewChat = useCallback(() => {
    localConversationService.setActiveConversationId(null);
    setActiveConversation(null);
    router.replace('/dashboard');
  }, [router]);

  if (!isLoaded) {
    return (
      <div
        role="status"
        aria-label="Loading your conversations"
        className="min-h-screen flex items-center justify-center bg-background"
      >
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If not signed in, show the same search interface as homepage (guest mode)
  if (!clerkUser) {
    return <HomeSearchScreen navigate={navigate} />;
  }

  const appUser = {
    name: clerkUser.fullName || 'User',
    handle: '@' + (clerkUser.username || 'user'),
    avatar: clerkUser.imageUrl,
    role: 'member' as const,
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
      activeConversation={historyLoaded ? activeConversation : null}
      onNewChat={handleNewChat}
      onSaveChat={handleSaveChat}
      conversations={historyLoaded ? conversations : []}
      initialQuery={historyLoaded ? discoverQuery || undefined : undefined}
    />
  );
}
