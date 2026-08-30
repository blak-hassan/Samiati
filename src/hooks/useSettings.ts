"use client";

import { useState, useEffect, useCallback } from "react";

type SettingsKey = "darkMode" | "dataSaver" | "highQuality" | "autoDownload" | "pauseAll" | "changa" | "moderation" | "sessions" | "emailDigest" | "privateAccount" | "onlineStatus" | "readReceipts";

interface SettingsState {
  [key: string]: boolean;
}

const STORAGE_KEY = "samiati-settings";

function loadSettings(): SettingsState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistSettings(settings: SettingsState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useSettings(initial: SettingsState = {}) {
  const [settings, setSettings] = useState<SettingsState>(() => loadSettings());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    persistSettings(settings);
  }, [settings]);

  const updateSetting = useCallback(async (key: SettingsKey, value: boolean) => {
    setSaving(true);
    setSettings((prev) => ({ ...prev, [key]: value }));

    await new Promise((resolve) => setTimeout(resolve, 400));

    setSaving(false);
  }, []);

  const getSetting = useCallback(
    (key: SettingsKey, fallback = false) => settings[key] ?? initial[key] ?? fallback,
    [settings, initial]
  );

  return { settings, saving, updateSetting, getSetting };
}
