'use client';

import React, { useId, useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  HeartHandshake,
  Languages,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  Search,
  Settings,
  ShieldCheck,
  SquarePen,
  Users,
} from 'lucide-react';
import { type Conversation, Screen } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Brand } from '@/components/product/Brand';
import { cn } from '@/lib/utils';

interface SidebarContentProps {
  user?: { name?: string; handle?: string; avatar?: string; role?: string; isGuest?: boolean };
  onNavigate: (screen: Screen) => void;
  onNewSearch: () => void;
  notificationCounts?: { contributions?: number; moderation?: number };
  conversations?: Conversation[];
  onChatSelect?: (id: string) => void;
  activeConversationId?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

function SidebarContent({
  user,
  onNavigate,
  onNewSearch,
  notificationCounts,
  conversations = [],
  onChatSelect,
  activeConversationId,
  collapsed = false,
  onToggleCollapse,
}: SidebarContentProps) {
  const [search, setSearch] = useState('');
  const searchId = useId();
  const isGuest = !user || user.isGuest;
  const filtered = [...conversations]
    .filter((conversation) =>
      conversation.title.toLowerCase().includes(search.trim().toLowerCase())
    )
    .sort((a, b) => b.lastActive - a.lastActive);
  const groups = [
    { label: 'Pinned', items: filtered.filter((conversation) => conversation.isPinned) },
    { label: 'Recent', items: filtered.filter((conversation) => !conversation.isPinned) },
  ];
  const itemClass =
    'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-sidebar-accent hover:text-foreground';

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
      <div
        className={cn('flex min-h-20 items-center gap-1 px-5', collapsed && 'justify-center px-2')}
      >
        {!collapsed && <Brand className="mr-auto" />}
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            className="size-11 shrink-0"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </Button>
        )}
      </div>
      <div className={cn('px-4', collapsed && 'px-2')}>
        <Button
          onClick={onNewSearch}
          className={cn(
            'h-11 w-full justify-start gap-3 rounded-xl',
            collapsed && 'justify-center px-0'
          )}
          aria-label="New chat"
          title="New chat"
        >
          <SquarePen className="size-4" />
          {!collapsed && 'New chat'}
        </Button>
      </div>
      <nav aria-label="Explore Samiati" className={cn('mt-5 space-y-1 px-4', collapsed && 'px-2')}>
        {[
          { label: 'Discover', icon: Compass, screen: Screen.DISCOVER },
          {
            label: 'Changa',
            icon: HeartHandshake,
            screen: Screen.CHANGA,
            count: notificationCounts?.contributions,
          },
          { label: 'Community', icon: Users, screen: Screen.MESSAGES },
        ].map(({ label, icon: Icon, screen, count }) => (
          <button
            key={label}
            type="button"
            className={cn(itemClass, collapsed && 'justify-center px-0')}
            onClick={() => onNavigate(screen)}
            aria-label={label}
            title={label}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {!collapsed && (
              <>
                <span className="flex-1">{label}</span>
                {Boolean(count) && (
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-xs">{count}</span>
                )}
              </>
            )}
          </button>
        ))}
        <Link
          href="/languages"
          className={cn(itemClass, collapsed && 'justify-center px-0')}
          aria-label="Languages"
          title="Languages"
        >
          <Languages className="size-4 shrink-0" aria-hidden="true" />
          {!collapsed && 'Languages'}
        </Link>
        {!isGuest && (user?.role === 'moderator' || user?.role === 'admin') && (
          <button
            type="button"
            className={cn(itemClass, collapsed && 'justify-center px-0')}
            onClick={() => onNavigate(Screen.MODERATION_DASHBOARD)}
            aria-label="Moderation"
            title="Moderation"
          >
            <ShieldCheck className="size-4 shrink-0" />
            {!collapsed && 'Moderation'}
          </button>
        )}
      </nav>
      {!collapsed && (
        <section
          className="mt-6 flex min-h-0 flex-1 flex-col px-4"
          aria-label="Conversation history"
        >
          <label
            htmlFor={searchId}
            className="mb-2 px-1 text-xs font-semibold text-muted-foreground"
          >
            Your conversations
          </label>
          <div className="relative mb-3">
            <Search
              className="absolute left-3 top-3.5 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id={searchId}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search conversations"
              className="h-11 bg-background/40 pl-9 text-xs"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {groups.map(
              ({ label, items }) =>
                items.length > 0 && (
                  <div key={label} className="mb-4">
                    <h2 className="mb-1 px-2 text-xs text-muted-foreground">{label}</h2>
                    {items.slice(0, 15).map((conversation) => (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() =>
                          onChatSelect
                            ? onChatSelect(conversation.id)
                            : onNavigate(Screen.SAVED_CONVERSATIONS)
                        }
                        aria-current={conversation.id === activeConversationId ? 'page' : undefined}
                        className={cn(
                          itemClass,
                          'gap-2 px-2 text-xs',
                          conversation.id === activeConversationId &&
                            'bg-sidebar-accent text-foreground'
                        )}
                      >
                        {conversation.isPinned ? (
                          <Pin className="size-3.5 shrink-0" aria-hidden="true" />
                        ) : (
                          <MessageCircle className="size-3.5 shrink-0" aria-hidden="true" />
                        )}
                        <span className="truncate">{conversation.title}</span>
                      </button>
                    ))}
                  </div>
                )
            )}
            {!filtered.length && (
              <p role="status" className="px-2 py-4 text-xs leading-relaxed text-muted-foreground">
                {search ? 'No matching conversations.' : 'Your conversations will appear here.'}
              </p>
            )}
            {!isGuest && (
              <button
                type="button"
                onClick={() => onNavigate(Screen.SAVED_CONVERSATIONS)}
                className="min-h-11 px-2 text-xs font-semibold text-primary hover:underline"
              >
                View all conversations →
              </button>
            )}
          </div>
          <p className="mt-2 px-2 text-xs leading-relaxed text-muted-foreground">
            History is saved in this browser.
          </p>
        </section>
      )}
      <div
        className={cn(
          'mt-auto space-y-1 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]',
          collapsed && 'px-2'
        )}
      >
        <button
          type="button"
          className={cn(itemClass, collapsed && 'justify-center px-0')}
          onClick={() => onNavigate(Screen.SETTINGS)}
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="size-4 shrink-0" aria-hidden="true" />
          {!collapsed && 'Settings'}
        </button>
        <button
          type="button"
          onClick={() => onNavigate(isGuest ? Screen.SIGN_IN : Screen.PROFILE)}
          className={cn(
            'flex min-h-14 w-full items-center gap-3 rounded-xl border border-sidebar-border p-2 text-left hover:bg-sidebar-accent',
            collapsed && 'justify-center border-0 px-0'
          )}
          aria-label={isGuest ? 'Sign in to Samiati' : 'Open your profile'}
          title={isGuest ? 'Sign in' : user?.name}
        >
          <Avatar className="size-8 shrink-0">
            <AvatarImage src={user?.avatar} alt="" />
            <AvatarFallback className="bg-secondary text-xs font-semibold">
              {user?.name?.slice(0, 1) ?? 'S'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                {isGuest ? 'Make yourself at home' : user?.name}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {isGuest ? 'Sign in to continue' : 'Your profile & preferences'}
              </span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

interface AppSidebarProps extends Omit<SidebarContentProps, 'collapsed' | 'onToggleCollapse'> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppSidebar({ open, onOpenChange, ...props }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="left"
          className="w-[min(20rem,calc(100vw-1rem))] gap-0 border-sidebar-border bg-sidebar p-0 lg:hidden"
        >
          <SheetTitle className="sr-only">Samiati navigation and conversation history</SheetTitle>
          <SheetDescription className="sr-only">
            Find a conversation, start a new chat, or explore Samiati.
          </SheetDescription>
          <SidebarContent
            {...props}
            onNavigate={(screen) => {
              onOpenChange(false);
              props.onNavigate(screen);
            }}
            onNewSearch={() => {
              onOpenChange(false);
              props.onNewSearch();
            }}
            onChatSelect={(id) => {
              onOpenChange(false);
              props.onChatSelect?.(id);
            }}
          />
        </SheetContent>
      </Sheet>
      <aside
        aria-label="Samiati sidebar"
        className={cn(
          'hidden h-full shrink-0 border-r border-sidebar-border transition-[width] duration-200 lg:block',
          collapsed ? 'w-18' : 'w-64 xl:w-72'
        )}
      >
        <SidebarContent
          {...props}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((value) => !value)}
        />
      </aside>
    </>
  );
}
