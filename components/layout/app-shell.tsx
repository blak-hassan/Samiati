"use client";

import { Menu } from "lucide-react";
import * as React from "react";

import { SamiatiLogo } from "@/components/layout/samiati-logo";
import { Sidebar } from "@/components/layout/sidebar";
import { LanguageSelector } from "@/components/language/language-selector";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLanguagePreferences } from "@/lib/language-preferences/provider";

/**
 * The application shell.
 *
 * Desktop shows a fixed sidebar. Mobile shows the same sidebar inside a
 * drawer, triggered from a compact header. There is one sidebar
 * implementation, so navigation can never drift between the two.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { languageId, setLanguage, favorites, recent, toggleFavorite } =
    useLanguagePreferences();

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <div className="hidden w-[17.5rem] shrink-0 lg:block">
        <Sidebar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b px-3 py-2.5 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </Button>
          <SamiatiLogo />
          <div className="ml-auto">
            <LanguageSelector
              value={languageId}
              onChange={setLanguage}
              variant="compact"
              favorites={favorites}
              recent={recent}
              onToggleFavorite={toggleFavorite}
            />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[17.5rem] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
