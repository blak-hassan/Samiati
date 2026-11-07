"use client";

import {
  Compass,
  Handshake,
  MessageSquarePlus,
  MessagesSquare,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { SamiatiLogo } from "@/components/layout/samiati-logo";
import { LanguageSelector } from "@/components/language/language-selector";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStore } from "@/lib/data/provider";
import type { Conversation } from "@/lib/data/types";
import { useLanguagePreferences } from "@/lib/language-preferences/provider";
import { getLanguageOrDefault } from "@/lib/languages";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/changa", label: "Changa", icon: Handshake },
  { href: "/communities", label: "Communities", icon: Users },
] as const;

export interface SidebarProps {
  /** Called after navigation so the mobile drawer can close itself. */
  onNavigate?: () => void;
  className?: string;
}

/**
 * The persistent Samiati sidebar.
 *
 * On desktop it is always visible. On mobile the same component is rendered
 * inside a drawer, so there is exactly one implementation of navigation.
 */
export function Sidebar({ onNavigate, className }: SidebarProps) {
  const store = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const { languageId, setLanguage, favorites, recent, toggleFavorite } =
    useLanguagePreferences();

  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [query, setQuery] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const loadConversations = React.useCallback(async () => {
    try {
      setConversations(await store.listConversations());
    } catch {
      setConversations([]);
    }
  }, [store]);

  React.useEffect(() => {
    void loadConversations();
  }, [loadConversations, pathname]);

  const visibleConversations = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter((conversation) =>
      conversation.title.toLowerCase().includes(needle),
    );
  }, [conversations, query]);

  const startConversation = React.useCallback(async () => {
    if (creating) return;
    setCreating(true);
    try {
      const conversation = await store.createConversation({
        languageId,
        title: "New conversation",
      });
      await loadConversations();
      onNavigate?.();
      router.push(`/chat/${conversation.id}`);
    } catch {
      toast.error("Could not start a new conversation.");
    } finally {
      setCreating(false);
    }
  }, [creating, languageId, loadConversations, onNavigate, router, store]);

  const renameConversation = React.useCallback(
    async (conversation: Conversation) => {
      const next = window.prompt("Rename conversation", conversation.title);
      if (!next || !next.trim()) return;
      await store.updateConversation(conversation.id, { title: next.trim() });
      await loadConversations();
    },
    [loadConversations, store],
  );

  const deleteConversation = React.useCallback(
    async (conversation: Conversation) => {
      const ok = window.confirm(
        `Delete “${conversation.title}”? This cannot be undone.`,
      );
      if (!ok) return;
      await store.deleteConversation(conversation.id);
      await loadConversations();
      if (pathname === `/chat/${conversation.id}`) {
        router.push("/");
      }
      toast.success("Conversation deleted.");
    },
    [loadConversations, pathname, router, store],
  );

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col border-r bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <SamiatiLogo />
        </Link>
      </div>

      <div className="space-y-3 px-3">
        <Button
          className="w-full justify-start gap-2"
          onClick={startConversation}
          disabled={creating}
        >
          <MessageSquarePlus className="h-4 w-4" aria-hidden />
          {creating ? "Starting…" : "New chat"}
        </Button>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search chats"
            aria-label="Search conversations"
            className="h-9 bg-background/70 pl-8"
          />
        </div>

        <LanguageSelector
          value={languageId}
          onChange={setLanguage}
          favorites={favorites}
          recent={recent}
          onToggleFavorite={toggleFavorite}
          className="w-full justify-between"
        />
      </div>

      <nav aria-label="Main" className="mt-4 px-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-5 flex min-h-0 flex-1 flex-col">
        <h2 className="px-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {query ? "Results" : "Recent chats"}
        </h2>
        <ScrollArea className="min-h-0 flex-1 px-2">
          {visibleConversations.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              {query
                ? "No chats match that search."
                : "Your conversations will appear here."}
            </p>
          ) : (
            <ul className="space-y-0.5 pb-2">
              {visibleConversations.map((conversation) => {
                const active = pathname === `/chat/${conversation.id}`;
                const language = getLanguageOrDefault(conversation.languageId);
                return (
                  <li key={conversation.id} className="group relative">
                    <Link
                      href={`/chat/${conversation.id}`}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2 rounded-lg py-2 pl-3 pr-8 text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {conversation.title}
                      </span>
                      <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                        {language.name}
                      </span>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Actions for ${conversation.title}`}
                          className="absolute right-1 top-1/2 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:flex focus-visible:ring-2 focus-visible:ring-ring group-hover:flex"
                        >
                          <span aria-hidden className="text-lg leading-none">
                            ⋯
                          </span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onSelect={() => void renameConversation(conversation)}
                        >
                          <Pencil className="mr-2 h-4 w-4" aria-hidden />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => void deleteConversation(conversation)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" aria-hidden />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </div>

      <div className="border-t px-3 py-3">
        <ul className="space-y-0.5">
          <li>
            <Link
              href="/profile"
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname.startsWith("/profile")
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <MessagesSquare className="h-4 w-4" aria-hidden />
              Profile
            </Link>
          </li>
          <li>
            <Link
              href="/settings"
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname.startsWith("/settings")
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Settings className="h-4 w-4" aria-hidden />
              Settings
            </Link>
          </li>
        </ul>

        <Button
          variant="ghost"
          className="mt-2 w-full justify-start gap-2 text-muted-foreground"
          onClick={() => void startConversation()}
        >
          <Plus className="h-4 w-4" aria-hidden />
          New conversation
        </Button>
      </div>
    </aside>
  );
}
