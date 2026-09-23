import SettingsIndexClient from "@/components/settings/SettingsIndexClient";

/**
 * Settings entry point. The client leaf decides the layout:
 * mobile (<md) renders the overview list, desktop (md+) redirects to
 * the first settings section so the overview never duplicates the rail.
 */
export default function SettingsIndexPage() {
  return <SettingsIndexClient />;
}