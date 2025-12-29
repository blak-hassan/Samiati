"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Screen, NotificationItem } from '@/types';
import {
  ArrowLeft,
  Search,
  Bell,
  Megaphone,
  CheckCircle2,
  Trophy,
  MessageCircle,
  MessagesSquare,
  Gavel,
  UserPlus,
  BellOff,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  navigate: (screen: Screen) => void;
  goBack: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onNotificationClick: (id: string, targetScreen?: Screen) => void;
}

const NotificationsScreen: React.FC<Props> = ({ goBack, notifications, onMarkAllRead, onNotificationClick }) => {
  const [filter, setFilter] = useState<'All' | 'Unread'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Scroll Header Logic
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const scrollY = useRef(0);
  const mainRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, []);

  const handleScroll = () => {
    if (!mainRef.current) return;
    const currentScrollY = mainRef.current.scrollTop;
    const diff = currentScrollY - scrollY.current;

    if (currentScrollY < 0) return;

    if (diff > 10 && currentScrollY > 50) {
      setIsHeaderVisible(false);
    } else if (diff < -10) {
      setIsHeaderVisible(true);
    }

    scrollY.current = currentScrollY;
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesFilter = filter === 'Unread' ? !n.isRead : true;
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getIconForType = (type: string) => {
    switch (type) {
      case 'challenge': return <Megaphone className="w-5 h-5" />;
      case 'contribution': return <CheckCircle2 className="w-5 h-5" />;
      case 'achievement': return <Trophy className="w-5 h-5" />;
      case 'comment': return <MessageCircle className="w-5 h-5" />;
      case 'message': return <MessagesSquare className="w-5 h-5" />;
      case 'moderation': return <Gavel className="w-5 h-5" />;
      case 'follow': return <UserPlus className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Scrollable Header Container */}
      <div
        ref={headerRef}
        className="absolute top-0 left-0 right-0 z-20 transition-all duration-300 ease-in-out bg-background/95 backdrop-blur-md shadow-sm border-b border-border"
        style={{ marginTop: isHeaderVisible ? 0 : -headerHeight }}
      >
        <header className="flex items-center px-4 h-16">
          <Button variant="ghost" size="icon" onClick={goBack} className="-ml-2 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="flex-1 text-center text-lg font-bold text-foreground pr-8">Notifications</h1>
        </header>

        <div className="px-4 pb-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              className="pl-12 h-11 rounded-xl bg-muted/50 border-transparent focus-visible:ring-primary/50"
            />
          </div>

          {/* Filters */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant={filter === 'All' ? "default" : "secondary"}
                size="sm"
                onClick={() => setFilter('All')}
                className="rounded-full px-5 h-8 font-bold text-xs uppercase tracking-wider"
              >
                All
              </Button>
              <Button
                variant={filter === 'Unread' ? "default" : "secondary"}
                size="sm"
                onClick={() => setFilter('Unread')}
                className="rounded-full px-5 h-8 font-bold text-xs uppercase tracking-wider"
              >
                Unread
              </Button>
            </div>
            <Button variant="link" size="sm" onClick={onMarkAllRead} className="text-primary font-bold">
              Mark all as read
            </Button>
          </div>
        </div>
      </div>

      <main
        ref={mainRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ paddingTop: headerHeight + 16 }}
      >
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
            <BellOff className="w-16 h-16 mb-4" />
            <p className="font-medium">No notifications found.</p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              onClick={() => onNotificationClick(item.id, item.targetScreen)}
              className={cn(
                "flex gap-4 p-4 rounded-2xl border transition-all cursor-pointer active:scale-[0.98]",
                item.isRead
                  ? "bg-transparent border-transparent hover:bg-muted/50"
                  : "bg-card border-border shadow-sm ring-1 ring-primary/5"
              )}
            >
              <div className="relative shrink-0">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  item.isRead
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary/10 text-primary"
                )}>
                  {getIconForType(item.type)}
                </div>
                {!item.isRead && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary border-2 border-background rounded-full" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h4 className={cn(
                    "text-sm leading-tight line-clamp-1",
                    item.isRead ? "text-muted-foreground" : "text-foreground font-bold"
                  )}>
                    {item.title}
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap pt-0.5">
                    {item.time}
                  </span>
                </div>
                <p className={cn(
                  "text-sm mt-1 mb-2 line-clamp-2",
                  item.isRead ? "text-muted-foreground/80" : "text-foreground/80"
                )}>
                  {item.message}
                </p>
                {!item.isRead && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                    <Check className="w-3 h-3" />
                    New Interaction
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div className="h-24"></div>
      </main>
    </div>
  );
};

export default NotificationsScreen;

