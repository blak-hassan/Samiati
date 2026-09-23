"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
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

function messageToSaveArgs(m: Message): Record<string, unknown> {
    return {
        id: m.id,
        sender: m.sender,
        text: m.text,
        translatedText: m.translatedText,
        targetLanguage: m.targetLanguage,
        timestamp: m.timestamp instanceof Date ? m.timestamp.getTime() : m.timestamp,
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
}

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
    const { isSignedIn, activeChatId = null } = options;

    const [conversations, setConversationsState] = useState<Conversation[]>(
        () => localConversationService.getConversations()
    );
    const conversationsRef = useRef(conversations);
    const isFlushingRef = useRef(false);

    const saveMutation = useMutation(api.conversations.mutations.saveConversation);
    const metadataMutation = useMutation(api.conversations.mutations.updateConversationMetadata);
    const deleteMutation = useMutation(api.conversations.mutations.deleteConversationByClientId);

    const serverList = useQuery(api.conversations.queries.listConversations);
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
    // local-only fields and messages (write-through cache).
    useEffect(() => {
        if (!serverList || serverList.length === 0 || isSignedIn === false) return;
        updateState((prev) => mergeConversationList(serverList, prev));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serverList, isSignedIn]);

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

    const syncDelete = useCallback((clientId: string) => {
        localConversationService.deleteConversation(clientId);
        updateState((prev) => prev.filter((c) => c.id !== clientId));
        enqueue({ kind: "delete", clientId });
    }, [updateState, enqueue]);

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
        syncMetadata,
        syncDelete,
        uploadConversations,
        markConversationSynced,
        requestFlush: flushQueue,
    }), [
        conversations,
        updateState,
        readConversation,
        readConversations,
        saveLocal,
        syncSave,
        updateConversation,
        syncMetadata,
        syncDelete,
        uploadConversations,
        markConversationSynced,
        flushQueue,
    ]);
}

export type SyncedConversationsApi = ReturnType<typeof useSyncedConversations>;