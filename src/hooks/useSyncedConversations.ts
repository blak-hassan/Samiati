"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { localConversationService } from "@/services/localConversationService";
import { conversationSyncQueue, EnqueueInput, PendingSyncOp } from "@/services/conversationSyncQueue";
import { Conversation, Message } from "@/types";
import {
    mergeActiveConversation,
    mergeConversationList,
    ServerConversationShape,
    ServerMessageShape,
} from "@/lib/conversationMerge";

export interface ServerConversationWithMessages extends ServerConversationShape {
    messages?: ServerMessageShape[];
}

type SetConversationsInput =
    | Conversation[]
    | ((prev: Conversation[]) => Conversation[]);

const isOnline = () => typeof navigator === "undefined" || navigator.onLine !== false;

/**
 * Shape `saveConversation` expects for one message. Kept explicit (rather than
 * `Record<string, unknown>`) so the mutation call type-checks: `Record<string,
 * unknown>` is not assignable to the inferred args object, which surfaced as a
 * hard TS2322 in this file's flush path.
 */
function messageToSaveArgs(m: Message): {
    id: string;
    sender: string;
    text: string;
    translatedText?: string;
    targetLanguage?: string;
    timestamp: number;
    feedback?: "up" | "down";
    comments?: string[];
    type?: string;
    status?: string;
    duration?: string;
} {
    return {
        id: m.id,
        sender: m.sender,
        text: m.text,
        translatedText: m.translatedText,
        targetLanguage: m.targetLanguage,
        // Imported/legacy rows can carry a numeric timestamp; local ones a Date.
        timestamp: m.timestamp instanceof Date ? m.timestamp.getTime() : Number(m.timestamp),
        feedback: m.feedback,
        comments: m.comments,
        type: m.type,
        status: m.status,
        duration: m.duration,
    };
}

export interface UseSyncedConversationsOptions {
    /** True when the app user is signed in and server writes are permitted. */
    isSignedIn: boolean;
    /** clientId of the currently-open chat; server messages for it are merged in. */
    activeChatId?: string | null;
    /**
     * First page size for the server list. The Sessions page renders the whole
     * list and virtualizes it, so it wants a bigger first page; the dashboard
     * only needs the active chat and keeps a small one.
     */
    initialNumItems?: number;
    /** False skips the server list entirely (guests have no server rows). */
    fetchServerList?: boolean;
}

/** Page size for the Sessions list — see docs/perf.md §3 (>50 rows ⇒ virtualize). */
const DEFAULT_INITIAL_PAGE = 30;

/**
 * Single source of truth for the conversation list.
 *
 * - Hydrates from localStorage immediately, then merges Convex rows as they
 *   arrive (so a fresh device sees the user's server-backed sessions).
 * - Writes go through a persisted offline queue; ops are flushed to Convex
 *   when signed in, retried on `online`/focus/sign-in.
 * - Always persists the merged list back to localStorage (write-through cache).
 */
export function useSyncedConversations(options: UseSyncedConversationsOptions) {
    const {
        isSignedIn,
        activeChatId = null,
        initialNumItems = DEFAULT_INITIAL_PAGE,
        fetchServerList = true,
    } = options;

    const [conversations, setConversationsState] = useState<Conversation[]>(
        () => localConversationService.getConversations()
    );
    const conversationsRef = useRef(conversations);
    const isFlushingRef = useRef(false);

    const saveMutation = useMutation(api.conversations.mutations.saveConversation);
    const metadataMutation = useMutation(api.conversations.mutations.updateConversationMetadata);
    const deleteMutation = useMutation(api.conversations.mutations.deleteConversationByClientId);

    // Paginated rather than a single bounded take(): the Sessions list can
    // exceed any fixed cap, and Convex's cursor keeps the read incremental
    // (docs/perf.md §2). `results` only grows as the user pages through it.
    const { results: serverPages, status, loadMore } = usePaginatedQuery(
        api.conversations.queries.listConversations,
        {},
        { initialNumItems: initialNumItems }
    );

    const serverActive = useQuery(
        api.conversations.queries.getConversationWithMessages,
        activeChatId ? { clientId: activeChatId } : "skip"
    );

    const updateState = useCallback((input: SetConversationsInput) => {
        setConversationsState((prev) => {
            const next = typeof input === "function" ? input(prev) : input;
            conversationsRef.current = next;
            localConversationService.saveAll(next);
            return next;
        });
    }, []);

    // Merge the server conversation list into the local cache, preserving
    // local-only fields and messages (write-through cache). Re-runs as more
    // pages stream in.
    useEffect(() => {
        if (!fetchServerList || isSignedIn === false) return;
        if (!serverPages || serverPages.length === 0) return;
        updateState((prev) => mergeConversationList(serverPages as ServerConversationShape[], prev));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serverPages, isSignedIn, fetchServerList]);

    // Merge the open conversation's server-side messages when they arrive.
    useEffect(() => {
        if (!serverActive || !activeChatId) return;
        updateState((prev) => mergeActiveConversation(prev, serverActive as ServerConversationWithMessages, activeChatId));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serverActive, activeChatId]);

    const markConversationSynced = useCallback((clientId: string) => {
        updateState((prev) => prev.map((c) => (c.id === clientId ? { ...c, syncedToConvex: true } : c)));
    }, [updateState]);

    const flushQueue = useCallback(async () => {
        if (isFlushingRef.current) return;
        const queued = conversationSyncQueue.getQueue();
        if (queued.length === 0) return;

        isFlushingRef.current = true;
        const remaining: PendingSyncOp[] = [];
        try {
            for (const op of queued) {
                try {
                    if (op.kind === "save") {
                        await saveMutation({
                            id: op.conversation.id,
                            title: op.conversation.title ?? "New Conversation",
                            date: op.conversation.date ?? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                            messageCount: op.conversation.messageCount ?? op.conversation.messages.length,
                            isPinned: op.conversation.isPinned ?? false,
                            isArchived: op.conversation.isArchived,
                            lastActive: op.conversation.lastActive ?? Date.now(),
                            category: op.conversation.category,
                            messages: (op.conversation.messages ?? []).map(messageToSaveArgs),
                        });
                        markConversationSynced(op.conversation.id);
                    } else if (op.kind === "metadata") {
                        await metadataMutation({ clientId: op.clientId, ...op.patch });
                        markConversationSynced(op.clientId);
                    } else {
                        await deleteMutation({ clientId: op.clientId });
                        updateState((prev) => prev.filter((c) => c.id !== op.clientId));
                    }
                } catch {
                    // Keep the op queued; it will be retried on the next flush.
                    remaining.push(op);
                }
            }
        } finally {
            conversationSyncQueue.setQueue(remaining);
            isFlushingRef.current = false;
        }
    }, [saveMutation, metadataMutation, deleteMutation, updateState, markConversationSynced]);
const attemptFlush = useCallback(() => {
        if (!isSignedIn) return;
        if (!isOnline()) return;
        void flushQueue();
    }, [isSignedIn, flushQueue]);

    // Flush on mount, sign-in, going online, or regaining focus.
    useEffect(() => {
        attemptFlush();
        const onWake = () => attemptFlush();
        window.addEventListener("online", onWake);
        window.addEventListener("focus", onWake);
        return () => {
            window.removeEventListener("online", onWake);
            window.removeEventListener("focus", onWake);
        };
    }, [attemptFlush]);

    const enqueue = useCallback((input: EnqueueInput) => {
        conversationSyncQueue.enqueue(input);
        attemptFlush();
    }, [attemptFlush]);

    const readConversation = useCallback((id: string) => {
        return conversationsRef.current.find((c) => c.id === id);
    }, []);

    const readConversations = useCallback(() => {
        return conversationsRef.current;
    }, []);

    const saveLocal = useCallback((conversation: Conversation) => {
        updateState((prev) => {
            const idx = prev.findIndex((c) => c.id === conversation.id);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = conversation;
                return next;
            }
            return [conversation, ...prev];
        });
    }, [updateState]);

    const syncSave = useCallback((conversation: Conversation) => {
        saveLocal(conversation);
        enqueue({ kind: "save", clientId: conversation.id, conversation });
    }, [saveLocal, enqueue]);

    const updateConversation = useCallback((id: string, patch: Partial<Conversation>) => {
        updateState((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    }, [updateState]);

    const syncMetadata = useCallback((clientId: string, patch: { title?: string; isPinned?: boolean; isArchived?: boolean }) => {
        enqueue({ kind: "metadata", clientId, patch });
    }, [enqueue]);

    /**
     * Apply a metadata patch to many conversations at once — updates the local
     * cache immediately (optimistic) AND queues one `metadata` op per id.
     *
     * Bulk pin/archive MUST go through this (or `updateMany` + `syncMetadata`)
     * rather than `syncMetadata` alone: queuing a server write without applying
     * it locally leaves the list visually unchanged until a server round-trip
     * merges the rows back, which reads as a dead button.
     */
    const syncMetadataMany = useCallback((clientIds: string[], patch: { title?: string; isPinned?: boolean; isArchived?: boolean }) => {
        if (clientIds.length === 0) return;
        const ids = new Set(clientIds);
        updateState((prev) => prev.map((c) => (ids.has(c.id) ? { ...c, ...patch } : c)));
        for (const id of clientIds) {
            enqueue({ kind: "metadata", clientId: id, patch });
        }
    }, [enqueue, updateState]);

    /** Apply a local-only patch to many conversations (no server write). */
    const updateMany = useCallback((clientIds: string[], patch: Partial<Conversation>) => {
        if (clientIds.length === 0) return;
        const ids = new Set(clientIds);
        updateState((prev) => prev.map((c) => (ids.has(c.id) ? { ...c, ...patch } : c)));
    }, [updateState]);

    const syncDelete = useCallback((clientId: string) => {
        localConversationService.deleteConversation(clientId);
        updateState((prev) => prev.filter((c) => c.id !== clientId));
        enqueue({ kind: "delete", clientId });
    }, [updateState, enqueue]);

    /**
     * Single deletion path for one-or-many ids. Bulk delete used to mix
     * `deleteConversations` + a full `setConversations` write with per-id
     * `syncDelete`, which wrote localStorage three times over; this keeps one
     * local removal and one queued `delete` per id.
     */
    const syncDeleteMany = useCallback((clientIds: string[]) => {
        if (clientIds.length === 0) return;
        localConversationService.deleteConversations(clientIds);
        const ids = new Set(clientIds);
        updateState((prev) => prev.filter((c) => !ids.has(c.id)));
        for (const id of clientIds) {
            enqueue({ kind: "delete", clientId: id });
        }
    }, [enqueue, updateState]);

    const uploadConversations = useCallback((conversationsToUpload: Conversation[]) => {
        for (const c of conversationsToUpload) {
            conversationSyncQueue.enqueue({ kind: "save", clientId: c.id, conversation: c });
        }
        attemptFlush();
    }, [attemptFlush]);

    return useMemo(() => ({
        conversations,
        setConversations: updateState,
        readConversation,
        readConversations,
        saveLocal,
        syncSave,
        updateConversation,
        updateMany,
        syncMetadata,
        syncMetadataMany,
        syncDelete,
        syncDeleteMany,
        uploadConversations,
        markConversationSynced,
        requestFlush: flushQueue,
        /**
         * Fetch the next page of server sessions. Exposed so the Sessions page
         * can drive infinite scroll off the virtualizer's last visible row.
         */
        loadMoreServerConversations: loadMore as (count?: number) => void,
        /** "CanLoadMore" while more server pages exist, else "Exhausted"/"Done". */
        serverListStatus: status,
    }), [
        conversations,
        updateState,
        readConversation,
        readConversations,
        saveLocal,
        syncSave,
        updateConversation,
        updateMany,
        syncMetadata,
        syncMetadataMany,
        syncDelete,
        syncDeleteMany,
        uploadConversations,
        markConversationSynced,
        flushQueue,
        loadMore,
        status,
    ]);
}

export type SyncedConversationsApi = ReturnType<typeof useSyncedConversations>;