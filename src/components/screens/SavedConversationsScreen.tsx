"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Screen, Conversation } from '@/types';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useToast } from '@/hooks/useToast';
import { formatRelativeTime, formatAbsoluteTime } from '@/lib/formatTime';
import { exportConversationAsJSON, exportConversationAsMarkdown, isBodyMissing } from '@/lib/exportConversation';
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
    /**
     * Accepts either a new list or an updater function. The updater form is
     * required for safe optimistic toggles: deriving the next list from the
     * `conversations` prop snapshot can drop an earlier change when two toggles
     * land in the same tick.
     */
    setConversations: (conversations: Conversation[] | ((prev: Conversation[]) => Conversation[])) => void;
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
    /**
     * Fetch the next page of server-backed sessions. Fired when the virtualized
     * list scrolls near its end (docs/perf.md §3).
     */
    onLoadMore?: () => void;
    /** True while the server still has more pages beyond what is loaded. */
    canLoadMore?: boolean;
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
    onLoadMore,
    canLoadMore = false,
}) => {
    const { isSignedIn: clerkIsSignedIn } = useUser();
    // Clerk types `isSignedIn` as optional, so it can be undefined while auth is
    // resolving. Coerce once here rather than at every card call site.
    const isSignedIn = !!clerkIsSignedIn;
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedQuery = useDebouncedValue(searchQuery, 150);
    // Persisted tab. Starts at the SSR-safe default and hydrates from
    // localStorage in an effect: reading storage inside the useState initializer
    // produced a server/client mismatch (server rendered "all", client rendered
    // the stored tab), which React reports as a hydration error. Reads are also
    // wrapped because localStorage throws outright in some privacy modes.
    const [activeTab, setActiveTab] = useState<Tab>('all');
    useEffect(() => {
        try {
            const stored = window.localStorage.getItem(ACTIVE_TAB_KEY);
            if (stored && TAB_FROM_STORAGE[stored]) setActiveTab(TAB_FROM_STORAGE[stored]);
        } catch { /* storage unavailable — keep the default tab */ }
    }, []);
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

    // "Recent" is relative to a wall-clock sample. It starts at a constant so the
    // first client render matches the server (Date.now() differs between the two
    // and would flip the Recent tab's contents mid-hydration), then syncs to the
    // real clock once mounted. A slow interval keeps "2h ago" labels honest in a
    // long-open tab — visibilitychange alone is not enough.
    const [now, setNow] = useState(0);
    useEffect(() => {
        setNow(Date.now());
        const tick = () => setNow(Date.now());
        const onVisible = () => {
            if (document.visibilityState === 'visible') setNow(Date.now());
        };
        const timer = window.setInterval(tick, 60_000);
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, []);

    // Before the clock syncs, fall back to "now" so the Recent tab still shows
    // a sensible window instead of an empty list.
    const effectiveNow = now || Date.now();

    const recentCutoff = effectiveNow - RECENT_WINDOW_MS;
    const tabCounts = useMemo(() => ({
        all: conversations.filter((c) => !c.isArchived).length,
        pinned: conversations.filter((c) => c.isPinned && !c.isArchived).length,
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

    // Deletion is routed entirely through the parent callbacks, which own the
    // single local+server write path (page.tsx -> syncDeleteMany). Previously
    // this also called deleteConversations + a full setConversations rewrite,
//    so localStorage was written three times for one delete.
    const confirmDelete = useCallback(() => {
        if (!pendingDelete) return;
        if (pendingDelete.ids && pendingDelete.ids.length > 0) {
            const ids = pendingDelete.ids;
            onDeleteMany?.(ids);
            setSelectedIds(new Set());
            setSelectionMode('idle');
            toast(`Deleted ${ids.length} session${ids.length === 1 ? "" : "s"}`, "success");
        } else if (pendingDelete.id) {
            onDeleteOne?.(pendingDelete.id);
            toast("Session deleted", "success");
        }
        setPendingDelete(null);
    }, [pendingDelete, onDeleteMany, onDeleteOne, toast]);

    // Leaving selection mode is centralised so every bulk action — not just
    // delete — clears the sticky bar. Pinning used to leave the bar open with
    // the same ids selected, which looked like the button had done nothing.
    const exitSelectionMode = useCallback(() => {
        setSelectedIds(new Set());
        setSelectionMode('idle');
    }, []);

    const handleTogglePin = useCallback((e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const target = conversations.find((c) => c.id === id);
        if (!target) return;
        const next = !target.isPinned;
        // Functional update: two taps in quick succession must not drop the
        // first change (a `conversations.map` snapshot can go stale).
        setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, isPinned: next } : c)));
        onPin?.(id, next);
    }, [conversations, setConversations, onPin]);

    const handleToggleArchive = useCallback((e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const target = conversations.find((c) => c.id === id);
        if (!target) return;
        const next = !target.isArchived;
        setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, isArchived: next } : c)));
        onArchive?.(id, next);
        toast(next ? "Archived" : "Restored", "info");
    }, [conversations, setConversations, onArchive, toast]);

    const handleSuggestTitle = useCallback(async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!onSuggestTitle) return;
        toast("Generating a title…", "info");
        const title = await onSuggestTitle(id);
        if (title) {
            // onSuggestTitle already persists the new title (page.tsx). Calling
            // onRename here as well queued the same metadata op a second time.
            toast(`Renamed to "${title.slice(0, 40)}${title.length > 40 ? "…" : ""}"`, "success");
        } else {
            toast("Couldn't generate a title right now", "error");
        }
    }, [onSuggestTitle, toast]);

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
        // A session synced from another device hydrates with metadata only until
        // it is opened once. Exporting then yields a file with no message body,
        // so warn instead of handing back an empty-looking export.
        if (isBodyMissing(conv)) {
            toast("Open this session once to load its messages, then export", "info");
            return;
        }
        if (format === 'json') exportConversationAsJSON(conv);
        else exportConversationAsMarkdown(conv);
        toast(`Exported as ${format.toUpperCase()}`, "success");
    }, [conversations, toast]);

    const handleExportAll = useCallback(() => {
        const all = conversations;
        if (all.length === 0) {
            toast("Nothing to export yet", "info");
            return;
        }
        // Only sessions with a locally-cached body export faithfully; say so
        // rather than implying a complete archive.
        const incomplete = all.filter(isBodyMissing).length;
        onExportAll?.();
        toast(
            incomplete > 0
                ? `${all.length} sessions exported · ${incomplete} not yet downloaded (open them to include their messages)`
                : `${all.length} session${all.length === 1 ? "" : "s"} exported`,
            "success"
        );
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

    // True when the current view is narrower than the full list, so the header
    // can report "Showing X of Y" instead of the static counts.
    const isFiltering =
        !!searchQuery.trim() || !!languageFilter || activeTab !== 'all';

    const visibleIds = useMemo(
        () => displayedConversations.map((c) => c.id),
        [displayedConversations]
    );
    const allVisibleSelected =
        visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

    const toggleSelectAllVisible = useCallback(() => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
            else visibleIds.forEach((id) => next.add(id));
            return next;
        });
    }, [allVisibleSelected, visibleIds]);

    // Bulk Pin/Archive are toggle-aware: on the Pinned tab they unpin, on the
    // Archived tab they restore. They used to hardcode `true`, which made "Pin"
    // a no-op inside Pinned and left no way to bulk-unpin/unarchive at all.
    const selectedList = useMemo(
        () => conversations.filter((c) => selectedIds.has(c.id)),
        [conversations, selectedIds]
    );
    const allSelectedPinned = selectedList.length > 0 && selectedList.every((c) => c.isPinned);
    const allSelectedArchived = selectedList.length > 0 && selectedList.every((c) => c.isArchived);

    const handleBulkPin = useCallback(() => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        onPinMany?.(ids, !allSelectedPinned);
        toast(allSelectedPinned ? "Unpinned" : "Pinned", "success");
        exitSelectionMode();
    }, [selectedIds, onPinMany, allSelectedPinned, exitSelectionMode, toast]);

    const handleBulkArchive = useCallback(() => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        onArchiveMany?.(ids, !allSelectedArchived);
        toast(allSelectedArchived ? "Restored" : "Archived", "success");
        exitSelectionMode();
    }, [selectedIds, onArchiveMany, allSelectedArchived, exitSelectionMode, toast]);

    const handleShareStory = useCallback(() => navigate(Screen.ADD_CONTRIBUTION), [navigate]);

    const continueLast = onContinueLast ?? (() => {
        // Fallback path (no onContinueLast wired): skip archived so the CTA
        // never resumes a hidden session.
        const last = [...conversations]
            .filter((c) => !c.isArchived)
            .sort((a, b) => b.lastActive - a.lastActive)[0];
        if (last) onChatSelect(last.id);
    });

    const pinnedFirst = displayedConversations.filter((c) => c.isPinned);
    const others = displayedConversations.filter((c) => !c.isPinned);

    /**
     * Flatten the two visually-grouped sections (Pinned / rest) into one ordered
     * row model so a single virtualizer can render both. Section labels become
     * real rows rather than sitting outside the scroll window, which is what
     * kept the pinned group and the list from sharing one scroll position.
     */
    type ListRow =
        | { kind: 'header'; id: string; title: string }
        | { kind: 'card'; id: string; conversation: Conversation; index: number };

    const rows = useMemo<ListRow[]>(() => {
        const out: ListRow[] = [];
        const showPinnedGroup = pinnedFirst.length > 0 && activeTab !== 'pinned';

        if (showPinnedGroup) {
            out.push({ kind: 'header', id: 'hdr-pinned', title: 'Pinned' });
            pinnedFirst.forEach((c, i) =>
                out.push({ kind: 'card', id: c.id, conversation: c, index: i })
            );
        }
        if (others.length > 0) {
            if (showPinnedGroup) {
                out.push({
                    kind: 'header',
                    id: 'hdr-others',
                    title:
                        activeTab === 'recent'
                            ? 'Last 7 days'
                            : activeTab === 'archived'
                                ? 'Archived'
                                : 'All conversations',
                });
            }
            others.forEach((c, i) =>
                out.push({ kind: 'card', id: c.id, conversation: c, index: i })
            );
        }
        return out;
    }, [pinnedFirst, others, activeTab]);

    const scrollRef = useRef<HTMLDivElement>(null);
    // Height is measured (not estimated) because cards vary: a one-line title
    // and a truncated preview differ enough that a fixed estimate visibly
    // jumps the scrollbar as rows mount.
    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 148,
        overscan: 6,
        getItemKey: (i) => rows[i]?.id ?? i,
    });
    const virtualRows = rowVirtualizer.getVirtualItems();

    // Infinite scroll: pull the next server page as the tail comes into view.
    // Guarded by canLoadMore + a ref so the same tail can't fire twice while a
    // page is in flight.
    const loadingMoreRef = useRef(false);
    useEffect(() => {
        const last = virtualRows[virtualRows.length - 1];
        if (!last) return;
        if (last.index < rows.length - 3) return;
        if (!canLoadMore || !onLoadMore || loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        onLoadMore();
        // Release once the row count has actually grown.
        const t = window.setTimeout(() => { loadingMoreRef.current = false; }, 400);
        return () => window.clearTimeout(t);
    }, [virtualRows, rows.length, canLoadMore, onLoadMore]);

    return (
        <div className="flex flex-col h-[100dvh] bg-background relative overflow-hidden font-body motion-safe:animate-in motion-safe:fade-in">
            {/* The scroll container is the virtualizer's scroll element, so it must
                be a bounded flex child (h-[100dvh] + min-h-0). A `min-h-screen`
                document-scroller leaves the virtualizer no element to measure
                against and the measured rows collapse. */}
            {/* Abstract Background Shapes */}
            <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[30%] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[30%] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

            {/* Header. The inner row is capped to the same max-w-2xl column as the list
                below; previously the title row spanned the full viewport width
                while the content was centered, so on wide screens the controls
                drifted away from the content they act on. */}
            <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg px-4 py-4">
                <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
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
                            {/* Result feedback: "showing X of Y" makes an empty
                                result set (or a filtered view) unambiguous instead
                                of leaving the list looking broken. */}
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">
                                {isFiltering
                                    ? `Showing ${displayedConversations.length} of ${conversations.length}`
                                    : `${tabCounts.all} active · ${tabCounts.pinned} pinned · ${tabCounts.archived} archived`}
                            </p>
                        </div>
                    </div>
                    {selectionMode === 'selecting' ? (
                        <div className="flex items-center gap-1 shrink-0">
                            <span className="text-xs font-bold text-foreground px-2">{selectedIds.size} selected</span>
                            <Button size="icon" variant="ghost" onClick={exitSelectionMode} aria-label="Cancel selection">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : displayedConversations.length > 0 ? (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectionMode('selecting')}
                            className="rounded-full text-[10px] font-black uppercase tracking-widest h-8 px-3 shrink-0"
                        >
                            Select
                        </Button>
                    ) : null}
                </div>
            </header>

            {/* Main Content */}
            <main
                ref={scrollRef}
                className="flex-1 min-h-0 relative z-10 p-4 max-w-2xl mx-auto w-full space-y-6 overflow-y-auto no-scrollbar pb-32"
            >

                {/* Search Bar */}
                <div className="relative group motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-4 duration-500">
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                    <Input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search titles, messages, languages…"
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
                            {/* The label names the active sort so the control is
                                self-describing, and the menu marks the current
                                choice (previously the trigger icon was the only
                                cue and the menu gave no confirmation). */}
                            <Button
                                size="icon"
                                variant="ghost"
                                className="rounded-xl text-muted-foreground shrink-0"
                                aria-label={`Sort: ${sortMode === 'recent' ? 'most recent first' : 'A to Z by title'}`}
                                title={sortMode === 'recent' ? 'Most recent first' : 'A → Z by title'}
                            >
                                {sortMode === 'recent' ? <Clock className="w-4 h-4" /> : <ArrowDownAZ className="w-4 h-4" />}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => setSortMode('recent')} className="font-bold text-xs">
                                <Clock className="mr-2 h-4 w-4" /> Most recent first
                                {sortMode === 'recent' && <Check className="ml-auto h-4 w-4 text-primary" aria-hidden />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortMode('az')} className="font-bold text-xs">
                                <ArrowDownAZ className="mr-2 h-4 w-4" /> A → Z by title
                                {sortMode === 'az' && <Check className="ml-auto h-4 w-4 text-primary" aria-hidden />}
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

                {/* Conversation List — virtualized (docs/perf.md §3: lists >50 rows
                    must virtualize). Only the visible window of rows is mounted,
                    so card animations, Fuse results and the dropdown menus stay
                    bounded regardless of how many sessions exist. */}
                {rows.length > 0 ? (
                    <div
                        style={{ height: rowVirtualizer.getTotalSize(), width: '100%' }}
                        className="relative"
                    >
                        {virtualRows.map((vr) => {
                            const row = rows[vr.index];
                            if (!row) return null;
                            return (
                                <div
                                    key={vr.key}
                                    data-index={vr.index}
                                    ref={rowVirtualizer.measureElement}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        transform: `translateY(${vr.start}px)`,
                                    }}
                                >
                                    {row.kind === 'header' ? (
                                        <div
                                            className="flex items-center gap-2 px-1 pt-2 pb-1"
                                            aria-hidden={false}
                                        >
                                            {row.id === 'hdr-pinned' ? (
                                                <Pin className="w-4 h-4 text-primary fill-primary" />
                                            ) : (
                                                <Clock className="w-4 h-4 text-muted-foreground" />
                                            )}
                                            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                                {row.title}
                                            </h2>
                                        </div>
                                    ) : (
                                        <div className="pb-4">
                                            <ConversationCard
                                                conversation={row.conversation}
                                                onClick={() => onChatSelect(row.id)}
                                                onTogglePin={(e) => handleTogglePin(e, row.id)}
                                                onDelete={(e) => { e.stopPropagation(); handleDelete(row.id); }}
                                                onArchive={(e) => handleToggleArchive(e, row.id)}
                                                onRename={onRename}
                                                onSuggestTitle={(e) => handleSuggestTitle(e, row.id)}
                                                onPromoteToChanga={(e) => handlePromoteToChanga(e, row.id)}
                                                onExport={handleExport}
                                                index={row.index}
                                                selectionMode={selectionMode}
                                                isSelected={selectedIds.has(row.id)}
                                                isSignedIn={isSignedIn}
                                                onToggleSelect={() => toggleSelected(row.id)}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Empty State — rendered outside the virtualizer since there
                       are no rows to virtualize. */
                    <EmptyState
                        hasAnyConversation={hasAnyConversation}
                        searchQuery={searchQuery}
                        activeTab={activeTab}
                        languageFilter={languageFilter}
                        onShareStory={handleShareStory}
                        onContinueLast={continueLast}
                    />
                )}

                {/* Server pagination affordance for keyboard / AT users who don't
                    scroll near the tail. */}
                {canLoadMore && rows.length > 0 && (
                    <div className="flex justify-center py-4">
                        <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl text-xs font-bold"
                            onClick={() => onLoadMore?.()}
                        >
                            Load more sessions
                        </Button>
                    </div>
                )}
            </main>

            {/* Bulk-action bar */}
            {selectionMode === 'selecting' && (
                <div className="fixed bottom-4 inset-x-4 max-w-2xl mx-auto z-30 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-3 shadow-2xl flex items-center gap-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                    <span className="text-xs font-bold text-foreground px-2">{selectedIds.size} selected</span>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-xl text-xs font-bold"
                        onClick={toggleSelectAllVisible}
                        disabled={visibleIds.length === 0}
                    >
                        {allVisibleSelected ? "Clear" : "Select all"}
                    </Button>
                    <div className="flex-1" />
                    <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-xl text-xs font-bold"
                        onClick={handleBulkPin}
                        disabled={selectedIds.size === 0}
                    >
                        {allSelectedPinned ? <PinOff className="w-3.5 h-3.5 mr-1" /> : <Pin className="w-3.5 h-3.5 mr-1" />}
                        {allSelectedPinned ? "Unpin" : "Pin"}
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-xl text-xs font-bold"
                        onClick={handleBulkArchive}
                        disabled={selectedIds.size === 0}
                    >
                        {allSelectedArchived ? <ArchiveRestore className="w-3.5 h-3.5 mr-1" /> : <Archive className="w-3.5 h-3.5 mr-1" />}
                        {allSelectedArchived ? "Restore" : "Archive"}
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
    /** Drives the sync badge copy ("Pending" vs "Local"). */
    isSignedIn: boolean;
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
    isSignedIn,
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
            /* In selection mode the card is a checkbox, not a button: the action
               toggles membership rather than navigating, and screen readers
               announce "checked" far better than a pressed button. */
            role={selectionMode === 'selecting' ? 'checkbox' : 'button'}
            tabIndex={0}
            aria-checked={selectionMode === 'selecting' ? isSelected : undefined}
            aria-label={
                selectionMode === 'selecting'
                    ? `Select session ${conversation.title}`
                    : `Open session ${conversation.title}`
            }
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
                        {/* Sync status. Three distinct states, because "Local — sign in to sync"
                            was shown to already-signed-in users whose upload was
                            merely still queued (e.g. right after an import or
                            while offline). */}
                        {conversation.syncedToConvex === false ? (
                            <span
                                className="flex items-center gap-1 text-warning"
                                title={
                                    isSignedIn
                                        ? "Saved on this device — pending upload to your account"
                                        : "Saved locally only — sign in to sync across devices"
                                }
                            >
                                <CloudOff className="w-3 h-3" />
                                {isSignedIn ? "Pending" : "Local"}
                            </span>
                        ) : conversation.syncedToConvex ? (
                            <span className="flex items-center gap-1 text-rasta-green" title="Synced to your account">
                                <Cloud className="w-3 h-3" />
                                Synced
                            </span>
                        ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground truncate opacity-70">
                        {lastMessage}
                    </p>
                </div>

                {/* stopPropagation on BOTH click and keydown: this container sits inside a
                    role="button"/"checkbox" card. Without the keydown guard,
                    pressing Enter or Space on the nested menu trigger (or the
                    rename input) bubbled up to the card and ALSO opened the
                    session / toggled its selection. */}
                <div
                    className="flex items-center gap-1 ml-2 relative z-30"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                >
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
    activeTab: Tab;
    languageFilter: string | null;
    onShareStory: () => void;
    onContinueLast: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    hasAnyConversation,
    searchQuery,
    activeTab,
    languageFilter,
    onShareStory,
    onContinueLast,
}) => {
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

    // A tab or language filter that excludes everything gets a specific,
    // actionable state. Previously these fell through to "Pick up where you
    // left off", which wrongly implied other sessions existed off-screen and
    // offered to resume a session the current view had just excluded.
    if (activeTab !== 'all' || languageFilter) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center motion-safe:animate-in motion-safe:zoom-in duration-500">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <Filter className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-black text-foreground mb-2">
                    {languageFilter
                        ? `No ${languageFilter} sessions here`
                        : `No ${TAB_LABELS[activeTab].toLowerCase()} sessions`}
                </h3>
                <p className="text-muted-foreground text-sm max-w-[280px]">
                    {languageFilter
                        ? `Nothing in this view matches the ${languageFilter} filter yet.`
                        : activeTab === 'archived'
                            ? "Sessions you archive are kept here and out of your way."
                            : activeTab === 'pinned'
                                ? "Pin a session to keep it at the top of your list."
                                : "Sessions you've used in the past week show up here."}
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
