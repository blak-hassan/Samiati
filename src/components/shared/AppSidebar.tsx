"use client";

import React from "react";
import { Screen, Conversation } from "@/types";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SidebarContent, SidebarContentProps } from "./SidebarContent";
interface AppSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: SidebarContentProps["user"];
  onNavigate: (screen: Screen) => void;
  onNewSearch: () => void;
  notificationCounts?: SidebarContentProps["notificationCounts"];
  conversations?: Conversation[];
  onChatSelect?: (id: string) => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  open,
  onOpenChange,
  user,
  onNavigate,
  onNewSearch,
  notificationCounts,
  conversations = [],
  onChatSelect,
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
            conversations={conversations}
            onChatSelect={onChatSelect}
            mobile
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
          conversations={conversations}
          onChatSelect={onChatSelect}
        />
      </aside>
    </>
  );
};

export default AppSidebar;
