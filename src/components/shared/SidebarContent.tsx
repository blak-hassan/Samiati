"use client";

import React from "react";
import { Screen, Conversation } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  History,
  Flame,
  MessagesSquare,
  MessageSquare,
  Plus,
  ChevronDown,
  ChevronRight,
  Settings,
  ShieldCheck,
} from "lucide-react";

const SidebarItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  count?: number;
}> = ({ icon, label, onClick, count }) => (
  <button
    onClick={onClick}
    className="w-full h-11 flex items-center gap-3.5 px-3 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all group"
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

export interface SidebarContentProps {
  user?: {
    name?: string;
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
  conversations?: Conversation[];
  onChatSelect?: (id: string) => void;
  /** Passed by AppSidebar's mobile sheet; lets the sidebar body adjust its
   * layout for the sheet context (reserved for that variant). */
  mobile?: boolean;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({
  user,
  onNavigate,
  onNewSearch,
  notificationCounts,
  conversations = [],
  onChatSelect,
}) => {
  const [sessionsExpanded, setSessionsExpanded] = React.useState(false);
  const userName = user?.name || "Guest";
  const userAvatar = user?.avatar || "";
  const isGuest = user?.isGuest ?? true;

  const recentConversations = conversations.slice(0, 5);

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
            <div>
              <button
                onClick={() => setSessionsExpanded(!sessionsExpanded)}
                className="w-full h-11 flex items-center gap-3.5 px-3 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all group"
              >
                <div className="text-muted-foreground group-hover:text-primary transition-colors">
                  <History className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm tracking-tight flex-1 text-left">
                  Sessions
                </span>
                {conversations.length > 0 && (
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                    {conversations.length}
                  </span>
                )}
                <div className="text-muted-foreground transition-transform duration-200">
                  {sessionsExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
              </button>
              
              {sessionsExpanded && (
                <div className="ml-4 mt-1 space-y-1 border-l-2 border-border pl-3">
                  {recentConversations.length > 0 ? (
                    recentConversations.map((conv) => (
                      <Popover key={conv.id}>
                        <PopoverTrigger asChild>
                          <button
                            onClick={() => {
                              // Prefer the chat-select callback (it carries the
                              // chatId in the URL). Only fall back to the bare
                              // navigate() if the host didn't wire one up —
                              // calling both would race and strip the chatId.
                              if (onChatSelect) {
                                onChatSelect(conv.id);
                              } else {
                                onNavigate(Screen.HOME_CHAT);
                              }
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-muted/50 transition-colors group cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground truncate flex-1">
                              {conv.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60 shrink-0">
                              {conv.messageCount} msgs
                            </span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="right" className="w-64 p-3 ml-2">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-foreground truncate">{conv.title}</p>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                              {conv.messages && conv.messages.length > 0 ? (
                                conv.messages.slice(-3).map((msg, idx) => (
                                  <div key={idx} className="flex items-start gap-1.5">
                                    <span className="text-[10px] font-bold text-primary uppercase shrink-0 mt-0.5">
                                      {msg.sender === 'user' ? 'You' : 'AI'}:
                                    </span>
                                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">
                                      {msg.text}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-[11px] text-muted-foreground italic">No messages yet</p>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground/60 pt-1 border-t border-border">
                              Click to open full conversation
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground px-2 py-1">No sessions yet</p>
                  )}
                  <button
                    onClick={() => onNavigate(Screen.SAVED_CONVERSATIONS)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-xs font-bold text-primary">View all sessions</span>
                  </button>
                </div>
              )}
            </div>
            <SidebarItem
              icon={<Flame className="w-5 h-5" />}
              label="Changa"
              count={notificationCounts?.contributions}
              onClick={() => onNavigate(Screen.CHANGA)}
            />
            <SidebarItem
              icon={<MessagesSquare className="w-5 h-5" />}
              label="Mushenee"
              onClick={() => onNavigate(Screen.MESSAGES)}
            />
          </>
        )}

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
