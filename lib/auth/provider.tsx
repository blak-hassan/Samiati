"use client";

import { ClerkProvider, useAuth, useClerk, useUser } from "@clerk/nextjs";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  /**
   * The session token of the signed-in member, when there is one.
   *
   * The cloud backend needs it to know which member a request comes from.
   * Without it every member shares the one local account. It is undefined
   * when no identity provider is live.
   */
  getToken?: () => Promise<string | null>;
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
  const { getToken } = useAuth();

  // The token is kept in a ref so that the getter the rest of the app holds
  // never changes identity: a new one would build a new backend every render.
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const fetchToken = useCallback(async () => getTokenRef.current(), []);

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
      getToken: fetchToken,
    }),
    [user, isLoaded, clerk, fetchToken],
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
