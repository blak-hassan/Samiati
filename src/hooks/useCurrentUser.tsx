"use client";

import { createContext, useContext, ReactNode } from "react";
import { useAuth as useClerkAuth } from "@clerk/nextjs";
import { useUser as useMockUser } from "@/app/MockProviders";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isGuest: boolean;
  isLoaded: boolean;
  isSignedIn: boolean;
  clerkUser: {
    fullName: string | null;
    username: string | null;
    imageUrl: string;
  } | null;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isGuest: true,
  isLoaded: false,
  isSignedIn: false,
  clerkUser: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { userId, isLoaded } = useClerkAuth();
  const { user: mockUser } = useMockUser();

  const isSignedIn = !!userId || !!mockUser;

  const clerkUser = mockUser
    ? {
        fullName: mockUser.fullName,
        username: mockUser.username,
        imageUrl: mockUser.imageUrl,
      }
    : null;

  const user: User | null = clerkUser
    ? {
        name: clerkUser.fullName || "User",
        handle: "@" + (clerkUser.username || "user"),
        avatar: clerkUser.imageUrl,
        isGuest: false,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest: !isSignedIn,
        isLoaded,
        isSignedIn,
        clerkUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(AuthContext);
}
