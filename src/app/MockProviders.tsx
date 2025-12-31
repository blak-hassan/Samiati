"use client";

import React, { createContext, useContext, ReactNode, useState } from "react";
import { LanguageSkill, ContributionItem } from "@/types";
import { INITIAL_LANGUAGES_STATE, INITIAL_CONTRIBUTIONS } from "@/data/mock";

// --- Mock Clerk ---
interface UserContextType {
  user: any;
  isLoaded: boolean;
  isSignedIn: boolean;
  languages: LanguageSkill[];
  setLanguages: React.Dispatch<React.SetStateAction<LanguageSkill[]>>;
  myContributions: ContributionItem[];
  setMyContributions: React.Dispatch<React.SetStateAction<ContributionItem[]>>;
}

const MockUserContext = createContext<UserContextType | null>(null);

// --- Mock Global State (Singleton pattern for persistence across remounts) ---
let globalMyContributions: ContributionItem[] = [...INITIAL_CONTRIBUTIONS];

export const ClerkProvider = ({ children }: { children: ReactNode }) => {
  const [languages, setLanguages] = useState<LanguageSkill[]>(INITIAL_LANGUAGES_STATE);
  const [myContributions, setMyContributionsInternal] = useState<ContributionItem[]>(globalMyContributions);

  // Sync internal state with global singleton
  const setMyContributions = (val: React.SetStateAction<ContributionItem[]>) => {
    if (typeof val === 'function') {
      globalMyContributions = val(globalMyContributions);
    } else {
      globalMyContributions = val;
    }
    setMyContributionsInternal(globalMyContributions);
  };


  const mockUser = {
    id: "user_2mock",
    fullName: "Mock User",
    username: "mockuser",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKkfM9WqTPsqCfuM1KQIQ1QzsbiAaq2rab_EQ2MwL_8b9sbJ3-mIl3CjDCR888PPrsBNhkpl7tkden40rCqo3pJe3Sepe18k46KUvejTidyoAK941vcqejBnqRrcfC5hPZop_XFQ7S9jkteso1RvDSjv8s1JfGwGhOYE1uQ1M1J93quDxOniTqTNGD-1WZq2GOu_Z1EpzGjMzNeyvhYbuIwiqYK1TDLfGX5mpdg--_df6DoewiFO-RhrraeKpwY7MetQ94avb6spo",
    primaryEmailAddress: { emailAddress: "mock@example.com" },
  };

  return (
    <MockUserContext.Provider value={{
      user: mockUser,
      isLoaded: true,
      isSignedIn: true,
      languages,
      setLanguages,
      myContributions,
      setMyContributions
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
    setMyContributions: () => { }
  };
};

export const useAuth = () => ({
  userId: "user_2mock",
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

export const useQuery = (name: string, args?: any) => {
  return null; // Return null as default for mock queries
};

export const useMutation = (name: string) => {
  return async (args?: any) => {
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
