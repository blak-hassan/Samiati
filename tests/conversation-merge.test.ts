// tests/conversation-merge.test.ts
// Unit tests for the pure server→local merge helpers used by the Sessions
// hydration hook (src/lib/conversationMerge.ts).
import { describe, it, expect } from 'vitest';
import {
    mapConvexMessages,
    mapConvexConversation,
    mergeConversationList,
    mergeActiveConversation,
    ServerConversationShape,
    ServerMessageShape,
} from '@/lib/conversationMerge';
import { Conversation, Message } from '@/types';

function serverConversation(overrides: Partial<ServerConversationShape> = {}): ServerConversationShape {
    return {
        clientId: 'chat_1',
        title: 'Swahili greetings',
        date: 'Sep 1, 2026',
        messageCount: 2,
        isPinned: false,
        lastActive: 1000,
        category: 'history',
        ...overrides,
    };
}

function localConversation(overrides: Partial<Conversation> = {}): Conversation {
    return {
        id: 'chat_1',
        title: 'Swahili greetings',
        date: 'Sep 1, 2026',
        messageCount: 2,
        isPinned: false,
        messages: [],
        lastActive: 1000,
        category: 'history',
        ...overrides,
    };
}

describe('mapConvexMessages', () => {
    it('projects server message rows into the client Message shape with Date timestamps', () => {
        const rows: ServerMessageShape[] = [
            {
                clientId: 'm1',
                sender: 'user',
                text: 'Jambo',
                translatedText: 'Hello',
                targetLanguage: 'en',
                timestamp: 1234,
                feedback: 'up',
                comments: ['nice'],
            },
        ];
        const msgs = mapConvexMessages(rows);
        expect(msgs).toHaveLength(1);
        expect(msgs[0]).toMatchObject({
            id: 'm1',
            sender: 'user',
            text: 'Jambo',
            translatedText: 'Hello',
            targetLanguage: 'en',
            feedback: 'up',
            comments: ['nice'],
        });
        expect(msgs[0].timestamp).toBeInstanceOf(Date);
        expect(msgs[0].timestamp.getTime()).toBe(1234);
    });
});
describe('mapConvexConversation', () => {
    it('preserves local-only fields when a server row arrives', () => {
        const server = serverConversation({ isArchived: true });
        const existing = localConversation({
            language: 'Swahili',
            languageCode: 'sw',
            pinOrder: 3,
            messages: [{ id: 'm1', sender: 'user', text: 'Jambo', timestamp: new Date(1) }] as Message[],
            syncedToConvex: false,
        });
        const mapped = mapConvexConversation(server, existing);
        expect(mapped.id).toBe('chat_1');
        expect(mapped.isArchived).toBe(true);
        expect(mapped.isPinned).toBe(false);
        expect(mapped.language).toBe('Swahili');
        expect(mapped.languageCode).toBe('sw');
        expect(mapped.pinOrder).toBe(3);
        expect(mapped.syncedToConvex).toBe(true);
        // Server row carries no messages — keep the cached ones.
        expect(mapped.messages).toHaveLength(1);
    });

    it('retains the previous archive state when the server row predates the column', () => {
        const mapped = mapConvexConversation(
            serverConversation({ isArchived: undefined }),
            localConversation({ isArchived: true })
        );
        expect(mapped.isArchived).toBe(true);
    });

    it('coerces numeric dates to a display string', () => {
        const mapped = mapConvexConversation(serverConversation({ date: 1725200000000 }));
        expect(typeof mapped.date).toBe('string');
        expect(mapped.date).toBeTruthy();
    });
});

describe('mergeConversationList', () => {
    it('keeps local-only conversations on top and merges server rows after', () => {
        const server = [serverConversation({ clientId: 'chat_server' })];
        const local = [localConversation({ id: 'chat_local', messages: [] })];
        const merged = mergeConversationList(server, local);
        expect(merged.map((c) => c.id)).toEqual(['chat_local', 'chat_server']);
        expect(merged[1].syncedToConvex).toBe(true);
    });

    it('merges metadata for duplicate ids without losing local fields', () => {
        const server = [serverConversation({ clientId: 'chat_1', title: 'New title from server' })];
        const local = [localConversation({ language: 'Yoruba', languageCode: 'yo' })];
        const merged = mergeConversationList(server, local);
        expect(merged).toHaveLength(1);
        expect(merged[0].title).toBe('New title from server');
        expect(merged[0].language).toBe('Yoruba');
        expect(merged[0].languageCode).toBe('yo');
    });

    it('deduplicates repeated server clientIds', () => {
        const server = [serverConversation({ clientId: 'chat_1' }), serverConversation({ clientId: 'chat_1' })];
        const merged = mergeConversationList(server, []);
        expect(merged).toHaveLength(1);
    });
});

describe('mergeActiveConversation', () => {
    it('replaces messages for the active chat with the server copy', () => {
        const server = serverConversation({
            messages: [
                { clientId: 's1', sender: 'ai', text: 'Hello!', timestamp: 2000 },
            ] as ServerMessageShape[],
        });
        const existing = localConversation({
            messages: [{ id: 'old', sender: 'user', text: 'old', timestamp: new Date(1) }] as Message[],
        });
        const merged = mergeActiveConversation([existing], server, 'chat_1');
        expect(merged).toHaveLength(1);
        expect(merged[0].messages.map((m) => m.id)).toEqual(['s1']);
        expect(merged[0].messageCount).toBe(2);
        expect(merged[0].isArchived).toBe(false);
    });

    it('inserts a server conversation that is not yet local', () => {
        const server = serverConversation({ clientId: 'chat_new', messages: [] });
        const merged = mergeActiveConversation([], server, 'chat_new');
        expect(merged).toHaveLength(1);
        expect(merged[0].id).toBe('chat_new');
        expect(merged[0].syncedToConvex).toBe(true);
    });
});