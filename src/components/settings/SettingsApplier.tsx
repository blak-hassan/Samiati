"use client";

import { useSettingsWithSideEffects } from '@/hooks/useSettings';

/**
 * Applies the persisted appearance settings to the document.
 *
 * Mounted once in the dashboard layout so the theme, accent colour, text
 * scale and accessibility flags are correct on every screen — not just the
 * settings pages. This replaces the old behaviour where the theme was only
 * applied while the settings screen was mounted.
 */
export default function SettingsApplier() {
  useSettingsWithSideEffects();
  return null;
}
