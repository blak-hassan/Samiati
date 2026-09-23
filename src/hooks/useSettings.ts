"use client";

import { useState, useEffect, useCallback } from "react";
import { applyThemeClass, SETTINGS_STORAGE_KEY } from "@/lib/theme";

type SettingsKey = "darkMode" | "dataSaver" | "highQuality" | "autoDownload" | "pauseAll" | "changa" | "moderation" | "sessions" | "emailDigest" | "privateAccount" | "onlineStatus" | "readReceipts";

interface SettingsState {
  [key: string]: boolean;
}

function loadSettings(): SettingsState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistSettings(settings: SettingsState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function useSettings(initial: SettingsState = {}) {
  const [settings, setSettings] = useState<SettingsState>({});
  const [saving, setSaving] = useState(false);
  // True once the persisted settings have been read. Until then `settings` is
  // the empty SSR-safe placeholder: it must NOT be persisted (that would wipe
  // the stored preferences, including the theme) and must NOT drive the theme
  // class — see `useTheme`.
  const [hydrated, setHydrated] = useState(false);

  // Load persisted settings after mount rather than during render so the hook
  // is SSR-safe; the stored values are applied on the first client effect.
  useEffect(() => {
    setSettings(loadSettings());
    setHydrated(true);
  }, []);

  // Persist any change to settings back to localStorage — but never the
  // pre-hydration placeholder, which would clobber the stored settings.
  useEffect(() => {
    if (!hydrated) return;
    persistSettings(settings);
  }, [settings, hydrated]);

  const updateSetting = useCallback(async (key: SettingsKey, value: boolean) => {
    // The theme class is applied here, centrally, the moment the user
    // toggles — so every consumer of `useSettings` flips the theme instantly
    // without each component owning its own classList logic.
    if (key === "darkMode") {
      applyThemeClass(value);
    }

    setSaving(true);
    setSettings((prev) => ({ ...prev, [key]: value }));

    await new Promise((resolve) => setTimeout(resolve, 400));

    setSaving(false);
  }, []);

  const getSetting = useCallback(
    (key: SettingsKey, fallback = false) => settings[key] ?? initial[key] ?? fallback,
    [settings, initial]
  );

  return { settings, saving, updateSetting, getSetting, hydrated };
}
