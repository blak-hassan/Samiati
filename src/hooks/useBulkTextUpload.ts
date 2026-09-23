"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useChangaMutation as useMutation } from "@/hooks/useChangaData";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

// useBulkTextUpload — sends a large array of text entries to the
// `bulkAddDocumentEntries` mutation in batches of 500 (the server cap).
// Exposes progress, retry, and cancel semantics so the UI can render
// honest per-batch feedback.

const BATCH_SIZE = 500;
const IDB_KEY = "changa_bulk_upload_queue";

export type BulkUploadStatus = "idle" | "uploading" | "paused" | "error" | "done";

export interface BulkUploadEntry {
    index: number;
    sourceText: string;
    targetText?: string;
    metadata?: {
        page?: number;
        chapter?: string;
        partOfSpeech?: string;
        gloss?: string;
    };
    clientIdempotencyKey?: string;
}

export interface BulkUploadState {
    status: BulkUploadStatus;
    totalEntries: number;
    batchesSent: number;
    entriesSent: number;
    entriesAdded: number;
    entriesSkipped: number;
    error?: string;
    documentId?: Id<"changaDocuments">;
}

interface QueuedBatch {
    documentId: Id<"changaDocuments">;
    batchIndex: number;
    entries: BulkUploadEntry[];
}

function loadQueue(): QueuedBatch[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(IDB_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as QueuedBatch[];
    } catch {
        return [];
    }
}

function saveQueue(q: QueuedBatch[]) {
    if (typeof window === "undefined") return;
    try {
        if (q.length === 0) {
            window.localStorage.removeItem(IDB_KEY);
        } else {
            window.localStorage.setItem(IDB_KEY, JSON.stringify(q));
        }
    } catch {
        // ignore
    }
}

export interface UseBulkTextUploadReturn extends BulkUploadState {
    start: (documentId: Id<"changaDocuments">, entries: BulkUploadEntry[]) => Promise<BulkUploadState>;
    pause: () => void;
    resume: () => Promise<BulkUploadState | undefined>;
    cancel: () => void;
    retry: () => Promise<BulkUploadState | undefined>;
}

export function useBulkTextUpload(): UseBulkTextUploadReturn {
    const [state, setState] = useState<BulkUploadState>({
        status: "idle",
        totalEntries: 0,
        batchesSent: 0,
        entriesSent: 0,
        entriesAdded: 0,
        entriesSkipped: 0,
    });

    const cancelledRef = useRef(false);
    const pausedRef = useRef(false);
    const entriesRef = useRef<BulkUploadEntry[]>([]);
    const documentIdRef = useRef<Id<"changaDocuments"> | null>(null);
    // Synchronous mirror of the latest `state`. We can't read `state` directly
    // inside async callbacks because React batches re-renders and the closure
    // would see a stale value. The ref gives us the truthy "right now" view.
    const stateRef = useRef<BulkUploadState>(state);
    // Keep the ref in sync with React state when the component re-renders
    // for any reason (parent update, etc.). All direct `setState` calls in
    // this hook also assign `stateRef.current` so the ref leads by exactly
    // one microtask.
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    const bulkAdd = useMutation(api.changa.documents.bulkAddDocumentEntries);

    const sendBatch = useCallback(async (documentId: Id<"changaDocuments">, batch: BulkUploadEntry[]) => {
        const result = await bulkAdd({ documentId, entries: batch });
        return {
            added: result.added,
            skipped: result.skipped,
        };
    }, [bulkAdd]);

    const runBatches = useCallback(async (): Promise<BulkUploadState> => {
        const documentId = documentIdRef.current;
        if (!documentId) {
            return { ...stateRef.current };
        }

        const queue: QueuedBatch[] = [];
        for (let i = 0; i < entriesRef.current.length; i += BATCH_SIZE) {
            queue.push({
                documentId,
                batchIndex: Math.floor(i / BATCH_SIZE),
                entries: entriesRef.current.slice(i, i + BATCH_SIZE),
            });
        }
        saveQueue(queue);

        let totalAdded = 0;
        let totalSkipped = 0;
        let batchesSent = 0;

        for (const q of queue) {
            if (cancelledRef.current) {
                const next = { ...stateRef.current, status: "idle" as const };
                stateRef.current = next;
                setState(next);
                return next;
            }
            if (pausedRef.current) {
                const next = { ...stateRef.current, status: "paused" as const };
                stateRef.current = next;
                setState(next);
                return next;
            }
            try {
                const { added, skipped } = await sendBatch(q.documentId, q.entries);
                totalAdded += added;
                totalSkipped += skipped;
                batchesSent++;
                const next: BulkUploadState = {
                    ...stateRef.current,
                    batchesSent,
                    entriesSent: Math.min(q.batchIndex * BATCH_SIZE + q.entries.length, stateRef.current.totalEntries),
                    entriesAdded: totalAdded,
                    entriesSkipped: totalSkipped,
                };
                stateRef.current = next;
                setState(next);
                saveQueue(queue.slice(batchesSent));
            } catch (e) {
                const message = e instanceof Error ? e.message : "Batch failed";
                const next = { ...stateRef.current, status: "error" as const, error: message };
                stateRef.current = next;
                setState(next);
                saveQueue(queue.slice(batchesSent));
                return next;
            }
        }

        saveQueue([]);
        const finalState: BulkUploadState = {
            ...stateRef.current,
            status: "done",
            entriesSent: stateRef.current.totalEntries,
            entriesAdded: totalAdded,
            entriesSkipped: totalSkipped,
        };
        stateRef.current = finalState;
        setState(finalState);
        return finalState;
    }, [sendBatch]);

    const start = useCallback(async (documentId: Id<"changaDocuments">, entries: BulkUploadEntry[]): Promise<BulkUploadState> => {
        cancelledRef.current = false;
        pausedRef.current = false;
        documentIdRef.current = documentId;
        entriesRef.current = entries;
        const initial: BulkUploadState = {
            status: "uploading",
            totalEntries: entries.length,
            batchesSent: 0,
            entriesSent: 0,
            entriesAdded: 0,
            entriesSkipped: 0,
            documentId,
        };
        stateRef.current = initial;
        setState(initial);
        return runBatches();
    }, [runBatches]);

    const pause = useCallback(() => {
        pausedRef.current = true;
        const next = { ...stateRef.current, status: "paused" as const };
        stateRef.current = next;
        setState(next);
    }, []);

    const resume = useCallback(async (): Promise<BulkUploadState | undefined> => {
        pausedRef.current = false;
        const next = { ...stateRef.current, status: "uploading" as const };
        stateRef.current = next;
        setState(next);
        return runBatches();
    }, [runBatches]);

    const cancel = useCallback(() => {
        cancelledRef.current = true;
        pausedRef.current = false;
        entriesRef.current = [];
        documentIdRef.current = null;
        saveQueue([]);
        const next: BulkUploadState = {
            status: "idle",
            totalEntries: 0,
            batchesSent: 0,
            entriesSent: 0,
            entriesAdded: 0,
            entriesSkipped: 0,
        };
        stateRef.current = next;
        setState(next);
    }, []);

    const retry = useCallback(async (): Promise<BulkUploadState | undefined> => {
        const queue = loadQueue();
        if (queue.length === 0 || !documentIdRef.current) return stateRef.current;
        pausedRef.current = false;
        cancelledRef.current = false;
        const resumed: BulkUploadState = { ...stateRef.current, status: "uploading" };
        stateRef.current = resumed;
        setState(resumed);
        // Replay the persisted queue first, then the rest of the original set.
        let totalAdded = stateRef.current.entriesAdded;
        let totalSkipped = stateRef.current.entriesSkipped;
        let batchesSent = stateRef.current.batchesSent;
        for (const q of queue) {
            if (cancelledRef.current) return stateRef.current;
            if (pausedRef.current) {
                const next = { ...stateRef.current, status: "paused" as const };
                stateRef.current = next;
                setState(next);
                return next;
            }
            try {
                const { added, skipped } = await sendBatch(q.documentId, q.entries);
                totalAdded += added;
                totalSkipped += skipped;
                batchesSent++;
                const next: BulkUploadState = {
                    ...stateRef.current,
                    batchesSent,
                    entriesAdded: totalAdded,
                    entriesSkipped: totalSkipped,
                };
                stateRef.current = next;
                setState(next);
            } catch (e) {
                const message = e instanceof Error ? e.message : "Retry failed";
                const next = { ...stateRef.current, status: "error" as const, error: message };
                stateRef.current = next;
                setState(next);
                return next;
            }
        }
        saveQueue([]);
        const final: BulkUploadState = { ...stateRef.current, status: "done" };
        stateRef.current = final;
        setState(final);
        return final;
    }, [sendBatch]);

    return { ...state, start, pause, resume, cancel, retry };
}
