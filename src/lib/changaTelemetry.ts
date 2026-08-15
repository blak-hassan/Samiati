// Lightweight anonymous task-lifecycle telemetry for the Changa funnel.
// Events are stored in localStorage (bounded) so a future funnel dashboard
// can read them without adding a third-party analytics dependency.
// Never attach raw response text, prompts, or PII to these events.

export type ChangaEventName =
    | "task_offered"
    | "task_claimed"
    | "task_started"
    | "task_skipped"
    | "mic_permission_denied"
    | "draft_saved"
    | "upload_started"
    | "upload_failed"
    | "upload_resumed"
    | "submitted"
    | "needs_retry"
    | "completed";

export interface ChangaEvent {
    name: ChangaEventName;
    taskType?: string;
    languageCode?: string;
    taskId?: string;
    clientAppVersion?: string;
    at: number;
}

const STORAGE_KEY = "changa_telemetry_events";
const MAX_EVENTS = 500;

function readEvents(): ChangaEvent[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeEvents(events: ChangaEvent[]) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
    } catch {
        // Storage full or unavailable — telemetry is best-effort.
    }
}

export function logChangaEvent(event: Omit<ChangaEvent, "at">) {
    const full: ChangaEvent = { ...event, at: Date.now() };
    const events = readEvents();
    events.push(full);
    writeEvents(events);

    // Console logging is useful during development and can be removed
    // once a real funnel dashboard consumes the stored events.
    if (process.env.NODE_ENV !== "production") {
        console.debug("[changa-telemetry]", full.name, full.taskType || "", full.languageCode || "");
    }
}

export function getChangaEvents(): ChangaEvent[] {
    return readEvents();
}

export function clearChangaEvents() {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch {
        // ignore
    }
}