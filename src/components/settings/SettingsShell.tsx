"use client";

import React, { useMemo, useState, useRef, useCallback } from "react";
import { Moon, Sun, Settings as SettingsIcon, LogOut, Bell, Shield, HelpCircle, KeyRound, Lock, Download, ChevronRight, DollarSign } from "lucide-react";
import { Screen } from "@/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import SettingsPageHeader from "@/components/settings/SettingsPageHeader";
import { cn } from "@/lib/utils";

export interface SettingsNavItem {
  key: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  screen: Screen;
  /** Group/eyebrow text shown in the rail. */
  group: string;
  requiresPrivacy?: boolean;
  /** Whether to show a plan tier badge next to the item. */
  premium?: boolean;
  /** Plan tier when `premium` is true (e.g. "Fluent", "Learner"). */
  planTier?: string;
}

export interface SettingsNavGroup {
  key: string;
  title: string;
  items: SettingsNavItem[];
}

const pkg = { version: "1.0.0" };

interface SettingsShellProps {
  activeScreen: Screen;
  navigate: (screen: Screen) => void;
  goBack: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  saving?: boolean;
  onSignOut?: () => void;
  user: { name: string; avatar: string };
  children: React.ReactNode;
  /** Optional header status pill text, e.g. "Saved · just now". */
  headerStatus?: string;
}

const buildGroups = (): SettingsNavGroup[] => [
  {
    key: "account",
    title: "Account",
    items: [
      { key: "account", label: "Account & security", description: "Password, 2FA, sessions", icon: <KeyRound className="w-4 h-4" />, screen: Screen.SETTINGS_ACCOUNT, group: "Account" },
    ],
  },
  {
    key: "communication",
    title: "Communication",
    items: [
      { key: "notifications", label: "Notifications", description: "Push, email, in-app", icon: <Bell className="w-4 h-4" />, screen: Screen.SETTINGS_NOTIFICATIONS, group: "Communication" },
    ],
  },
  {
    key: "privacy",
    title: "Privacy & Safety",
    items: [
      { key: "privacy", label: "Privacy controls", description: "Profile, voice, cultural data", icon: <Shield className="w-4 h-4" />, screen: Screen.SETTINGS_PRIVACY, group: "Privacy & Safety", requiresPrivacy: true },
    ],
  },
  {
    key: "data",
    title: "Data & Storage",
    items: [
      { key: "data", label: "Data & storage", description: "Data saver, quality, exports", icon: <Download className="w-4 h-4" />, screen: Screen.SETTINGS_DATA, group: "Data & Storage", requiresPrivacy: true },
    ],
  },
  {
    key: "subscription",
    title: "Subscription",
    items: [
      { key: "billing", label: "Billing & subscription", description: "Plans, payments, invoices", icon: <DollarSign className="w-4 h-4" />, screen: Screen.SETTINGS_BILLING, group: "Subscription" },
    ],
  },
  {
    key: "help",
    title: "Help & About",
    items: [
      { key: "help", label: "Help & support", description: "FAQ, contact us", icon: <HelpCircle className="w-4 h-4" />, screen: Screen.SETTINGS_HELP, group: "Help & About" },
    ],
  },
];

/** Screens that render their own full header (back arrow, title) — the shell must not stack its own above them. */
const SELF_HEADER_SCREENS: ReadonlySet<Screen> = new Set<Screen>([
  Screen.SETTINGS_EDIT_PROFILE,
  Screen.SETTINGS_PROFILE,
  Screen.SETTINGS_BILLING,
]);

const SettingsShell: React.FC<SettingsShellProps> = ({
  activeScreen,
  navigate,
  goBack,
  isDarkMode,
  toggleTheme,
  saving,
  onSignOut,
  user,
  children,
  headerStatus,
}) => {
  const groups = useMemo(() => buildGroups(), []);
  const allItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);

  // Active label for the mobile header.
  const activeItem = allItems.find((i) => i.screen === activeScreen);

  // Self-headered screens bring their own top bar; the shell hides its own
  // (mobile top bar and desktop header) so headers don't stack.
  const hasOwnHeader = SELF_HEADER_SCREENS.has(activeScreen);

  const handleNav = useCallback(
    (screen: Screen) => {
      navigate(screen);
      setDrawerOpen(false);
    },
    [navigate],
  );

  const renderRailBody = (inDrawer = false) => (
    <>
      {/* User card (only in the persistent rail, not the mobile drawer). */}
      {!inDrawer && (
        <button
          type="button"
          onClick={() => handleNav(Screen.SETTINGS_EDIT_PROFILE)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors text-left group"
        >
          <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-black text-sm shrink-0 overflow-hidden">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user.name[0]?.toUpperCase() ?? "U"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">View profile</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
        </button>
      )}

      {/* Groups */}
      <nav ref={railRef} className="flex-1 overflow-y-auto py-2">
        <ul className="space-y-0.5">
          {allItems.map((item) => {
            const active = item.screen === activeScreen;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => handleNav(item.screen)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted/40",
                  )}
                >
                  <span
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                      active ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground",
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-bold truncate">{item.label}</span>
                    {item.description && (
                      <span className="block text-[10px] text-muted-foreground font-medium truncate">
                        {item.description}
                      </span>
                    )}
                  </span>
                  {item.requiresPrivacy && <Lock className="w-3 h-3 text-muted-foreground/70 shrink-0" aria-label="Affects privacy" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-border/60 p-3 space-y-2">
        <div className="flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-muted/30">
          <div className="flex items-center gap-2">
            {isDarkMode ? <Moon className="w-4 h-4 text-muted-foreground" /> : <Sun className="w-4 h-4 text-muted-foreground" />}
            <span className="text-xs font-bold text-foreground">{isDarkMode ? "Dark" : "Light"}</span>
            {saving && <span className="text-[10px] text-muted-foreground">Saving…</span>}
          </div>
          <Switch checked={isDarkMode} onCheckedChange={toggleTheme} aria-label="Dark mode" className="data-[state=checked]:bg-primary scale-90" />
        </div>
        <p className="px-2 text-[10px] text-muted-foreground font-medium">
          Samiati v{pkg.version} · <a href="/terms" className="hover:underline">Terms</a> · <a href="/privacy" className="hover:underline">Privacy</a>
        </p>
        {onSignOut && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            className="w-full justify-start text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/5 gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </Button>
        )}
      </div>
    </>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background transition-colors duration-300">
      {/* Mobile top bar (only shown below md) — hidden for self-headered screens */}
      {!hasOwnHeader && (
      <div className="md:hidden">
        <SettingsPageHeader title={activeItem?.label ?? "Settings"} onBack={goBack} onExit={() => handleNav(Screen.HOME_CHAT)}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open settings menu"
            className="rounded-full"
          >
            <SettingsIcon className="w-5 h-5" />
          </Button>
        </SettingsPageHeader>
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="left" className="p-0 w-[85vw] sm:max-w-sm flex flex-col">
            <SheetTitle className="sr-only">Settings navigation</SheetTitle>
            <SheetDescription className="sr-only">Choose a settings section.</SheetDescription>
            <div className="flex flex-col flex-1 min-h-0">{renderRailBody(true)}</div>
          </SheetContent>
        </Sheet>
      </div>
      )}

      {/* Persistent rail (md+) */}
      <aside
        className="hidden md:flex w-64 lg:w-72 shrink-0 border-r border-border/60 bg-muted/10 flex-col min-h-screen"
        aria-label="Settings navigation"
      >
        {renderRailBody(false)}
      </aside>

      {/* Pane */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Desktop header (md+) shows breadcrumb-style title; mobile handled above.
            Hidden for self-headered screens so headers don't stack. */}
        {!hasOwnHeader && (
        <div className="hidden md:block">
          <SettingsPageHeader title={activeItem?.label ?? "Settings"} onBack={goBack} onExit={() => handleNav(Screen.HOME_CHAT)} status={headerStatus} />
        </div>
        )}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 pb-16 md:pb-12 max-w-3xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default SettingsShell;
