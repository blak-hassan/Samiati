"use client";

import React, { useCallback, useState } from "react";
import { useNavigation } from "@/hooks/useNavigation";
import { useAppUser } from "@/hooks/useAppUser";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import HomeSearchScreen from "@/components/screens/HomeSearchScreen";
import GuestBanner from "@/components/auth/GuestBanner";
import { localConversationService } from "@/services/localConversationService";
import { Conversation, Message } from "@/types";

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

// Map Convex messages to client Message type
function mapConvexMessages(messages: Record<string, unknown>[]): Message[] {
  return messages.map((m) => ({
    id: m.clientId as string,
    sender: m.sender as Message['sender'],
    text: m.text as string,
    translatedText: m.translatedText as string | undefined,
    targetLanguage: m.targetLanguage as string | undefined,
    timestamp: new Date(m.timestamp as number),
    feedback: m.feedback as Message['feedback'],
    comments: m.comments as string[] | undefined,
  }));
}

export default function DashboardPage() {
  const { navigate } = useNavigation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams.get("chatId");
  const discoverQuery = searchParams.get("q");
  const { user: clerkUser, isLoaded } = useAppUser();

  const saveConversationMutation = useMutation(api.conversations.mutations.saveConversation);
  const convexConversations = useQuery(api.conversations.queries.listConversations);
  const convexConversationMessages = useQuery(api.conversations.queries.getConversationWithMessages, chatId ? { clientId: chatId } : "skip");

  // Load all conversations for sidebar — prefer Convex when authenticated
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    if (typeof window === 'undefined') return localConversationService.getConversations();
    return localConversationService.getConversations();
  });

  // Sync with Convex when authenticated conversations load
  React.useEffect(() => {
    if (convexConversations && convexConversations.length > 0) {
      const mapped = convexConversations.map((c) => ({
        id: c.clientId,
        title: c.title,
        date: c.date,
        messageCount: c.messageCount,
        isPinned: c.isPinned,
        lastActive: c.lastActive,
        category: c.category,
        messages: [] as Message[],
      })) as Conversation[];
      setConversations(mapped);
      localConversationService.saveAll(mapped);
    }
  }, [convexConversations]);

  // Load messages from Convex when active conversation has no messages in localStorage
  React.useEffect(() => {
    if (convexConversationMessages && convexConversationMessages.messages && convexConversationMessages.messages.length > 0) {
      const msgs = mapConvexMessages(convexConversationMessages.messages);
      const updated: Conversation = {
        id: convexConversationMessages.clientId,
        title: convexConversationMessages.title,
        date: convexConversationMessages.date,
        messageCount: convexConversationMessages.messageCount,
        isPinned: convexConversationMessages.isPinned,
        lastActive: convexConversationMessages.lastActive,
        category: convexConversationMessages.category as Conversation['category'],
        messages: msgs,
      };
      localConversationService.saveConversation(updated);
      if (chatId === convexConversationMessages.clientId) {
        setActiveConversation(updated);
      }
    }
  }, [convexConversationMessages, chatId]);

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
  // Saves to both localStorage and Convex for cross-device persistence.
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
          id: conversationId || `chat_${Date.now()}`,
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

    if (clerkUser) {
      saveConversationMutation({
        id: updated.id,
        title: updated.title,
        date: updated.date,
        messageCount: updated.messageCount,
        isPinned: updated.isPinned,
        lastActive: updated.lastActive,
        category: updated.category,
        messages: messages.map(m => ({
          id: m.id,
          sender: m.sender,
          text: m.text,
          translatedText: m.translatedText,
          targetLanguage: m.targetLanguage,
          timestamp: m.timestamp instanceof Date ? m.timestamp.getTime() : m.timestamp,
          feedback: m.feedback,
          comments: m.comments,
          type: m.type,
          status: m.status,
          duration: m.duration,
        })),
      }).catch((err) => console.error("Failed to sync conversation to Convex:", err));
    }
  }, [clerkUser, saveConversationMutation]);

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
