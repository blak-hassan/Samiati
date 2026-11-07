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

import {
  DEFAULT_LANGUAGE_ID,
  getLanguageOrDefault,
  isKnownLanguage,
  type SamiatiLanguage,
} from "@/lib/languages";

const STORAGE_KEY = "samiati:v1:language-preferences";
const MAX_RECENT = 5;

interface StoredPreferences {
  languageId: string;
  favorites: string[];
  recent: string[];
}

interface LanguagePreferencesContextValue {
  /** The language the user is currently conversing in. */
  languageId: string;
  language: SamiatiLanguage;
  favorites: string[];
  recent: string[];
  setLanguage: (id: string) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  /** True once preferences have been read from storage. */
  hydrated: boolean;
}

const LanguagePreferencesContext =
  createContext<LanguagePreferencesContextValue | null>(null);

const DEFAULT_PREFERENCES: StoredPreferences = {
  languageId: DEFAULT_LANGUAGE_ID,
  favorites: [DEFAULT_LANGUAGE_ID],
  recent: [DEFAULT_LANGUAGE_ID],
};

function readPreferences(): StoredPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<StoredPreferences>;
    const languageId =
      typeof parsed.languageId === "string" && isKnownLanguage(parsed.languageId)
        ? parsed.languageId
        : DEFAULT_LANGUAGE_ID;
    const favorites = Array.isArray(parsed.favorites)
      ? parsed.favorites.filter(isKnownLanguage)
      : DEFAULT_PREFERENCES.favorites;
    const recent = Array.isArray(parsed.recent)
      ? parsed.recent.filter(isKnownLanguage)
      : DEFAULT_PREFERENCES.recent;
    return { languageId, favorites, recent };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function writePreferences(preferences: StoredPreferences): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Storage may be unavailable (private mode); preferences stay in memory.
  }
}

/**
 * Holds the user's active language and their favourites.
 *
 * The active language is the single most important piece of state in
 * Samiati — it decides the language of every new conversation and the
 * language the assistant answers in.
 */
export function LanguagePreferencesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [preferences, setPreferences] = useState<StoredPreferences>(
    DEFAULT_PREFERENCES,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPreferences(readPreferences());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writePreferences(preferences);
  }, [preferences, hydrated]);

  const setLanguage = useCallback((id: string) => {
    if (!isKnownLanguage(id)) return;
    setPreferences((current) => ({
      ...current,
      languageId: id,
      recent: [id, ...current.recent.filter((entry) => entry !== id)].slice(
        0,
        MAX_RECENT,
      ),
    }));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    if (!isKnownLanguage(id)) return;
    setPreferences((current) => ({
      ...current,
      favorites: current.favorites.includes(id)
        ? current.favorites.filter((entry) => entry !== id)
        : [...current.favorites, id],
    }));
  }, []);

  const isFavorite = useCallback(
    (id: string) => preferences.favorites.includes(id),
    [preferences.favorites],
  );

  const value = useMemo<LanguagePreferencesContextValue>(
    () => ({
      languageId: preferences.languageId,
      language: getLanguageOrDefault(preferences.languageId),
      favorites: preferences.favorites,
      recent: preferences.recent,
      setLanguage,
      toggleFavorite,
      isFavorite,
      hydrated,
    }),
    [preferences, setLanguage, toggleFavorite, isFavorite, hydrated],
  );

  return (
    <LanguagePreferencesContext.Provider value={value}>
      {children}
    </LanguagePreferencesContext.Provider>
  );
}

export function useLanguagePreferences(): LanguagePreferencesContextValue {
  const context = useContext(LanguagePreferencesContext);
  if (!context) {
    throw new Error(
      "useLanguagePreferences must be used inside <LanguagePreferencesProvider>",
    );
  }
  return context;
}
