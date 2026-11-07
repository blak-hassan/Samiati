"use client";

import { useTheme } from "next-themes";
import * as React from "react";
import { toast } from "sonner";

import { LanguageSelector } from "@/components/language/language-selector";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSamiatiAuth } from "@/lib/auth/provider";
import { useSamiatiData } from "@/lib/data/provider";
import { useLanguagePreferences } from "@/lib/language-preferences/provider";
import { usePreferences } from "@/lib/preferences/provider";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Row({
  label,
  description,
  control,
}: {
  label: string;
  description?: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <Label className="text-sm font-medium">{label}</Label>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const { user: authUser, provider, signOut } = useSamiatiAuth();
  const { store, user, refreshUser: refreshStoreUser } = useSamiatiData();
  const { languageId, setLanguage, favorites, recent, toggleFavorite } =
    useLanguagePreferences();
  const preferences = usePreferences();

  const [contributionConsent, setContributionConsent] = React.useState(false);

  React.useEffect(() => {
    setContributionConsent(user?.contributionConsent ?? false);
  }, [user?.contributionConsent]);

  const handleContributionConsent = React.useCallback(
    async (checked: boolean) => {
      setContributionConsent(checked);
      await store.updateCurrentUser({ contributionConsent: checked });
      await refreshStoreUser();
      toast.success(
        checked
          ? "Thank you — your contributions may be used to improve Samiati's models."
          : "Your contributions will no longer be used for model training.",
      );
    },
    [refreshStoreUser, store],
  );

  const clearLocalData = React.useCallback(() => {
    const ok = window.confirm(
      "Clear all Samiati data stored in this browser? Conversations, contributions and preferences will be removed. This cannot be undone.",
    );
    if (!ok) return;
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith("samiati:")) window.localStorage.removeItem(key);
    }
    window.location.reload();
  }, []);

  const handleSignOut = React.useCallback(async () => {
    if (provider === "local") {
      toast.info(
        "Samiati is running in local mode — there is no account to sign out of. Your data stays in this browser.",
      );
      return;
    }
    await signOut();
  }, [provider, signOut]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Settings
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Make Samiati yours
          </h1>
        </header>

        <div className="space-y-5">
          <Section
            title="Language"
            description="The language Samiati uses for new conversations."
          >
            <Row
              label="Default language"
              description="Used whenever you start a new chat."
              control={
                <LanguageSelector
                  value={languageId}
                  onChange={setLanguage}
                  variant="compact"
                  favorites={favorites}
                  recent={recent}
                  onToggleFavorite={toggleFavorite}
                />
              }
            />
            <Row
              label="Favourite languages"
              description="Pinned to the top of the language selector."
              control={
                <span className="text-sm text-muted-foreground">
                  {favorites.length} pinned
                </span>
              }
            />
          </Section>

          <Section
            title="Appearance"
            description="Samiati follows your system theme by default."
          >
            <Row
              label="Theme"
              control={
                <Select
                  value={theme ?? "system"}
                  onValueChange={(value) => setTheme(value)}
                >
                  <SelectTrigger className="w-[9.5rem]" aria-label="Theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              }
            />
            <Row
              label="Reduce motion"
              description="Turns off interface animations."
              control={
                <Switch
                  checked={preferences.reduceMotion}
                  onCheckedChange={(checked) =>
                    preferences.setPreference("reduceMotion", checked)
                  }
                  aria-label="Reduce motion"
                />
              }
            />
          </Section>

          <Section
            title="Voice"
            description="Voice input and output arrive in a later release."
          >
            <Row
              label="Voice input and output"
              description="Not available yet — this stays disabled until speech support ships."
              control={
                <Switch
                  checked={false}
                  disabled
                  aria-label="Voice input and output (not available yet)"
                />
              }
            />
          </Section>

          <Section
            title="AI responses"
            description="How Samiati explains what it did."
          >
            <Row
              label="Show translation provenance"
              description="Labels replies that were translated from English, so you always know."
              control={
                <Switch
                  checked={preferences.showTranslationProvenance}
                  onCheckedChange={(checked) =>
                    preferences.setPreference(
                      "showTranslationProvenance",
                      checked,
                    )
                  }
                  aria-label="Show translation provenance"
                />
              }
            />
          </Section>

          <Section
            title="Data and privacy"
            description="Your data, your call."
          >
            <Row
              label="Allow my contributions to improve Samiati"
              description="Contributions you make in Changa may be used to train and evaluate Samiati's language models. You can turn this off at any time."
              control={
                <Switch
                  checked={contributionConsent}
                  onCheckedChange={(checked) =>
                    void handleContributionConsent(checked)
                  }
                  aria-label="Allow contributions to improve Samiati"
                />
              }
            />
            <Row
              label="Storage"
              description={
                provider === "local"
                  ? "Samiati is running in local mode. Your conversations and contributions are stored only in this browser."
                  : "Your conversations and contributions are stored in your Samiati account."
              }
              control={
                <Button variant="outline" size="sm" onClick={clearLocalData}>
                  Clear local data
                </Button>
              }
            />
          </Section>

          <Section title="Account">
            <Row
              label={provider === "local" ? "Guest account" : "Signed in"}
              description={
                provider === "local"
                  ? "No account is required to use Samiati in local mode."
                  : `Signed in as ${authUser?.displayName ?? "member"}.`
              }
              control={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleSignOut()}
                >
                  {provider === "local" ? "About accounts" : "Sign out"}
                </Button>
              }
            />
          </Section>
        </div>
      </div>
    </div>
  );
}
