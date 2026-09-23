import { Conversation } from "@/types";

/**
 * Persisted offline queue for conversation sync.
 *
 * Every server-bound write (save / metadata / delete) is enqueued here before
 * being flushed to Convex. If the flush fails (offline, transient error) the
 * op stays queued and is retried on the next mount, `online` event, or sign-in.
 * The queue is bounded: per conversation only the latest `save` and one
 * `metadata` op are kept, and a `delete` supersedes earlier ops for that id.
 */

export type PendingSaveOp = { kind: "save"; clientId: string; conversation: Conversation; queuedAt: number };
export type PendingMetadataOp = {
    kind: "metadata";
    clientId: string;
    patch: { title?: string; isPinned?: boolean; isArchived?: boolean };
    queuedAt: number;
};
export type PendingDeleteOp = { kind: "delete"; clientId: string; queuedAt: number };
export type PendingSyncOp = PendingSaveOp | PendingMetadataOp | PendingDeleteOp;

export type EnqueueInput =
    | { kind: "save"; clientId: string; conversation: Conversation }
    | { kind: "metadata"; clientId: string; patch: PendingMetadataOp["patch"] }
    | { kind: "delete"; clientId: string };

const QUEUE_KEY = "samiati_conversation_sync_queue";

function readQueue(): PendingSyncOp[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(QUEUE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as PendingSyncOp[]) : [];
    } catch {
        return [];
    }
}

function writeQueue(queue: PendingSyncOp[]) {
    if (typeof window === "undefined") return;
    try {
        if (queue.length === 0) {
            window.localStorage.removeItem(QUEUE_KEY);
        } else {
            window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        }
    } catch {
        // Storage full/unavailable — the in-memory flush will still run.
    }
}

export const conversationSyncQueue = {
    getQueue(): PendingSyncOp[] {
        return readQueue();
    },

    setQueue(queue: PendingSyncOp[]) {
        writeQueue(queue);
    },

    clear() {
        writeQueue([]);
    },

    enqueue(input: EnqueueInput) {
        const op: PendingSyncOp = { ...input, queuedAt: Date.now() } as PendingSyncOp;
        const queue = readQueue();
        let next: PendingSyncOp[];

        if (op.kind === "delete") {
            // Delete supersedes every pending op for the same conversation.
            next = [...queue.filter((x) => x.clientId !== op.clientId), op];
        } else if (op.kind === "save") {
            // A full snapshot supersedes any earlier save/metadata op, but a
            // pending delete wins (the conversation no longer exists locally).
            const hasPendingDelete = queue.some((x) => x.clientId === op.clientId && x.kind === "delete");
            if (hasPendingDelete) return;
            next = [
                ...queue.filter((x) => x.clientId !== op.clientId || x.kind === "delete"),
                op,
            ];
        } else {
            // metadata: keep the latest per conversation; preserve a pending
            // save so the snapshot is applied first, then metadata on top.
            next = [
                ...queue.filter((x) => x.clientId !== op.clientId || x.kind === "save"),
                op,
            ];
        }
        writeQueue(next);
    },

    /** Drop queued save/metadata ops for the given ids (e.g. after a server flush already succeeded). */
    removeSaveOps(clientIds: string[]) {
        const ids = new Set(clientIds);
        // Prune only save/metadata ops — a pending delete for the same id must
        // survive, otherwise a superseded conversation could resurrect on the
        // server when the remaining queued ops flush.
        writeQueue(readQueue().filter((x) => !(ids.has(x.clientId) && x.kind !== "delete")));
    },
};