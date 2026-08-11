"use client";

import React, { useState } from 'react';
import { Screen, ChatPreview, NavigateFn } from '@/types';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import {
  ArrowLeft,
  Settings,
  Search,
  Users,
  Megaphone,
  Check,
  CheckCheck,
  MessageSquarePlus,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Props {
  navigate: NavigateFn;
  goBack: () => void;
  // chats from Convex - now required for proper functionality
  chats?: ChatPreview[];
  // Loading state from Convex query
  isLoading?: boolean;
}

const DMListScreen: React.FC<Props> = ({ navigate, goBack, chats = [], isLoading = false }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Use chats directly from props (fetched from Convex in parent page)
  // No more mock service polling - data comes from Convex reactive queries

  const searchKeys = React.useMemo(() => ['name', 'lastMessage'], []);
  const filteredChats = useFuzzySearch(chats, searchQuery, searchKeys);

  const handleChatClick = (chat: ChatPreview) => {
    navigate(Screen.DIRECT_MESSAGE, {
      chatId: chat.id,
      chatUser: {
        id: chat.recipientId || chat.id,
        name: chat.name,
        avatar: chat.avatar,
        isOnline: chat.isOnline
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read': return <CheckCheck className="w-3.5 h-3.5 text-rasta-green" />;
      case 'delivered': return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />;
      case 'sent': return <Check className="w-3.5 h-3.5 text-muted-foreground" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
      <header className="flex items-center p-4 bg-background/95 backdrop-blur-md sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={goBack} className="-ml-2 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="flex-1 text-xl font-bold text-foreground ml-2 tracking-tight">Messages</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(Screen.SETTINGS)}
          className="rounded-full"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </header>

      {/* Search Bar */}
      <div className="px-4 py-3 bg-muted/30 border-b border-border">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border-border/50 rounded-xl pl-10 h-10 focus-visible:ring-primary/20"
          />
        </div>
      </div>

      <main className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-4 animate-in fade-in duration-300">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4" style={{ animationDelay: `${i * 80}ms` }}>
                <Skeleton className="w-14 h-14 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        ) : filteredChats.length > 0 ? (
          filteredChats.map((chat, index) => (
            <div
              key={chat.id}
              onClick={() => handleChatClick(chat)}
              className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-all border-b border-border/50 last:border-0 group animate-fade-in-up"
              style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'backwards' }}
            >
              <div className="relative">
                <Avatar className="w-14 h-14 border border-border shadow-sm group-hover:scale-105 transition-transform duration-300">
                  <AvatarImage src={chat.avatar} alt={chat.name} className="object-cover" />
                  <AvatarFallback className="font-bold">{chat.name[0]}</AvatarFallback>
                </Avatar>
                {chat.isGroup && (
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 shadow-sm border border-border">
                    <Users className="w-3 h-3 text-primary" />
                  </div>
                )}
                {chat.isCommunity && (
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 shadow-sm border border-border">
                    <Megaphone className="w-3 h-3 text-primary" />
                  </div>
                )}
                {chat.isOnline && !chat.isGroup && !chat.isCommunity && (
                  <span className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-rasta-green border-2 border-background rounded-full ring-1 ring-rasta-green/20"></span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{chat.name}</h3>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    chat.unreadCount > 0 ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {chat.time}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground truncate pr-2 font-medium">
                    {chat.status && !chat.isGroup && !chat.isCommunity && getStatusIcon(chat.status)}
                    <span className={cn(
                      "truncate",
                      chat.unreadCount > 0 && "text-foreground font-semibold"
                    )}>
                      {chat.lastMessage}
                    </span>
                  </div>
                  {chat.unreadCount > 0 && (
                    <Badge variant="default" className="rounded-full h-5 min-w-[20px] px-1 justify-center bg-primary hover:bg-primary shadow-lg shadow-primary/20">
                      {chat.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center text-muted-foreground animate-in fade-in duration-500">
            <Search className="w-16 h-16 mb-4 opacity-10" />
            <p className="text-lg font-bold text-foreground/50">No messages found</p>
            <p className="text-sm">Try searching for a different name or message content.</p>
          </div>
        )}
      </main>

      <div className="fixed bottom-6 right-6">
        <Button
          size="icon"
          onClick={() => navigate(Screen.PEOPLE_TO_FOLLOW, { filter: 'SelectContact' })}
          className="w-14 h-14 rounded-full shadow-2xl shadow-primary/30 transform hover:scale-110 active:scale-95 transition-all duration-300"
        >
          <MessageSquarePlus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

export default DMListScreen;
