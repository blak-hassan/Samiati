"use client";

import React from "react";
import { Screen } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Plus,
  History,
  Flame,
  MessagesSquare,
  BookOpen,
  ShieldCheck,
  Settings,
} from "lucide-react";

const SidebarItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  count?: number;
}> = ({ icon, label, onClick, count }) => (
  <button
    onClick={onClick}
    className="w-full h-11 flex items-center gap-3.5 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all group"
  >
    <div className="text-muted-foreground group-hover:text-primary transition-colors">
      {icon}
    </div>
    <span className="font-bold text-sm tracking-tight flex-1 text-left">
      {label}
    </span>
    {count !== undefined && count > 0 && (
      <Badge
        variant="default"
        className="bg-primary hover:bg-primary shadow-none h-5 min-w-[20px] px-1 justify-center font-bold text-[10px]"
      >
        {count}
      </Badge>
    )}
  </button>
);

interface SidebarContentProps {
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
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  user,
  onNavigate,
  onNewSearch,
  notificationCounts,
}) => {
  const userName = user?.name || "Guest";
  const userHandle = user?.handle || "@guest";
  const userAvatar = user?.avatar || "";
  const isGuest = user?.isGuest ?? true;

  return (
    <div className="flex flex-col h-full bg-muted/30">
      <div className="p-6">
        <div className="text-left mb-8">
          <div
            className="flex items-center gap-4 cursor-pointer"
            onClick={() => onNavigate(Screen.SETTINGS)}
          >
            <Avatar className="w-12 h-12 border-2 border-primary/20 hover:border-primary transition-colors">
              <AvatarImage src={userAvatar} />
              <AvatarFallback>{userName[0]}</AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <p className="text-lg font-bold tracking-tight">{userName}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {userHandle}
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={onNewSearch}
          className="w-full h-12 rounded-xl gap-2 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Kaanze
        </Button>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {isGuest ? (
          <>
            <SidebarItem
              icon={<History className="w-5 h-5" />}
              label="Sign in to save"
              onClick={() => onNavigate(Screen.SIGN_IN)}
            />
            <SidebarItem
              icon={<Flame className="w-5 h-5" />}
              label="Sign in to contribute"
              onClick={() => onNavigate(Screen.SIGN_IN)}
            />
            <SidebarItem
              icon={<MessagesSquare className="w-5 h-5" />}
              label="Sign in to message"
              onClick={() => onNavigate(Screen.SIGN_IN)}
            />
          </>
        ) : (
          <>
            <SidebarItem
              icon={<History className="w-5 h-5" />}
              label="Kaendelee"
              onClick={() => onNavigate(Screen.SAVED_CONVERSATIONS)}
            />
            <SidebarItem
              icon={<Flame className="w-5 h-5" />}
              label="Changa"
              count={notificationCounts?.contributions}
              onClick={() => onNavigate(Screen.CONTRIBUTIONS)}
            />
            <SidebarItem
              icon={<MessagesSquare className="w-5 h-5" />}
              label="Mushenee"
              onClick={() => onNavigate(Screen.MESSAGES)}
            />
          </>
        )}

        <SidebarItem
          icon={<BookOpen className="w-5 h-5" />}
          label="Darasa"
          onClick={() => onNavigate(Screen.DARASA)}
        />

        {!isGuest && (user?.role === "moderator" || user?.role === "admin") && (
          <SidebarItem
            icon={<ShieldCheck className="w-5 h-5" />}
            label="Moderation"
            count={notificationCounts?.moderation}
            onClick={() => onNavigate(Screen.MODERATION_DASHBOARD)}
          />
        )}
      </nav>

      <div className="p-4 mt-auto">
        <SidebarItem
          icon={<Settings className="w-5 h-5" />}
          label="Settings"
          onClick={() => onNavigate(Screen.SETTINGS)}
        />
      </div>
    </div>
  );
};

interface AppSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: SidebarContentProps["user"];
  onNavigate: (screen: Screen) => void;
  onNewSearch: () => void;
  notificationCounts?: SidebarContentProps["notificationCounts"];
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  open,
  onOpenChange,
  user,
  onNavigate,
  onNewSearch,
  notificationCounts,
}) => {
  return (
    <>
      {/* Mobile: Sheet drawer */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="left"
          className="w-[280px] sm:w-[300px] p-0 border-r border-border bg-background lg:hidden"
        >
          <SidebarContent
            user={user}
            onNavigate={(screen) => {
              onOpenChange(false);
              onNavigate(screen);
            }}
            onNewSearch={() => {
              onOpenChange(false);
              onNewSearch();
            }}
            notificationCounts={notificationCounts}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop: Persistent sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[260px] lg:min-w-[260px] lg:h-full border-r border-border bg-background">
        <SidebarContent
          user={user}
          onNavigate={onNavigate}
          onNewSearch={onNewSearch}
          notificationCounts={notificationCounts}
        />
      </aside>
    </>
  );
};
