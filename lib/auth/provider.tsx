"use client";

import { ClerkProvider, useClerk, useUser } from "@clerk/nextjs";
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import { getRuntimeConfig } from "@/lib/runtime";

export interface SamiatiAuthUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  /** True when the user is signed in to Samiati without a real account. */
  isGuest: boolean;
}

export interface SamiatiAuthContextValue {
  user: SamiatiAuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  provider: "clerk" | "local";
  signOut: () => Promise<void>;
}

const SamiatiAuthContext = createContext<SamiatiAuthContextValue | null>(null);

export function useSamiatiAuth(): SamiatiAuthContextValue {
  const context = useContext(SamiatiAuthContext);
  if (!context) {
    throw new Error("useSamiatiAuth must be used inside <SamiatiAuthProvider>");
  }
  return context;
}

/**
 * Clerk-backed identity.
 *
 * Only mounted when Clerk keys are configured, so `useUser()` is always legal
 * here.
 */
function ClerkAuthLayer({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();

  const value = useMemo<SamiatiAuthContextValue>(
    () => ({
      user: user
        ? {
            id: user.id,
            username:
              user.username ?? user.emailAddresses[0]?.emailAddress ?? "member",
            displayName:
              user.fullName ??
              user.username ??
              user.emailAddresses[0]?.emailAddress ??
              "Member",
            avatarUrl: user.imageUrl,
            isGuest: false,
          }
        : null,
      isAuthenticated: Boolean(user),
      isLoading: !isLoaded,
      provider: "clerk",
      signOut: async () => {
        await clerk.signOut();
      },
    }),
    [user, isLoaded, clerk],
  );

  return (
    <SamiatiAuthContext.Provider value={value}>
      {children}
    </SamiatiAuthContext.Provider>
  );
}

/**
 * Local identity.
 *
 * Samiati works without accounts. In local mode the member is a guest on this
 * device; nothing is sent anywhere.
 */
function LocalAuthLayer({ children }: { children: ReactNode }) {
  const value = useMemo<SamiatiAuthContextValue>(
    () => ({
      user: {
        id: "local-user",
        username: "mwalimu",
        displayName: "Mwalimu",
        isGuest: true,
      },
      isAuthenticated: true,
      isLoading: false,
      provider: "local",
      signOut: async () => {
        // No-op: local mode has no session to end.
      },
    }),
    [],
  );

  return (
    <SamiatiAuthContext.Provider value={value}>
      {children}
    </SamiatiAuthContext.Provider>
  );
}

/**
 * Chooses the identity layer at runtime.
 *
 * The choice is fixed for the lifetime of the page so React never swaps
 * provider trees mid-session.
 */
export function SamiatiAuthProvider({ children }: { children: ReactNode }) {
  const config = getRuntimeConfig();

  if (!config.clerkEnabled) {
    return <LocalAuthLayer>{children}</LocalAuthLayer>;
  }

  return (
    <ClerkProvider>
      <ClerkAuthLayer>{children}</ClerkAuthLayer>
    </ClerkProvider>
  );
}
