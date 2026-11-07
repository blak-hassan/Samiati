"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getRuntimeConfig } from "@/lib/runtime";

import { ConvexStore } from "./convex-store";
import { LocalStore } from "./local-store";
import type { SamiatiStore } from "./store";
import type { SamiatiUser } from "./types";

interface SamiatiDataContextValue {
  store: SamiatiStore;
  user: SamiatiUser | null;
  loadingUser: boolean;
  refreshUser: () => Promise<void>;
}

const SamiatiDataContext = createContext<SamiatiDataContextValue | null>(null);

function createStore(): SamiatiStore {
  const config = getRuntimeConfig();
  if (config.dataBackend === "convex" && config.convexUrl) {
    return new ConvexStore(config.convexUrl);
  }
  return new LocalStore();
}

/**
 * Provides the active persistence backend and the signed-in user to the app.
 *
 * The provider is the single place that knows which backend is live, so no
 * component ever branches on "local versus Convex".
 */
export function SamiatiDataProvider({ children }: { children: ReactNode }) {
  const store = useMemo(() => createStore(), []);
  const [user, setUser] = useState<SamiatiUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const refreshUser = useCallback(async () => {
    setLoadingUser(true);
    try {
      setUser(await store.getCurrentUser());
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, [store]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const value = useMemo<SamiatiDataContextValue>(
    () => ({ store, user, loadingUser, refreshUser }),
    [store, user, loadingUser, refreshUser],
  );

  return (
    <SamiatiDataContext.Provider value={value}>
      {children}
    </SamiatiDataContext.Provider>
  );
}

export function useSamiatiData(): SamiatiDataContextValue {
  const context = useContext(SamiatiDataContext);
  if (!context) {
    throw new Error("useSamiatiData must be used inside <SamiatiDataProvider>");
  }
  return context;
}

/** Convenience hook for the active store. */
export function useStore(): SamiatiStore {
  return useSamiatiData().store;
}
