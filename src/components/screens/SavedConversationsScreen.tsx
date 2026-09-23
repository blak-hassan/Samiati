"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Screen, Conversation } from '@/types';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useToast } from '@/hooks/useToast';
import { formatRelativeTime, formatAbsoluteTime } from '@/lib/formatTime';
import { exportConversationAsJSON, exportConversationAsMarkdown } from '@/lib/exportConversation';
import { writeChangaSeed, pickSeedText } from '@/lib/changaSeed';
import {
    ArrowLeft,
    Search,
    Pin,
    PinOff,
    Trash2,
    MessageSquare,
    Clock,
    BookOpen,
    MoreVertical,
    Pencil,
    Check,
    X,
    Sparkles,
    CloudOff,
    Cloud,
    Archive,
    ArchiveRestore,
    Download,
    Filter,
    Languages,
    ArrowDownAZ,
    Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import SessionCategoryBadge from '@/components/changa/SessionCategoryBadge';
import { localConversationService } from '@/services/localConversationService';
import { useUser } from '@clerk/nextjs';

const ACTIVE_TAB_KEY = "samiati_sessions_active_tab";
const TAB_FROM_STORAGE: Record<string, 'all' | 'pinned' | 'recent' | 'archived'> = {
    all: "all",
    pinned: "pinned",
    recent: "recent",
    archived: "archived",
};

type Tab = 'all' | 'pinned' | 'recent' | 'archived';
type SortMode = 'recent' | 'az';
type SelectionMode = 'idle' | 'selecting';

const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const TAB_LABELS: Record<Tab, string> = { all: "All", pinned: "Pinned", recent: "Recent", archived: "Archived" };

interface Props {
    navigate: (screen: Screen, params?: Record<string, unknown>) => void;
    goBack: () => void;
    conversations: Conversation[];
    setConversations: (conversations: Conversation[]) => void;
    onChatSelect: (id: string) => void;
    onRename?: (id: string, newTitle: string) => void;
    onPin?: (id: string, isPinned: boolean) => void;
    onArchive?: (id: string, isArchived: boolean) => void;
    onSuggestTitle?: (id: string) => Promise<string | null>;
    onDeleteOne?: (id: string) => void;
    onDeleteMany?: (ids: string[]) => void;
    onArchiveMany?: (ids: string[], isArchived: boolean) => void;
    onPinMany?: (ids: string[], isPinned: boolean) => void;
    onContinueLast?: () => void;
    hasAnyConversation: boolean;
    /** Export every session as a single JSON file. */
    onExportAll?: () => void;
    /** Parse & merge a JSON session file; returns the number imported. */
    onImportSessions?: (file: File) => Promise<number>;
}

const SavedConversationsScreen: React.FC<Props> = ({
    navigate,
    goBack,
    conversations,
    setConversations,
    onChatSelect,
    onRename,
    onPin,
    onArchive,
    onSuggestTitle,
    onDeleteOne,
    onDeleteMany,
    onArchiveMany,
    onPinMany,
    onContinueLast,
    hasAnyConversation,
    onExportAll,
    onImportSessions,
}) => {
    const { isSignedIn } = useUser();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedQuery = useDebouncedValue(searchQuery, 150);
    const [activeTab, setActiveTab] = useState<Tab>(() => {
        if (typeof window === "undefined") return "all";
        return TAB_FROM_STORAGE[window.localStorage.getItem(ACTIVE_TAB_KEY) ?? ""] ?? "all";
    });
    const [sortMode, setSortMode] = useState<SortMode>('recent');
    const [languageFilter, setLanguageFilter] = useState<string | null>(null);
    const [selectionMode, setSelectionMode] = useState<SelectionMode>('idle');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [pendingDelete, setPendingDelete] = useState<{ id?: string; ids?: string[] } | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const importFileRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        try { window.localStorage.setItem(ACTIVE_TAB_KEY, activeTab); } catch { /* noop */ }
    }, [activeTab]);

    // "/" focuses search, Esc clears (standard inbox shortcut).
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
            if (e.key === "/" && !isTyping) {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
                setSearchQuery("");
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Precompute a single search blob per conversation so Fuse can search
    // message content via a flat top-level field.
    const searchable = useMemo(() => conversations.map((c) => {
        const messageBlob = (c.messages ?? [])
            .map((m) => m.text || "")
            .join(" \n ")
            .slice(0, 4000);
        return { ...c, searchBlob: `${c.title} \n ${c.language ?? ""} \n ${c.category ?? ""} \n ${messageBlob}` };
    }), [conversations]);

    const searchKeys = useMemo(() => ['title', 'language', 'category', 'searchBlob'], []);
    const filtered = useFuzzySearch(searchable, debouncedQuery, searchKeys);

    const availableLanguages = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of conversations) {
            const lang = c.language?.trim();
            if (!lang) continue;
            counts.set(lang, (counts.get(lang) ?? 0) + 1);
        }
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([lang, count]) => ({ lang, count }));
    }, [conversations]);

    // The "recent" cutoff is sampled into state once on mount and then
    // refreshed when the tab regains focus. Sampling it during render would
    // call the impure Date.now() function on every commit.
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') setNow(Date.now());
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, []);

    const recentCutoff = now - RECENT_WINDOW_MS;
    const tabCounts = useMemo(() => ({
        all: conversations.filter((c) => !c.isArchived).length,
        pinned: conversations.filter((c) => c.isPinned).length,
        recent: conversations.filter((c) => !c.isArchived && c.lastActive >= recentCutoff).length,
        archived: conversations.filter((c) => c.isArchived).length,
    }), [conversations, recentCutoff]);

    let displayedConversations = filtered;
    if (activeTab === 'recent') {
        displayedConversations = filtered.filter((c) => c.lastActive >= recentCutoff);
    } else if (activeTab === 'pinned') {
        displayedConversations = filtered.filter((c) => c.isPinned);
    } else if (activeTab === 'archived') {
        displayedConversations = filtered.filter((c) => c.isArchived);
    } else {
        displayedConversations = filtered.filter((c) => !c.isArchived);
    }

    if (languageFilter) {
        displayedConversations = displayedConversations.filter((c) => c.language === languageFilter);
    }

    displayedConversations = [...displayedConversations].sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        if (sortMode === 'az') return a.title.localeCompare(b.title);
        return b.lastActive - a.lastActive;
    });

    const handleDelete = useCallback((id: string) => setPendingDelete({ id }), []);
    const handleDeleteMany = useCallback((ids: string[]) => setPendingDelete({ ids }), []);

    const confirmDelete = useCallback(() => {
        if (!pendingDelete) return;
        if (pendingDelete.ids && pendingDelete.ids.length > 0) {
            const ids = pendingDelete.ids;
            localConversationService.deleteConversations(ids);
            const remaining = conversations.filter((c) => !ids.includes(c.id));
            setConversations(remaining);
            onDeleteMany?.(ids);
            setSelectedIds(new Set());
            setSelectionMode('idle');
            toast(`Deleted ${ids.length} session${ids.length === 1 ? "" : "s"}`, "success");
        } else if (pendingDelete.id) {
            const id = pendingDelete.id;
            localConversationService.deleteConversation(id);
            setConversations(conversations.filter((c) => c.id !== id));
            onDeleteOne?.(id);
            toast("Session deleted", "success");
        }
        setPendingDelete(null);
    }, [pendingDelete, conversations, onDeleteMany, onDeleteOne, setConversations, toast]);

    const handleTogglePin = useCallback((e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const target = conversations.find((c) => c.id === id);
        if (!target) return;
        const next = !target.isPinned;
        setConversations(conversations.map((c) => (c.id === id ? { ...c, isPinned: next } : c)));
        onPin?.(id, next);
    }, [conversations, setConversations, onPin]);

    const handleToggleArchive = useCallback((e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const target = conversations.find((c) => c.id === id);
        if (!target) return;
        const next = !target.isArchived;
        setConversations(conversations.map((c) => (c.id === id ? { ...c, isArchived: next } : c)));
        onArchive?.(id, next);
        toast(next ? "Archived" : "Restored", "info");
    }, [conversations, setConversations, onArchive, toast]);

    const handleSuggestTitle = useCallback(async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!onSuggestTitle) return;
        toast("Generating a title…", "info");
        const title = await onSuggestTitle(id);
        if (title) {
            const conv = conversations.find((c) => c.id === id);
            if (conv) onRename?.(id, title);
            toast(`Renamed to "${title.slice(0, 40)}${title.length > 40 ? "…" : ""}"`, "success");
        } else {
            toast("Couldn't generate a title right now", "error");
        }
    }, [onSuggestTitle, onRename, conversations, toast]);

    const handlePromoteToChanga = useCallback((e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const conv = conversations.find((c) => c.id === id);
        if (!conv) return;
        const seedText = pickSeedText(conv);
        if (!seedText) {
            toast("No message content to turn into a contribution yet", "error");
            return;
        }
        writeChangaSeed({
            conversationId: conv.id,
            title: conv.title,
            category: conv.category,
            language: conv.language,
            seedText,
        });
        navigate(Screen.ADD_CONTRIBUTION);
    }, [conversations, navigate, toast]);

    const handleExport = useCallback((e: React.MouseEvent, id: string, format: 'json' | 'md') => {
        e.stopPropagation();
        const conv = conversations.find((c) => c.id === id);
        if (!conv) return;
        if (format === 'json') exportConversationAsJSON(conv);
        else exportConversationAsMarkdown(conv);
        toast(`Exported as ${format.toUpperCase()}`, "success");
    }, [conversations, toast]);

    const handleExportAll = useCallback(() => {
        onExportAll?.();
        toast(`${conversations.length} session${conversations.length === 1 ? "" : "s"} exported`, "success");
    }, [onExportAll, conversations, toast]);

    const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !onImportSessions) return;
        setIsImporting(true);
        try {
            const count = await onImportSessions(file);
            toast(`${count} session${count === 1 ? "" : "s"} imported`, "success");
        } catch (err) {
            toast(err instanceof Error ? err.message : "Import failed — check the file and try again.", "error");
        } finally {
            setIsImporting(false);
        }
    }, [onImportSessions, toast]);

    const toggleSelected = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const handleShareStory = useCallback(() => navigate(Screen.ADD_CONTRIBUTION), [navigate]);

    const continueLast = onContinueLast ?? (() => {
        const last = [...conversations].sort((a, b) => b.lastActive - a.lastActive)[0];
        if (last) onChatSelect(last.id);
    });

    const pinnedFirst = displayedConversations.filter((c) => c.isPinned);
    const others = displayedConversations.filter((c) => !c.isPinned);

    return (
        <div className="flex flex-col min-h-screen bg-background relative overflow-hidden font-body motion-safe:animate-in motion-safe:fade-in">
            {/* Abstract Background Shapes */}
            <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[30%] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[30%] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={goBack}
                            className="rounded-full hover:bg-muted/50 transition-colors shrink-0"
                            aria-label="Back to chat"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Button>
                        <div className="min-w-0">
                            <h1 className="text-xl font-black tracking-tight text-foreground truncate">Sessions</h1>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">
                                {tabCounts.all} active · {tabCounts.pinned} pinned · {tabCounts.archived} archived
                            </p>
                        </div>
                    </div>
                    {selectionMode === 'selecting' ? (
                        <div className="flex items-center gap-1 shrink-0">
                            <span className="text-xs font-bold text-foreground px-2">{selectedIds.size} selected</span>
                            <Button size="icon" variant="ghost" onClick={() => { setSelectionMode('idle'); setSelectedIds(new Set()); }} aria-label="Cancel selection">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectionMode('selecting')}
                            className="rounded-full text-[10px] font-black uppercase tracking-widest h-8 px-3 shrink-0"
                        >
                            Select
                        </Button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 relative z-10 p-4 max-w-2xl mx-auto w-full space-y-6 overflow-y-auto no-scrollbar pb-32">

                {/* Search Bar */}
                <div className="relative group motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-4 duration-500">
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                    <Input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search by word, language, or proverb…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12 pl-12 pr-12 rounded-2xl bg-card/50 backdrop-blur-xl border-border/50 focus:bg-background transition-all shadow-sm"
                        aria-label="Search sessions"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }}
                            className="absolute right-3 top-2.5 w-7 h-7 rounded-full inline-flex items-center justify-center text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                            aria-label="Clear search"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    {!searchQuery && (
                        <kbd className="hidden sm:flex absolute right-3 top-3.5 h-6 px-1.5 items-center text-[10px] font-bold text-muted-foreground bg-muted/40 border border-border/40 rounded pointer-events-none">
                            /
                        </kbd>
                    )}
                </div>

                {/* Tabs + sort */}
                <div className="flex items-center gap-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-4 duration-500">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1">
                        {(['all', 'pinned', 'recent', 'archived'] as Tab[]).map((tab) => {
                            const count = tabCounts[tab];
                            if (tab === 'archived' && count === 0) return null;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 border whitespace-nowrap",
                                        activeTab === tab
                                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105"
                                            : "bg-card/50 text-muted-foreground border-border/50 hover:bg-muted/50"
                                    )}
                                    aria-pressed={activeTab === tab}
                                >
                                    {TAB_LABELS[tab]}
                                    {count > 0 && (
                                        <span className={cn(
                                            "ml-1.5 text-[10px] font-black",
                                            activeTab === tab ? "opacity-80" : "opacity-60"
                                        )}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="rounded-xl text-muted-foreground shrink-0" aria-label="Sort options">
                                {sortMode === 'recent' ? <Clock className="w-4 h-4" /> : <ArrowDownAZ className="w-4 h-4" />}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setSortMode('recent')} className="font-bold text-xs">
                                <Clock className="mr-2 h-4 w-4" /> Most recent first
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortMode('az')} className="font-bold text-xs">
                                <ArrowDownAZ className="mr-2 h-4 w-4" /> A → Z by title
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="rounded-xl text-muted-foreground shrink-0" aria-label="Session actions">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem
                                onClick={handleExportAll}
                                disabled={conversations.length === 0}
                                className="font-bold text-xs"
                            >
                                <Download className="mr-2 h-4 w-4" /> Export all (JSON)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => importFileRef.current?.click()}
                                disabled={!onImportSessions || isImporting}
                                className="font-bold text-xs"
                            >
                                <Upload className="mr-2 h-4 w-4" /> {isImporting ? "Importing…" : "Import sessions…"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <input
                        ref={importFileRef}
                        type="file"
                        accept="application/json,.json"
                        className="hidden"
                        onChange={handleImportFile}
                    />
                </div>

                {/* Language chips */}
                {availableLanguages.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
                        <Languages className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                        <button
                            onClick={() => setLanguageFilter(null)}
                            className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors border shrink-0",
                                languageFilter === null
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/50"
                            )}
                        >
                            All languages
                        </button>
                        {availableLanguages.map(({ lang, count }) => (
                            <button
                                key={lang}
                                onClick={() => setLanguageFilter(lang === languageFilter ? null : lang)}
                                className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors border shrink-0",
                                    languageFilter === lang
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/50"
                                )}
                            >
                                {lang} · {count}
                            </button>
                        ))}
                    </div>
                )}

                {/* Conversation List */}
                <div className="space-y-4">
                    {pinnedFirst.length > 0 && activeTab !== 'pinned' && (
                        <div className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-2 px-1">
                                <Pin className="w-4 h-4 text-primary fill-primary" />
                                <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Pinned</h2>
                            </div>
                            {pinnedFirst.map((c, idx) => (
                                <ConversationCard
                                    key={c.id}
                                    conversation={c}
                                    onClick={() => onChatSelect(c.id)}
                                    onTogglePin={(e) => handleTogglePin(e, c.id)}
                                    onDelete={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                                    onArchive={(e) => handleToggleArchive(e, c.id)}
                                    onRename={onRename}
                                    onSuggestTitle={(e) => handleSuggestTitle(e, c.id)}
                                    onPromoteToChanga={(e) => handlePromoteToChanga(e, c.id)}
                                    onExport={handleExport}
                                    index={idx}
                                    selectionMode={selectionMode}
                                    isSelected={selectedIds.has(c.id)}
                                    onToggleSelect={() => toggleSelected(c.id)}
                                />
                            ))}
                        </div>
                    )}

                    {others.length > 0 && (
                        <div className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-700">
                            {pinnedFirst.length > 0 && activeTab !== 'pinned' && (
                                <div className="flex items-center gap-2 px-1 mt-6">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                        {activeTab === 'recent' ? 'Last 7 days' : activeTab === 'archived' ? 'Archived' : 'All conversations'}
                                    </h2>
                                </div>
                            )}
                            {others.map((c, idx) => (
                                <ConversationCard
                                    key={c.id}
                                    conversation={c}
                                    onClick={() => onChatSelect(c.id)}
                                    onTogglePin={(e) => handleTogglePin(e, c.id)}
                                    onDelete={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                                    onArchive={(e) => handleToggleArchive(e, c.id)}
                                    onRename={onRename}
                                    onSuggestTitle={(e) => handleSuggestTitle(e, c.id)}
                                    onPromoteToChanga={(e) => handlePromoteToChanga(e, c.id)}
                                    onExport={handleExport}
                                    index={idx}
                                    selectionMode={selectionMode}
                                    isSelected={selectedIds.has(c.id)}
                                    onToggleSelect={() => toggleSelected(c.id)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {displayedConversations.length === 0 && (
                        <EmptyState
                            hasAnyConversation={hasAnyConversation}
                            searchQuery={searchQuery}
                            onShareStory={handleShareStory}
                            onContinueLast={continueLast}
                        />
                    )}
                </div>
            </main>

            {/* Bulk-action bar */}
            {selectionMode === 'selecting' && (
                <div className="fixed bottom-4 inset-x-4 max-w-2xl mx-auto z-30 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-3 shadow-2xl flex items-center gap-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                    <span className="text-xs font-bold text-foreground px-2">{selectedIds.size} selected</span>
                    <div className="flex-1" />
                    <Button size="sm" variant="ghost" className="rounded-xl text-xs font-bold" onClick={() => onPinMany?.(Array.from(selectedIds), true)} disabled={selectedIds.size === 0}>
                        <Pin className="w-3.5 h-3.5 mr-1" /> Pin
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-xl text-xs font-bold" onClick={() => onArchiveMany?.(Array.from(selectedIds), true)} disabled={selectedIds.size === 0}>
                        <Archive className="w-3.5 h-3.5 mr-1" /> Archive
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-xl text-xs font-bold text-destructive hover:text-destructive"
                        onClick={() => handleDeleteMany(Array.from(selectedIds))}
                        disabled={selectedIds.size === 0}
                    >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                </div>
            )}

            {/* Delete confirmation */}
            <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {pendingDelete?.ids
                                ? `Delete ${pendingDelete.ids.length} session${pendingDelete.ids.length === 1 ? "" : "s"}?`
                                : "Delete this session?"}
                        </DialogTitle>
                        <DialogDescription>
                            {isSignedIn
                                ? "This removes the conversation from your account and any connected devices. This cannot be undone."
                                : "This removes the session from this device. This cannot be undone."}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setPendingDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

interface CardProps {
    conversation: Conversation;
    onClick: () => void;
    onTogglePin: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
    onArchive: (e: React.MouseEvent) => void;
    onRename?: (id: string, newTitle: string) => void;
    onSuggestTitle?: (e: React.MouseEvent) => void;
    onPromoteToChanga?: (e: React.MouseEvent) => void;
    onExport: (e: React.MouseEvent, id: string, format: 'json' | 'md') => void;
    index: number;
    selectionMode: SelectionMode;
    isSelected: boolean;
    onToggleSelect: () => void;
}

const ConversationCard: React.FC<CardProps> = ({
    conversation,
    onClick,
    onTogglePin,
    onDelete,
    onArchive,
    onRename,
    onSuggestTitle,
    onPromoteToChanga,
    onExport,
    index,
    selectionMode,
    isSelected,
    onToggleSelect,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(conversation.title);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // Reset the draft title whenever the underlying conversation title changes
    // (e.g. after a Convex sync) — uses the render-phase adjustment pattern so
    // it doesn't trigger an extra commit.
    const [lastTitle, setLastTitle] = useState(conversation.title);
    if (conversation.title !== lastTitle) {
        setLastTitle(conversation.title);
        if (!isEditing) setEditTitle(conversation.title);
    }

    const handleSaveRename = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        const trimmed = editTitle.trim();
        if (trimmed && trimmed !== conversation.title && onRename) {
            onRename(conversation.id, trimmed);
        }
        setIsEditing(false);
    };

    const handleCancelRename = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        setEditTitle(conversation.title);
        setIsEditing(false);
    };

    const handleCardClick = (e: React.MouseEvent) => {
        if (isEditing) return;
        if (selectionMode === 'selecting') {
            e.preventDefault();
            onToggleSelect();
            return;
        }
        onClick();
    };

    const lastMessage = conversation.messages && conversation.messages.length > 0
        ? conversation.messages[conversation.messages.length - 1].text
        : "No messages yet";

    const lastActiveLabel = formatRelativeTime(conversation.lastActive);
    const lastActiveTitle = formatAbsoluteTime(conversation.lastActive);
    const messageCount = conversation.messageCount ?? conversation.messages?.length ?? 0;
    const hasAiMessages = !!conversation.messages?.some((m) => m.sender === "ai" && m.text?.trim());
    const animationDelay = `${Math.min(index, 6) * 50}ms`;

    return (
        <div
            onClick={handleCardClick}
            role="button"
            tabIndex={0}
            aria-label={`Open session ${conversation.title}`}
            aria-pressed={selectionMode === 'selecting' ? isSelected : undefined}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (selectionMode === 'selecting') onToggleSelect();
                    else if (!isEditing) onClick();
                }
            }}
            className={cn(
                "group relative bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-4 transition-all duration-300 text-left",
                "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4",
                !isEditing && selectionMode !== 'selecting' && "hover:bg-card/70 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 active:scale-[0.99] cursor-pointer",
                isSelected && "ring-2 ring-primary border-primary/60 bg-primary/5"
            )}
            style={{ animationDelay }}
        >
            <div className="flex items-center gap-4">
                {selectionMode === 'selecting' ? (
                    <div
                        className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2 transition-colors",
                            isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border/60 text-transparent"
                        )}
                        aria-hidden="true"
                    >
                        <Check className="w-6 h-6" />
                    </div>
                ) : (
                    <SessionCategoryBadge category={conversation.category} size="md" />
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        {isEditing ? (
                            <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                                <label htmlFor={`rename-${conversation.id}`} className="sr-only">Rename session</label>
                                <Input
                                    id={`rename-${conversation.id}`}
                                    ref={inputRef}
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveRename(e);
                                        if (e.key === 'Escape') handleCancelRename(e);
                                        e.stopPropagation();
                                    }}
                                    className="h-7 text-base font-bold px-2 py-0 bg-background border-primary/50 focus-visible:ring-1 focus-visible:ring-primary"
                                />
                            </div>
                        ) : (
                            <>
                                <h3 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                    {conversation.title}
                                </h3>
                                {conversation.language && (
                                    <span className="text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-md shrink-0">
                                        {conversation.language}
                                    </span>
                                )}
                                {conversation.isArchived && (
                                    <span className="text-[9px] font-black uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-md shrink-0">
                                        Archived
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                        <span className="flex items-center gap-1" title={`${messageCount} messages`}>
                            <MessageSquare className="w-3 h-3" />
                            {messageCount}
                        </span>
                        <span className="w-1 h-1 bg-border rounded-full" />
                        <span className="flex items-center gap-1" title={lastActiveTitle}>
                            <Clock className="w-3 h-3" />
                            {lastActiveLabel}
                        </span>
                        {conversation.syncedToConvex === false && (
                            <span className="flex items-center gap-1 text-warning" title="Saved locally only — sign in to sync across devices">
                                <CloudOff className="w-3 h-3" />
                                Local
                            </span>
                        )}
                        {conversation.syncedToConvex && (
                            <span className="flex items-center gap-1 text-rasta-green" title="Synced to your account">
                                <Cloud className="w-3 h-3" />
                                Synced
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate opacity-70">
                        {lastMessage}
                    </p>
                </div>

                <div className="flex items-center gap-1 ml-2 relative z-30" onClick={(e) => e.stopPropagation()}>
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSaveRename}
                                className="w-8 h-8 rounded-lg inline-flex items-center justify-center bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                                aria-label="Save new title"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleCancelRename}
                                className="w-8 h-8 rounded-lg inline-flex items-center justify-center hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                                aria-label="Cancel rename"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="w-8 h-8 rounded-full inline-flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    aria-label={`Actions for ${conversation.title}`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    if (onSuggestTitle) {
                                        setIsSuggesting(true);
                                        Promise.resolve(onSuggestTitle(e))
                                            .finally(() => setIsSuggesting(false));
                                    }
                                }} disabled={!onSuggestTitle || isSuggesting || !hasAiMessages}>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    <span>{isSuggesting ? "Generating…" : "Suggest a title"}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    onPromoteToChanga?.(e);
                                }} disabled={!onPromoteToChanga || !hasAiMessages}>
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    <span>Turn into Changa</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditing(true);
                                }}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    <span>Rename</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    onTogglePin(e);
                                }}>
                                    {conversation.isPinned
                                        ? <><PinOff className="mr-2 h-4 w-4" /><span>Unpin</span></>
                                        : <><Pin className="mr-2 h-4 w-4" /><span>Pin</span></>}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    onArchive(e);
                                }}>
                                    {conversation.isArchived
                                        ? <><ArchiveRestore className="mr-2 h-4 w-4" /><span>Restore</span></>
                                        : <><Archive className="mr-2 h-4 w-4" /><span>Archive</span></>}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => onExport(e, conversation.id, 'md')}>
                                    <Download className="mr-2 h-4 w-4" />
                                    <span>Export as Markdown</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => onExport(e, conversation.id, 'json')}>
                                    <Download className="mr-2 h-4 w-4" />
                                    <span>Export as JSON</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={(e) => onDelete(e)}
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </div>
    );
};

interface EmptyStateProps {
    hasAnyConversation: boolean;
    searchQuery: string;
    onShareStory: () => void;
    onContinueLast: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ hasAnyConversation, searchQuery, onShareStory, onContinueLast }) => {
    if (searchQuery) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center motion-safe:animate-in motion-safe:zoom-in duration-500">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <Filter className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-black text-foreground mb-2">No sessions match your search</h3>
                <p className="text-muted-foreground text-sm max-w-[280px]">
                    Try a different word, language, or proverb. Search looks inside conversation messages too.
                </p>
            </div>
        );
    }

    if (hasAnyConversation) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center motion-safe:animate-in motion-safe:zoom-in duration-500">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <MessageSquare className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-black text-foreground mb-2">Pick up where you left off</h3>
                <p className="text-muted-foreground text-sm max-w-[280px] mb-6">
                    You have older sessions. Continue your last chat, or start a new one.
                </p>
                <Button onClick={onContinueLast} className="rounded-xl font-bold">
                    Continue last session
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center motion-safe:animate-in motion-safe:zoom-in duration-500">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-black text-foreground mb-2">Start preserving heritage</h3>
            <p className="text-muted-foreground text-sm max-w-[280px] mb-6">
                Every word you save with Kaanze is a gift to future generations. Your cultural contributions will appear here.
            </p>
            <Button onClick={onShareStory} className="rounded-xl font-bold">
                Start a conversation
            </Button>
        </div>
    );
};

export default SavedConversationsScreen;
