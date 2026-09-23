import { z } from "zod";
import { Conversation, Message } from "@/types";

/**
 * Import helpers for the Sessions page.
 *
 * Accepts JSON exported by `exportAllConversations` (an array of `Conversation`)
 * or a wrapper object `{ conversations: [...] }` / `{ sessions: [...] }`.
 * Parsing is lenient (title/date defaults, numeric/string timestamps coerced)
 * so exports from different builds and manual edits still round-trip.
 */

export const importMessageValidator = z.object({
    id: z.string().optional(),
    clientId: z.string().optional(),
    sender: z.enum(["user", "ai", "system"]).default("user"),
    text: z.string().default(""),
    translatedText: z.string().optional().nullable(),
    targetLanguage: z.string().optional().nullable(),
    timestamp: z
        .union([z.number(), z.string()])
        .transform((v) => (typeof v === "string" ? Date.parse(v) || Date.now() : v))
        .default(() => Date.now()),
    feedback: z.enum(["up", "down"]).optional().nullable(),
    comments: z.array(z.string()).optional(),
    type: z.string().optional().nullable(),
    status: z.string().optional().nullable(),
    duration: z.string().optional().nullable(),
});

export const importConversationValidator = z.object({
    id: z.string().optional(),
    clientId: z.string().optional(),
    title: z.string().default("Imported session"),
    date: z
        .string()
        .default(() => new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })),
    messageCount: z.number().int().nonnegative().optional(),
    isPinned: z.boolean().default(false),
    isArchived: z.boolean().default(false),
    lastActive: z
        .union([z.number(), z.string()])
        .transform((v) => (typeof v === "string" ? Date.parse(v) || Date.now() : v))
        .default(() => Date.now()),
    language: z.string().optional().nullable(),
    languageCode: z.string().optional().nullable(),
    category: z.enum(["proverb", "story", "song", "history", "word", "general"]).optional().nullable(),
    messages: z.array(importMessageValidator).default([]),
    syncedToConvex: z.boolean().default(false),
});

export type ImportedConversation = z.infer<typeof importConversationValidator>;
export type ImportedMessage = z.infer<typeof importMessageValidator>;

export class ConversationImportError extends Error {
    constructor(message: string, public readonly index?: number) {
        super(message);
        this.name = "ConversationImportError";
    }
}

export function toLocalConversation(validated: ImportedConversation): Conversation {
    const id = validated.id ?? validated.clientId ?? `imported_${Date.now()}_${importCounter++}`;
    const messages = validated.messages.map((m, i) => toLocalMessage(id, i, m));
    return {
        id,
        title: validated.title,
        date: validated.date,
        messageCount: validated.messageCount ?? messages.length,
        isPinned: validated.isPinned,
        isArchived: validated.isArchived,
        lastActive: validated.lastActive,
        language: validated.language ?? undefined,
        languageCode: validated.languageCode ?? undefined,
        category: validated.category ?? undefined,
        messages,
        syncedToConvex: validated.syncedToConvex,
    };
}

/** Parse a JSON string into client Conversation objects. Throws ConversationImportError on bad input. */
export function parseImportedConversations(json: string): Conversation[] {
    let data: unknown;
    try {
        data = JSON.parse(json);
    } catch {
        throw new ConversationImportError("The file is not valid JSON.");
    }

    let rawList: unknown[] = [];
    if (Array.isArray(data)) {
        rawList = data;
    } else if (data && typeof data === "object") {
        const obj = data as Record<string, unknown>;
        const arr = obj.conversations ?? obj.sessions ?? obj.chats;
        if (Array.isArray(arr)) rawList = arr;
        else throw new ConversationImportError("The file must be an array of sessions or { conversations: [...] }.");
    } else {
        throw new ConversationImportError("The file does not contain a session list.");
    }
    if (rawList.length === 0) return [];

    return rawList.map((entry, i) => {
        try {
            return toLocalConversation(importConversationValidator.parse(entry));
        } catch (err) {
            const detail = err instanceof z.ZodError ? err.issues[0]?.message : "invalid session";
            throw new ConversationImportError(`Session ${i + 1} is invalid: ${detail}`, i);
        }
    });
}
let importCounter = 0;

function toLocalMessage(convId: string, idx: number, m: ImportedMessage): Message {
    return {
        id: m.id ?? m.clientId ?? `${convId}_m${idx}_${importCounter++}`,
        sender: (m.sender === "system" ? "ai" : m.sender) as Message["sender"],
        text: m.text,
        translatedText: m.translatedText ?? undefined,
        targetLanguage: m.targetLanguage ?? undefined,
        timestamp: new Date(m.timestamp),
        feedback: m.feedback ?? undefined,
        comments: m.comments ?? undefined,
    };
}
/** Union-merge two message arrays by id; the message with the newer timestamp wins. */
export function mergeImportedMessages(a: Message[], b: Message[]): Message[] {
    const byId = new Map<string, Message>();
    for (const m of [...a, ...b]) {
        if (!m.id) continue;
        const existing = byId.get(m.id);
        if (!existing || (m.timestamp?.getTime() ?? 0) > (existing.timestamp?.getTime() ?? 0)) {
            byId.set(m.id, m);
        }
    }
    return Array.from(byId.values()).sort(
        (x, y) => (x.timestamp?.getTime() ?? 0) - (y.timestamp?.getTime() ?? 0)
    );
}

/**
 * Merge imported conversations into the existing cache. For duplicate ids the
 * conversation with the newer `lastActive` contributes the metadata; messages
 * are unioned across both copies.
 */
export function mergeImportedConversations(existing: Conversation[], incoming: Conversation[]): Conversation[] {
    const byId = new Map<string, Conversation>();
    for (const c of existing) {
        if (c.id) byId.set(c.id, c);
    }
    for (const inc of incoming) {
        const ex = byId.get(inc.id);
        if (!ex) {
            byId.set(inc.id, inc);
            continue;
        }
        const newer = (inc.lastActive ?? 0) >= (ex.lastActive ?? 0) ? inc : ex;
        const messages = mergeImportedMessages(ex.messages ?? [], inc.messages ?? []);
        byId.set(inc.id, {
            ...ex,
            ...newer,
            messages,
            messageCount: messages.length,
            lastActive: Math.max(inc.lastActive ?? 0, ex.lastActive ?? 0),
        });
    }
    return Array.from(byId.values());
}