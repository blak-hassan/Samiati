import { Conversation } from "@/types";

/**
 * Storage key for a one-shot seed passed from a Saved Session to the
 * Changa contribution page. The add-contribution page reads this on mount,
 * passes it as `initialAnswer` to TaskContributionScreen, then clears it.
 */
export const CHANGA_SEED_KEY = "changa_seed_from_chat";

export interface ChangaSeed {
    conversationId: string;
    title: string;
    category?: Conversation["category"];
    language?: string;
    seedText: string;
    createdAt: number;
}

export function writeChangaSeed(seed: Omit<ChangaSeed, "createdAt">): void {
    if (typeof window === "undefined") return;
    try {
        window.sessionStorage.setItem(
            CHANGA_SEED_KEY,
            JSON.stringify({ ...seed, createdAt: Date.now() })
        );
    } catch {
        // sessionStorage may be disabled (private mode, quota) — fail soft
    }
}

export function readAndClearChangaSeed(): ChangaSeed | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.sessionStorage.getItem(CHANGA_SEED_KEY);
        if (!raw) return null;
        window.sessionStorage.removeItem(CHANGA_SEED_KEY);
        const parsed = JSON.parse(raw) as ChangaSeed;
        if (!parsed.seedText || typeof parsed.seedText !== "string") return null;
        // Drop stale seeds (>10 min) — they belong to a previous click.
        if (Date.now() - (parsed.createdAt ?? 0) > 10 * 60 * 1000) return null;
        return parsed;
    } catch {
        return null;
    }
}

/**
 * Pick the most appropriate seed text from a conversation: the last AI
 * message is the cultural answer the user wants to preserve; fall back to
 * the most recent message of any sender.
 */
export function pickSeedText(conversation: Conversation): string {
    const messages = conversation.messages ?? [];
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].sender === "ai" && messages[i].text?.trim()) {
            return messages[i].text.trim();
        }
    }
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].text?.trim()) return messages[i].text.trim();
    }
    return "";
}
