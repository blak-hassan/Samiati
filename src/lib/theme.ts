/**
 * Central theme helpers.
 *
 * The app's theme is the `dark` class on `document.documentElement` (Tailwind
 * v4 is configured with `@custom-variant dark (&:is(.dark *))` in
 * `globals.css`). The class is written in exactly two places:
 *
 *   1. The inline pre-paint script in `src/app/layout.tsx`, which reads the
 *      persisted preference from localStorage before first paint (no flash).
 *   2. `applyThemeClass()` below — called from client code via
 *      `useSettings().updateSetting("darkMode", …)` and the reconciliation
 *      effect in `useTheme`.
 *
 * Every theme read/write MUST go through this module so the storage format
 * and the class toggling stay consistent across all components and screens.
 */

export const SETTINGS_STORAGE_KEY = "samiati-settings";

/**
 * Adds/removes the `dark` class on `<html>`. No-op on the server.
 * `classList.toggle(…, force)` is idempotent, so repeated calls from
 * different components can never fight each other.
 */
export function applyThemeClass(isDark: boolean): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", isDark);
}

/**
 * Reads the persisted dark-mode preference synchronously.
 *
 * Returns `undefined` when unset or unreadable — callers decide the default
 * (`settings.darkMode ?? true`, matching the layout script's
 * `parsed.darkMode !== false` → dark default). Client-only.
 */
export function readStoredDarkMode(): boolean | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { darkMode?: unknown } | null;
    return typeof parsed?.darkMode === "boolean" ? parsed.darkMode : undefined;
  } catch {
    return undefined;
  }
}
