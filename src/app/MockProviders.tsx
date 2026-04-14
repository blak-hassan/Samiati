"use client";

import React, { createContext, useContext, ReactNode, useMemo, useState } from "react";
import {
  ContributionItem,
  LanguageSkill,
  ModerationReview,
  NotificationItem,
  ValidationItem,
  Challenge,
} from "@/types";
import {
  INITIAL_CONTRIBUTIONS,
  INITIAL_LANGUAGES_STATE,
  INITIAL_NOTIFICATIONS,
  INITIAL_VALIDATION_ITEMS,
} from "@/data/mock";
import { MOCK_CHALLENGES } from "@/data/mockChallenges";
import {
  buildValidationItemFromContribution,
  getContributionStatusMeta,
  mapModerationStatusToContributionStatus,
  normalizeContributionItem,
} from "@/lib/changaModeration";

interface MockUser {
  id: string;
  fullName: string;
  username: string;
  imageUrl: string;
  primaryEmailAddress: {
    emailAddress: string;
  };
}

// --- Mock Clerk ---
interface UserContextType {
  user: MockUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  languages: LanguageSkill[];
  setLanguages: React.Dispatch<React.SetStateAction<LanguageSkill[]>>;
  myContributions: ContributionItem[];
  setMyContributions: React.Dispatch<React.SetStateAction<ContributionItem[]>>;
  saveContribution: (item: ContributionItem) => ContributionItem;
  moderationItems: ValidationItem[];
  reviewContribution: (id: string, action: "approved" | "critiqued" | "rejected", comment?: string) => void;
  voteOnModerationItem: (id: string, direction: "up" | "down" | null) => void;
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  unreadCount: number;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  challenges: Challenge[];
  addChallenge: (challenge: Challenge) => void;
}

const MockUserContext = createContext<UserContextType | null>(null);

const STORAGE_KEYS = {
  contributions: "samiati_my_contributions",
  moderationItems: "samiati_moderation_items",
  notifications: "samiati_notifications",
  challenges: "samiati_challenges",
} as const;

const loadStoredState = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage`, error);
    return fallback;
  }
};

const persistStoredState = <T,>(key: string, value: T) => {
  if (typeof window === "undefined") return;

  try {
    console.log(`Persisting ${key}:`, value);
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to persist ${key} to localStorage`, error);
  }
};

// --- Mock Global State (Singleton pattern for persistence across remounts) ---
let globalMyContributions: ContributionItem[] = [...INITIAL_CONTRIBUTIONS];
let globalModerationItems: ValidationItem[] = [...INITIAL_VALIDATION_ITEMS];
let globalNotifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];
let globalChallenges: Challenge[] = [...MOCK_CHALLENGES];

export const ClerkProvider = ({ children }: { children: ReactNode }) => {
  const mockUser = useMemo(() => ({
    id: "u_current",
    fullName: "Mock User",
    username: "you",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKkfM9WqTPsqCfuM1KQIQ1QzsbiAaq2rab_EQ2MwL_8b9sbJ3-mIl3CjDCR888PPrsBNhkpl7tkden40rCqo3pJe3Sepe18k46KUvejTidyoAK941vcqejBnqRrcfC5hPZop_XFQ7S9jkteso1RvDSjv8s1JfGwGhOYE1uQ1M1J93quDxOniTqTNGD-1WZq2GOu_Z1EpzGjMzNeyvhYbuIwiqYK1TDLfGX5mpdg--_df6DoewiFO-RhrraeKpwY7MetQ94avb6spo",
    primaryEmailAddress: { emailAddress: "mock@example.com" },
  }), []);
  const [languages, setLanguages] = useState<LanguageSkill[]>(INITIAL_LANGUAGES_STATE);
  const [myContributions, setMyContributionsInternal] = useState<ContributionItem[]>(() => {
    globalMyContributions = loadStoredState(STORAGE_KEYS.contributions, globalMyContributions).map((item) =>
      normalizeContributionItem(item, {
        id: mockUser.id,
        name: mockUser.fullName,
        handle: mockUser.username,
        avatar: mockUser.imageUrl,
      }),
    );
    return globalMyContributions;
  });
  const [baseModerationItems, setBaseModerationItemsInternal] = useState<ValidationItem[]>(() => {
    globalModerationItems = loadStoredState(STORAGE_KEYS.moderationItems, globalModerationItems);
    return globalModerationItems;
  });
  const [notifications, setNotificationsInternal] = useState<NotificationItem[]>(() => {
    globalNotifications = loadStoredState(STORAGE_KEYS.notifications, globalNotifications);
    return globalNotifications;
  });
  const [challenges, setChallengesInternal] = useState<Challenge[]>(() => {
    globalChallenges = loadStoredState(STORAGE_KEYS.challenges, globalChallenges);
    return globalChallenges;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const moderationItems = useMemo(() => {
    const derivedItems = myContributions.map(buildValidationItemFromContribution);
    const derivedIds = new Set(derivedItems.map((item) => item.id));
    const preservedBase = baseModerationItems.filter((item) => !derivedIds.has(item.id));

    return [...derivedItems, ...preservedBase];
  }, [baseModerationItems, myContributions]);

  // Sync internal state with global singleton
  const setMyContributions = (val: React.SetStateAction<ContributionItem[]>) => {
    if (typeof val === 'function') {
      globalMyContributions = val(globalMyContributions).map((item) =>
        normalizeContributionItem(item, {
          id: mockUser.id,
          name: mockUser.fullName,
          handle: mockUser.username,
          avatar: mockUser.imageUrl,
        }),
      );
    } else {
      globalMyContributions = val.map((item) =>
        normalizeContributionItem(item, {
          id: mockUser.id,
          name: mockUser.fullName,
          handle: mockUser.username,
          avatar: mockUser.imageUrl,
        }),
      );
    }
    persistStoredState(STORAGE_KEYS.contributions, globalMyContributions);
    setMyContributionsInternal(globalMyContributions);
  };

  const setBaseModerationItems = (val: React.SetStateAction<ValidationItem[]>) => {
    if (typeof val === "function") {
      globalModerationItems = val(globalModerationItems);
    } else {
      globalModerationItems = val;
    }
    persistStoredState(STORAGE_KEYS.moderationItems, globalModerationItems);
    setBaseModerationItemsInternal(globalModerationItems);
  };

  const setNotifications = (val: React.SetStateAction<NotificationItem[]>) => {
    if (typeof val === 'function') {
      globalNotifications = val(globalNotifications);
    } else {
      globalNotifications = val;
    }
    persistStoredState(STORAGE_KEYS.notifications, globalNotifications);
    setNotificationsInternal(globalNotifications);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const saveContribution = (item: ContributionItem) => {
    try {
      const normalized = normalizeContributionItem(item, {
        id: mockUser.id,
        name: mockUser.fullName,
        handle: mockUser.username,
        avatar: mockUser.imageUrl,
      });

      setMyContributions((prev) => {
        const index = prev.findIndex((contribution) => contribution.id === normalized.id);
        if (index === -1) return [normalized, ...prev];

        const updated = [...prev];
        updated[index] = normalized;
        return updated;
      });

      return normalized;
    } catch (error) {
      console.error("Error saving contribution:", error);
      return item;
    }
  };

  const reviewContribution = (
    id: string,
    action: "approved" | "critiqued" | "rejected",
    comment?: string,
  ) => {
    const review: ModerationReview = {
      moderator: {
        id: mockUser.id,
        name: mockUser.fullName,
        avatar: mockUser.imageUrl,
        handle: mockUser.username,
      },
      action,
      comment,
      timestamp: Date.now(),
    };

    const nextModerationStatus =
      action === "approved" ? "approved" : action === "critiqued" ? "needs_revision" : "rejected";
    const mappedStatus = mapModerationStatusToContributionStatus(nextModerationStatus);
    const meta = getContributionStatusMeta(mappedStatus);

    const contributionExists = globalMyContributions.some((item) => item.id === id);

    if (contributionExists) {
      setMyContributions((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
              ...item,
              moderationStatus: nextModerationStatus,
              status: mappedStatus,
              statusColor: meta.statusColor,
              dotColor: meta.dotColor,
              reviewHistory: [...(item.reviewHistory || []), review],
              moderatorNotes: comment || item.moderatorNotes,
              reviewedAt: review.timestamp,
            }
            : item,
        ),
      );
      return;
    }

    setBaseModerationItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
            ...item,
            status: nextModerationStatus,
            reviews: [...item.reviews, review],
          }
          : item,
      ),
    );
  };

  const voteOnModerationItem = (id: string, direction: "up" | "down" | null) => {
    const contributionExists = globalMyContributions.some((item) => item.id === id);

    const getVoteState = (
      currentVote: "up" | "down" | null | undefined,
      likes: number,
      dislikes: number,
    ) => {
      let nextLikes = likes;
      let nextDislikes = dislikes;
      let nextVote = currentVote ?? null;

      if (currentVote === direction) {
        nextVote = null;
        if (direction === "up") nextLikes -= 1;
        if (direction === "down") nextDislikes -= 1;
      } else {
        if (currentVote === "up") nextLikes -= 1;
        if (currentVote === "down") nextDislikes -= 1;
        if (direction === "up") nextLikes += 1;
        if (direction === "down") nextDislikes += 1;
        nextVote = direction;
      }

      return { nextLikes, nextDislikes, nextVote };
    };

    if (contributionExists) {
      setMyContributions((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const { nextLikes, nextDislikes, nextVote } = getVoteState(item.userVote, item.likes, item.dislikes);
          return { ...item, likes: nextLikes, dislikes: nextDislikes, userVote: nextVote };
        }),
      );
      return;
    }

    setBaseModerationItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const { nextLikes, nextDislikes, nextVote } = getVoteState(
          item.sentiment.userVote,
          item.sentiment.upvotes,
          item.sentiment.downvotes,
        );
        return {
          ...item,
          sentiment: {
            ...item.sentiment,
            upvotes: nextLikes,
            downvotes: nextDislikes,
            userVote: nextVote,
          },
        };
      }),
    );
  };

  const addChallenge = (challenge: Challenge) => {
    globalChallenges = [challenge, ...globalChallenges];
    persistStoredState(STORAGE_KEYS.challenges, globalChallenges);
    setChallengesInternal(globalChallenges);
  };

  return (
    <MockUserContext.Provider value={{
      user: mockUser,
      isLoaded: true,
      isSignedIn: true,
      languages,
      setLanguages,
      myContributions,
      setMyContributions,
      saveContribution,
      moderationItems,
      reviewContribution,
      voteOnModerationItem,
      notifications,
      setNotifications,
      unreadCount,
      markAllAsRead,
      markAsRead,
      challenges,
      addChallenge
    }}>
      {children}
    </MockUserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(MockUserContext);
  return context || {
    user: null,
    isLoaded: true,
    isSignedIn: false,
    languages: [],
    setLanguages: () => { },
    myContributions: [],
    setMyContributions: () => { },
    saveContribution: (item: ContributionItem) => item,
    moderationItems: [],
    reviewContribution: () => { },
    voteOnModerationItem: () => { },
    notifications: [],
    setNotifications: () => { },
    unreadCount: 0,
    markAllAsRead: () => { },
    markAsRead: () => { },
    challenges: [],
    addChallenge: () => { }
  };
};

export const useAuth = () => ({
  userId: "u_current",
  sessionId: "sess_mock",
  getToken: async () => "mock_token",
  isLoaded: true,
  isSignedIn: true,
});

export const useClerk = () => ({
  signOut: (cb: () => void) => cb && cb(),
});

// --- Mock Convex ---
export const ConvexProviderWithClerk = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

export const useQuery = (_name: string, _args?: unknown) => {
  return null; // Return null as default for mock queries
};

export const useMutation = (_name: string) => {
  return async (_args?: unknown) => {
    // Mock mutation call
    return null;
  };
};

export const MockProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  );
};
