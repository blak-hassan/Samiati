"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { useNavigation } from "@/hooks/useNavigation";
import { useAppUser } from "@/hooks/useAppUser";
import { useRouter, useSearchParams } from "next/navigation";
import HomeSearchScreen from "@/components/screens/HomeSearchScreen";
import GuestBanner from "@/components/auth/GuestBanner";
import { localConversationService } from "@/services/localConversationService";
import { useSyncedConversations } from "@/hooks/useSyncedConversations";
import { Conversation, Message } from "@/types";

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { navigate } = useNavigation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams.get("chatId");
  const discoverQuery = searchParams.get("q");
  const { user: clerkUser, isLoaded } = useAppUser();

  const {
    conversations,
    readConversation,
    syncSave,
  } = useSyncedConversations({ isSignedIn: !!clerkUser, activeChatId: chatId });

  // Keep the active-chat pointer in localStorage so resume works across
  // remounts and before the conversation row hydrates.
  useEffect(() => {
    if (chatId) localConversationService.setActiveConversationId(chatId);
  }, [chatId]);

  // Derive the active conversation: prefer ?chatId=, otherwise resume the
  // last active chat. Recomputes as the list merges server rows in.
  const activeConversation = useMemo<Conversation | null>(() => {
    const id = chatId ?? localConversationService.getActiveConversationId();
    if (!id) return null;
    return conversations.find((c) => c.id === id) ?? null;
  }, [conversations, chatId]);

  // Persist a chat: create the conversation on first save, then update it.
  // The write goes through the sync hook — localStorage immediately, Convex
  // via the offline-safe queue (retried on reconnection / sign-in).
  const handleSaveChat = useCallback((conversationId: string | null, messages: Message[]) => {
    if (messages.length === 0) return;

    const existing = conversationId ? readConversation(conversationId) : undefined;
    const firstUserMessage = messages.find((m) => m.sender === "user");

    const updated: Conversation = existing
      ? {
          ...existing,
          messages,
          messageCount: messages.length,
          lastActive: Date.now(),
        }
      : {
          id: conversationId || localConversationService.createNewConversation().id,
          title: firstUserMessage ? firstUserMessage.text.slice(0, 60) : "New Conversation",
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          messageCount: messages.length,
          isPinned: false,
          messages,
          lastActive: Date.now(),
          category: "general",
        };

    localConversationService.setActiveConversationId(updated.id);
    syncSave(updated);
  }, [readConversation, syncSave]);

  // Start a fresh chat and clear the ?chatId= param so the URL stays clean
  const handleNewChat = useCallback(() => {
    localConversationService.setActiveConversationId(null);
    router.replace("/dashboard");
  }, [router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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
    name: clerkUser.name || "User",
    avatar: clerkUser.avatar,
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
