import { Conversation, Message } from "@/types";

/**
 * Pure merge helpers for the Sessions / Saved Conversations feature.
 *
 * Convex rows and the local `Conversation` shape differ slightly (server rows
 * carry `clientId` and no message array; local rows carry `id` + `messages`),
 * so every server → local projection goes through these functions. Keeping
 * them pure makes the hydration paths unit-testable without a Convex client.
 */

/** Shape of a `conversations` row returned by listConversations. */
export interface ServerConversationShape {
    clientId: string;
    title: string;
    date: string | number;
    messageCount: number;
    isPinned: boolean;
    isArchived?: boolean;
    lastActive: number;
    category?: string | null;
    [k: string]: unknown;
}

/** Shape of a `messages` row returned by getConversationWithMessages. */
export interface ServerMessageShape {
    clientId: string;
    sender: string;
    text: string;
    translatedText?: string | null;
    targetLanguage?: string | null;
    timestamp: number;
    feedback?: "up" | "down" | null;
    comments?: string[] | null;
    type?: string | null;
    status?: string | null;
    duration?: string | null;
    [k: string]: unknown;
}

export function mapConvexMessages(messages: ServerMessageShape[]): Message[] {
    return messages.map((m) => ({
        id: m.clientId,
        sender: m.sender as Message["sender"],
        text: m.text,
        translatedText: m.translatedText ?? undefined,
        targetLanguage: m.targetLanguage ?? undefined,
        timestamp: new Date(m.timestamp),
        feedback: m.feedback ?? undefined,
        comments: m.comments ?? undefined,
    }));
}

/**
 * Project a server conversation row into the client `Conversation` shape,
 * preserving local-only fields (language, archive state when the server row
 * predates the column, pin order, cached messages) from the previous local
 * copy so a server refresh never wipes the richer client cache.
 */
export function mapConvexConversation(
    server: ServerConversationShape,
    existing?: Conversation
): Conversation {
    return {
        id: server.clientId,
        title: server.title,
        date:
            typeof server.date === "number"
                ? new Date(server.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : ((server.date as string) ?? existing?.date ?? ""),
        messageCount: server.messageCount ?? existing?.messageCount ?? 0,
        isPinned: server.isPinned,
        lastActive: server.lastActive,
        category: (server.category as Conversation["category"]) ?? existing?.category,
        language: existing?.language,
        languageCode: existing?.languageCode,
        isArchived: server.isArchived ?? existing?.isArchived ?? false,
        pinOrder: existing?.pinOrder,
        syncedToConvex: true,
        messages: existing?.messages ?? [],
    };
}

/**
 * Merge a server conversation list into the local cache.
 * Server rows win for metadata; local-only fields and messages are preserved;
 * local-only conversations (guest chats not yet uploaded) are kept on top.
 */
export function mergeConversationList(
    server: ServerConversationShape[],
    local: Conversation[]
): Conversation[] {
    const localById = new Map<string, Conversation>();
    for (const c of local) {
        if (c.id) localById.set(c.id, c);
    }
    const serverIds = new Set<string>();
    const merged: Conversation[] = [];
    for (const sc of server) {
        if (!sc?.clientId || serverIds.has(sc.clientId)) continue;
        serverIds.add(sc.clientId);
        merged.push(mapConvexConversation(sc, localById.get(sc.clientId)));
    }
    const onlyLocal = local.filter((c) => !serverIds.has(c.id));
    return [...onlyLocal, ...merged];
}

/**
 * Merge a single conversation (with messages) returned by
 * getConversationWithMessages into the list, preserving server-side messages
 * for the active chat.
 */
export function mergeActiveConversation(
    conversations: Conversation[],
    server: ServerConversationShape & { messages?: ServerMessageShape[] },
    clientId: string
): Conversation[] {
    const idx = conversations.findIndex((c) => c.id === clientId);
    const existing = idx >= 0 ? conversations[idx] : undefined;
    const mapped: Conversation = {
        ...mapConvexConversation(server, existing),
        messages: server.messages ? mapConvexMessages(server.messages) : (existing?.messages ?? []),
    };
    if (idx >= 0) {
        const next = [...conversations];
        next[idx] = mapped;
        return next;
    }
    return [mapped, ...conversations];
}