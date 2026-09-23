"use client";

import { useCallback, useEffect } from "react";

import { useSettings } from "@/hooks/useSettings";
import { applyThemeClass } from "@/lib/theme";

/**
 * Single source of truth for the app-wide theme.
 *
 * Every consumer (SettingsShell rail toggle, settings index quick toggle,
 * future nav toggles) gets the same `isDark` state and the same `toggleTheme`,
 * and the `dark` class on `<html>` is reconciled in exactly one place.
 *
 * Hydration note: `useSettings` reads the persisted preference from
 * localStorage in an effect after mount, so `settings` is an empty
 * placeholder during SSR and the first client render. Reconciling the DOM
 * while `hydrated` is false would force the placeholder default (`dark`) onto
 * light-mode users on every mount of a settings surface. The correct class is
 * already present before first paint via the inline script in
 * `src/app/layout.tsx`, so reconciliation only needs to run once the stored
 * preference is known.
 */
export function useTheme() {
  const { settings, updateSetting, saving, hydrated } = useSettings();
  const isDark = settings.darkMode ?? true;

  useEffect(() => {
    if (!hydrated) return;
    applyThemeClass(isDark);
  }, [hydrated, isDark]);

  const toggleTheme = useCallback(async () => {
    // `updateSetting` applies the theme class synchronously for instant
    // feedback, then persists the preference; the effect above reconciles
    // any remaining state.
    await updateSetting("darkMode", !isDark);
  }, [isDark, updateSetting]);

  return { isDark, toggleTheme, saving };
}