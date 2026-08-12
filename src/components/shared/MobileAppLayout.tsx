"use client";

import React, { useState } from "react";
import { Screen } from "@/types";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "./AppSidebar";

interface MobileAppLayoutProps {
  children: React.ReactNode;
  user?: {
    name?: string;
    handle?: string;
    avatar?: string;
    role?: string;
    isGuest?: boolean;
  };
  onNavigate: (screen: Screen) => void;
  onNewSearch: () => void;
  notificationCounts?: {
    contributions?: number;
    moderation?: number;
  };
  showHamburger?: boolean;
  headerRight?: React.ReactNode;
}

export const MobileAppLayout: React.FC<MobileAppLayoutProps> = ({
  children,
  user,
  onNavigate,
  onNewSearch,
  notificationCounts,
  showHamburger = true,
  headerRight,
}) => {
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      <AppSidebar
        open={isNavOpen}
        onOpenChange={setIsNavOpen}
        user={user}
        onNavigate={onNavigate}
        onNewSearch={onNewSearch}
        notificationCounts={notificationCounts}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {showHamburger && (
          <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
            <div className="flex items-center justify-between px-4 h-14">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsNavOpen((prev) => !prev)}
                className="rounded-full transition-colors lg:hidden"
                aria-label="Toggle navigation"
                aria-expanded={isNavOpen}
              >
                <Menu className="w-6 h-6" />
              </Button>
              {headerRight}
            </div>
          </header>
        )}

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};
