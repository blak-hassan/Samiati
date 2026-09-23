"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { useQuery } from "convex/react";
import { useNavigation } from "@/hooks/useNavigation";
import { useAppUser } from "@/hooks/useAppUser";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useClerk as useClerkAuth } from "@clerk/nextjs";
import { useClerk as useMockClerk } from "@/app/MockProviders";
import { isDemoMode } from "@/lib/appMode";
import { Screen } from "@/types";
import { useTheme } from "@/hooks/useTheme";

import SettingsShell from "@/components/settings/SettingsShell";
import SettingsGroup from "@/components/settings/SettingsGroup";
import SettingsRow from "@/components/settings/SettingsRow";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Zap,
  ChevronRight,
  Shield,
  KeyRound,
  Bell,
  HelpCircle,
  Download,
  Globe,
} from "lucide-react";

const useClerk = isDemoMode ? useMockClerk : useClerkAuth;

/** Matches the `md` breakpoint at which SettingsShell shows the persistent rail. */
const DESKTOP_QUERY = "(min-width: 768px)";

const subscribeDesktop = (onChange: () => void) => {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
};

/**
 * Settings entry point.
 *
 * - Desktop (md+): immediately redirects to the first settings section
 *   ("Account & security") so the shell never renders a duplicated overview
 *   pane next to the navigation rail.
 * - Mobile (<md): renders the overview list — the rail is drawer-only there,
 *   so this list is how users discover settings sections.
 */
const SettingsIndexClient: React.FC = () => {
  const router = useRouter();
  const { navigate, goBack } = useNavigation();
  const { user: clerkUser, isLoaded } = useAppUser();
  const { signOut } = useClerk();

  // SSR and the first client render assume mobile (list view); the store
  // corrects desktop clients immediately after hydration.
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );

  // Single source of truth for the theme — see `useTheme`.
  const { isDark, toggleTheme, saving } = useTheme();

  useEffect(() => {
    if (isDesktop) {
      router.replace("/dashboard/settings/account");
    }
  }, [isDesktop, router]);

  // Subscription state for the plan banner — mirrors the query path used by
  // SubscriptionManager so the overview and the billing page show the same tier.
  const profile = useQuery(api.users.queries.getProfile, {});
  // `userId` is a required Convex arg, so skip the query until the profile
  // document (and therefore the user id) has loaded — otherwise Convex would
  // reject the call with a missing-argument validation error.
  const subscription = useQuery(
    api.payments.billing.getActiveSubscription,
    profile?._id ? { userId: profile._id as Id<"users"> } : "skip",
  );
  // Mirrors `payments.billing.getUserPlanTier`: a subscription only counts as
  // paid while it is neither canceled/expired nor past its period end.
  const plan = subscription?.plan ?? "free";
  const isPaid =
    plan !== "free" &&
    !!subscription &&
    subscription.status !== "canceled" &&
    subscription.status !== "expired" &&
    subscription.currentPeriodEnd > Date.now();
  const planTier = isPaid ? plan : "free";

  const user = useMemo(
    () =>
      clerkUser
        ? { name: clerkUser.name || "User", avatar: clerkUser.avatar }
        : { name: "Guest", avatar: "" },
    [clerkUser],
  );

  if (!isLoaded || isDesktop) {
    return null;
  }

  return (
    <SettingsShell
      activeScreen={Screen.SETTINGS}
      navigate={navigate}
      goBack={goBack}
      isDarkMode={isDark}
      toggleTheme={toggleTheme}
      saving={saving}
      onSignOut={async () => {
        try {
          await signOut();
        } catch {
          // ignore — even if sign-out fails, send the user to the welcome screen.
        }
        navigate(Screen.WELCOME);
      }}
      user={user}
    >
      <div className="space-y-6">
        {/* Premium banner */}
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-border/60 bg-card">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">
              {isPaid ? `Samiati+ (${planTier})` : "Samiati+"}
            </p>
            <p className="text-xs text-muted-foreground font-medium">
              {isPaid
                ? `${planTier} plan — manage billing & invoices`
                : "Free plan — upgrade for unlimited translations"}
            </p>
          </div>
          <Button onClick={() => navigate(Screen.SETTINGS_BILLING)} variant="ghost" size="sm" className="text-xs font-bold text-primary gap-1">
            Manage <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Quick settings */}
        <SettingsGroup title="Quick settings" description="Toggle your most-used preferences">
          {/* Dark mode inline toggle (only inline setting, rest are links) */}
          <div className="flex items-center justify-between px-4 min-h-14 border-b border-border/60">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">Dark mode</p>
                <p className="text-xs text-muted-foreground font-medium">High contrast interface</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Switch checked={isDark} onCheckedChange={toggleTheme} aria-label="Dark mode" className="data-[state=checked]:bg-primary" />
            </div>
          </div>
        </SettingsGroup>

        {/* Account */}
        <SettingsGroup title="Account" description="Manage your identity and security">
          <SettingsRow
            icon={<KeyRound className="w-4 h-4" />}
            label="Account & security"
            description="Password, 2FA, sessions"
            onClick={() => navigate(Screen.SETTINGS_ACCOUNT)}
          />
        </SettingsGroup>

        {/* Notifications */}
        <SettingsGroup title="Notifications" description="Choose what you get notified about">
          <SettingsRow
            icon={<Bell className="w-4 h-4" />}
            label="Notification preferences"
            description="Push, email, in-app"
            onClick={() => navigate(Screen.SETTINGS_NOTIFICATIONS)}
          />
        </SettingsGroup>

        {/* Privacy & data */}
        <SettingsGroup title="Privacy & data" description="Control what you share and how your data is used">
          <SettingsRow
            icon={<Shield className="w-4 h-4" />}
            label="Privacy controls"
            description="Profile visibility, voice data, cultural data"
            onClick={() => navigate(Screen.SETTINGS_PRIVACY)}
            requiresPrivacy
          />
          <SettingsRow
            icon={<Download className="w-4 h-4" />}
            label="Data & storage"
            description="Data saver, quality, exports"
            onClick={() => navigate(Screen.SETTINGS_DATA)}
            requiresPrivacy
          />
        </SettingsGroup>

        {/* Languages */}
        <SettingsGroup title="Language" description="Manage your language preferences">
          <SettingsRow
            icon={<Globe className="w-4 h-4" />}
            label="Manage languages"
            description="Add, remove, or adjust proficiency"
            onClick={() => navigate(Screen.MANAGE_LANGUAGES)}
            requiresPrivacy
          />
        </SettingsGroup>

        {/* Help */}
        <SettingsGroup title="Help & About">
          <SettingsRow
            icon={<HelpCircle className="w-4 h-4" />}
            label="Help & support"
            description="FAQ, contact us"
            onClick={() => navigate(Screen.SETTINGS_HELP)}
          />
        </SettingsGroup>
      </div>
    </SettingsShell>
  );
};

export default SettingsIndexClient;