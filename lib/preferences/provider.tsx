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

const STORAGE_KEY = "samiati:v1:app-preferences";

export interface AppPreferences {
  /** Show "Translated from English" provenance badges on replies. */
  showTranslationProvenance: boolean;
  /** Reduce interface motion. */
  reduceMotion: boolean;
  /** Voice input/output is not available yet; kept so the setting has a home. */
  voiceEnabled: boolean;
}

const DEFAULTS: AppPreferences = {
  showTranslationProvenance: true,
  reduceMotion: false,
  voiceEnabled: false,
};

interface PreferencesContextValue extends AppPreferences {
  setPreference: <K extends keyof AppPreferences>(
    key: K,
    value: AppPreferences[K],
  ) => void;
  hydrated: boolean;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function read(): AppPreferences {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<AppPreferences>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

/**
 * Application-level preferences that are not about languages.
 *
 * These are device preferences rather than account data, so they live in
 * local storage next to the language preferences.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPreferences(read());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Preferences still apply for this session even if they cannot persist.
    }
  }, [hydrated, preferences]);

  // "Reduce motion" is honoured at the document level so it covers every
  // animation, including ones added later.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("reduce-motion", preferences.reduceMotion);
  }, [preferences.reduceMotion]);

  const setPreference = useCallback(
    <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => {
      setPreferences((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({ ...preferences, setPreference, hydrated }),
    [preferences, setPreference, hydrated],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used inside <PreferencesProvider>");
  }
  return context;
}
