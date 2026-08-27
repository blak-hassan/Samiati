"use client";

import React, { useCallback, useState } from "react";
import { useNavigation } from "@/hooks/useNavigation";
import { useUser as useClerkUser } from "@clerk/nextjs";
import { useUser as useMockUser } from "@/app/MockProviders";
import { isDemoMode } from "@/lib/appMode";
import { useRouter, useSearchParams } from "next/navigation";
import HomeSearchScreen from "@/components/screens/HomeSearchScreen";
import GuestBanner from "@/components/auth/GuestBanner";
import { localConversationService } from "@/services/localConversationService";
import { Conversation, Message } from "@/types";

const useUser = isDemoMode ? useMockUser : useClerkUser;

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
  return lastId ? localConversationService.getConversation(lastId) ?? null : null;
}

export default function DashboardPage() {
  const { navigate } = useNavigation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams.get("chatId");
  const discoverQuery = searchParams.get("q");
  const { user: clerkUser, isLoaded } = useUser();

  // Load all conversations for sidebar
  const [conversations, setConversations] = useState<Conversation[]>(() => localConversationService.getConversations());

  // Active conversation state — lives here so it survives remounts of the search screen
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(() => resolveConversation(chatId));

  // Load conversation when navigating with ?chatId=, otherwise resume the last active chat.
  // Uses the "adjust state during render" pattern (no effect) so it also survives chatId changes.
  const [lastChatId, setLastChatId] = useState(chatId);
  if (chatId !== lastChatId) {
    setLastChatId(chatId);
    setActiveConversation(resolveConversation(chatId));
  }

  // Persist a chat: create the conversation on first save, then update it.
  // Reads the current conversation fresh from localStorage (no stale closures).
  const handleSaveChat = useCallback((conversationId: string | null, messages: Message[]) => {
    if (messages.length === 0) return;

    const existing = conversationId ? localConversationService.getConversation(conversationId) : undefined;
    const firstUserMessage = messages.find(m => m.sender === 'user');

    const updated: Conversation = existing
      ? {
          ...existing,
          messages,
          messageCount: messages.length,
          lastActive: Date.now(),
        }
      : {
          id: `chat_${Date.now()}`,
          title: firstUserMessage ? firstUserMessage.text.slice(0, 60) : "New Conversation",
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          messageCount: messages.length,
          isPinned: false,
          messages,
          lastActive: Date.now(),
          category: 'general',
        };

    localConversationService.saveConversation(updated);
    localConversationService.setActiveConversationId(updated.id);
    setActiveConversation(updated);
  }, []);

  // Start a fresh chat and clear the ?chatId= param so the URL stays clean
  const handleNewChat = useCallback(() => {
    localConversationService.setActiveConversationId(null);
    setActiveConversation(null);
    router.replace("/dashboard");
  }, [router]);

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
      activeConversation={activeConversation}
      onNewChat={handleNewChat}
      onSaveChat={handleSaveChat}
      conversations={conversations}
      initialQuery={discoverQuery || undefined}
    />
  );
}
