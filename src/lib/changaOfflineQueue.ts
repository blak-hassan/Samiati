// CHANGA-10: Changa submissions require real-time Convex mutations, so a
// network drop hard-fails the submit. Text answers are small and serialisable,
// so we keep a localStorage queue of failed text submissions and flush them
// automatically when connectivity returns. Audio blobs cannot be persisted
// here, so this only covers text tasks (audio relies on the in-screen retry).

const QUEUE_KEY = "changa_offline_queue";

export type QueuedChangaSubmission = {
    taskId: string;
    answer: string;
    hasTrainingConsent: boolean;
    taskType: string;
    enqueuedAt: number;
    retries?: number;
};

export function enqueueChangaSubmission(item: Omit<QueuedChangaSubmission, "enqueuedAt">): void {
    if (typeof window === "undefined") return;
    try {
        const raw = window.localStorage.getItem(QUEUE_KEY);
        const queue: QueuedChangaSubmission[] = raw ? JSON.parse(raw) : [];
        if (!queue.some((q) => q.taskId === item.taskId && q.answer === item.answer)) {
            queue.push({ ...item, enqueuedAt: Date.now() });
            window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        }
    } catch {
        // Storage unavailable — nothing to queue.
    }
}

export function takeChangaQueue(): QueuedChangaSubmission[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(QUEUE_KEY);
        const queue: QueuedChangaSubmission[] = raw ? JSON.parse(raw) : [];
        window.localStorage.removeItem(QUEUE_KEY);
        return queue;
    } catch {
        return [];
    }
}

export function changaQueueSize(): number {
    if (typeof window === "undefined") return 0;
    try {
        const raw = window.localStorage.getItem(QUEUE_KEY);
        return raw ? (JSON.parse(raw) as QueuedChangaSubmission[]).length : 0;
    } catch {
        return 0;
    }
}

// Re-enqueue a previously-failed item (e.g. after a transient outage) while
// preserving its identity and incremented retry count.
export function requeueChangaSubmission(item: QueuedChangaSubmission): void {
    if (typeof window === "undefined") return;
    try {
        const raw = window.localStorage.getItem(QUEUE_KEY);
        const queue: QueuedChangaSubmission[] = raw ? JSON.parse(raw) : [];
        queue.push(item);
        window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch {
        // Storage unavailable — the item cannot be retried.
    }
}
