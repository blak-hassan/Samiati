'use client';

import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import {
  ACCENT_VARS,
  DEFAULT_DEVICE_SETTINGS,
  DeviceSettingKey,
  DeviceSettings,
  SETTINGS_STORAGE_KEY,
} from '@/lib/settings';

/**
 * Device-scoped settings store.
 *
 * T3Chat keeps its settings in one persisted object (`useScopedSettings`).
 * Samiati previously kept every toggle in component-local `useState`, so a
 * refresh silently discarded the user's choices. This store fixes that: one
 * object, one storage key, one source of truth.
 *
 * The store is module-level so every screen shares the same snapshot, and it
 * is read through `useSyncExternalStore` so React stays in sync with writes
 * made outside React (other tabs, the reset button, and so on).
 */

type Listener = () => void;

const listeners = new Set<Listener>();
let cache: DeviceSettings | null = null;

function readStoredSettings(): DeviceSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_DEVICE_SETTINGS };
  if (cache) return cache;

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<DeviceSettings>) : {};
    // Merge over the defaults so a settings shape change never leaves a
    // missing key behind (e.g. a setting added after the user last visited).
    cache = { ...DEFAULT_DEVICE_SETTINGS, ...parsed };
  } catch {
    cache = { ...DEFAULT_DEVICE_SETTINGS };
  }
  return cache;
}

function writeStoredSettings(next: DeviceSettings) {
  cache = next;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private mode / quota exceeded — the in-memory value still applies.
    }
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener) {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== SETTINGS_STORAGE_KEY) return;
    cache = null;
    readStoredSettings();
    listeners.forEach((l) => l());
  };

  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

const getSnapshot = () => readStoredSettings();
const getServerSnapshot = () => DEFAULT_DEVICE_SETTINGS;

export interface UseSettingsResult {
  settings: DeviceSettings;
  /** Update a single device setting. */
  updateSetting: <K extends DeviceSettingKey>(key: K, value: DeviceSettings[K]) => void;
  /** Update several device settings at once. */
  updateSettings: (patch: Partial<DeviceSettings>) => void;
  /** Restore one setting to its default value. */
  resetSetting: (key: DeviceSettingKey) => void;
  /** Restore every device setting to its default value. */
  resetAll: () => void;
  /** True when the setting no longer matches its default. */
  isChanged: (key: DeviceSettingKey) => boolean;
  /** Keys of every setting that currently differs from its default. */
  changedKeys: DeviceSettingKey[];
}

export function useSettings(): UseSettingsResult {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const updateSetting = useCallback(
    <K extends DeviceSettingKey>(key: K, value: DeviceSettings[K]) => {
      const current = readStoredSettings();
      if (Object.is(current[key], value)) return;
      writeStoredSettings({ ...current, [key]: value });
    },
    []
  );

  const updateSettings = useCallback((patch: Partial<DeviceSettings>) => {
    const current = readStoredSettings();
    writeStoredSettings({ ...current, ...patch });
  }, []);

  const resetSetting = useCallback((key: DeviceSettingKey) => {
    const current = readStoredSettings();
    writeStoredSettings({ ...current, [key]: DEFAULT_DEVICE_SETTINGS[key] });
  }, []);

  const resetAll = useCallback(() => {
    writeStoredSettings({ ...DEFAULT_DEVICE_SETTINGS });
  }, []);

  const changedKeys = useMemo(
    () =>
      (Object.keys(DEFAULT_DEVICE_SETTINGS) as DeviceSettingKey[]).filter(
        (key) => !deepEqual(settings[key], DEFAULT_DEVICE_SETTINGS[key])
      ),
    [settings]
  );

  const isChanged = useCallback(
    (key: DeviceSettingKey) => !deepEqual(settings[key], DEFAULT_DEVICE_SETTINGS[key]),
    [settings]
  );

  return {
    settings,
    updateSetting,
    updateSettings,
    resetSetting,
    resetAll,
    isChanged,
    changedKeys,
  };
}

/** Structural comparison that also handles arrays (muted words, blocked users). */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) =>
      deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    );
  }
  return false;
}

/**
 * Applies the appearance-related settings to the document.
 *
 * T3Chat does the same through its `useTheme` hook: the theme choice is
 * applied to `<html>` so it survives navigation and applies before paint.
 */
export function useApplySettings(settings: DeviceSettings) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // --- Theme ---
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const prefersDark = media.matches;
      const useDark = settings.theme === 'dark' || (settings.theme === 'system' && prefersDark);
      root.classList.toggle('dark', useDark);
      root.style.colorScheme = useDark ? 'dark' : 'light';
    };

    applyTheme();
    if (settings.theme === 'system') {
      media.addEventListener('change', applyTheme);
      return () => media.removeEventListener('change', applyTheme);
    }
  }, [settings.theme]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // --- Accent colour ---
    const accent = ACCENT_VARS[settings.accent];
    root.dataset.accent = settings.accent;
    root.style.setProperty('--active-accent', accent.accent);
    root.style.setProperty('--active-accent-hover', accent.accentHover);

    // --- Text size ---
    root.dataset.textSize = settings.textSize;

    // --- Chat width ---
    root.dataset.chatWidth = settings.chatWidth;

    // --- Accessibility flags ---
    root.classList.toggle('reduce-motion', settings.reduceMotion);
    root.classList.toggle('high-contrast', settings.highContrast);
  }, [
    settings.accent,
    settings.textSize,
    settings.chatWidth,
    settings.reduceMotion,
    settings.highContrast,
  ]);
}

/**
 * Convenience wrapper: read the settings and apply them to the document.
 * Mount this once, near the root of the app.
 */
export function useSettingsWithSideEffects(): UseSettingsResult {
  const result = useSettings();
  useApplySettings(result.settings);
  return result;
}
