// tests/conversation-import.test.ts
// Unit tests for session import/export parsing and merge
// (src/lib/conversationImport.ts).
import { describe, it, expect } from 'vitest';
import {
    ConversationImportError,
    mergeImportedConversations,
    mergeImportedMessages,
    parseImportedConversations,
} from '@/lib/conversationImport';
import { Conversation, Message } from '@/types';

function exported(): string {
    return JSON.stringify([
        {
            id: 'chat_a',
            title: 'Imported chat',
            date: 'Sep 1, 2026',
            messageCount: 2,
            isPinned: true,
            isArchived: false,
            lastActive: 5000,
            language: 'Swahili',
            languageCode: 'sw',
            category: 'story',
            messages: [
                { id: 'm1', sender: 'user', text: 'Jambo', timestamp: '2026-09-01T00:00:00.000Z' },
                { id: 'm2', sender: 'ai', text: 'Habari!', timestamp: '2026-09-01T00:00:01.000Z', feedback: 'up' },
            ],
        },
    ]);
}

describe('parseImportedConversations', () => {
    it('parses an exported array of conversations', () => {
        const parsed = parseImportedConversations(exported());
        expect(parsed).toHaveLength(1);
        const [c] = parsed;
        expect(c.id).toBe('chat_a');
        expect(c.title).toBe('Imported chat');
        expect(c.isPinned).toBe(true);
        expect(c.language).toBe('Swahili');
        expect(c.messages.map((m) => m.id)).toEqual(['m1', 'm2']);
        expect(c.messages[0].timestamp).toBeInstanceOf(Date);
        // messageCount should be kept when provided
        expect(c.messageCount).toBe(2);
    });

    it('accepts a { conversations: [...] } wrapper object', () => {
        const parsed = parseImportedConversations(JSON.stringify({ conversations: JSON.parse(exported()) }));
        expect(parsed).toHaveLength(1);
    });

    it('accepts clientId as the id fallback', () => {
        const parsed = parseImportedConversations(
            JSON.stringify([{ clientId: 'chat_c', title: 'From clientId', messages: [] }])
        );
        expect(parsed[0].id).toBe('chat_c');
    });

    it('derives missing messageCount from the message array', () => {
        const parsed = parseImportedConversations(
            JSON.stringify([
                {
                    id: 'chat_d',
                    title: 'Counted',
                    messages: [
                        { id: 'x1', sender: 'user', text: 'one', timestamp: 1 },
                        { id: 'x2', sender: 'ai', text: 'two', timestamp: 2 },
                    ],
                },
            ])
        );
        expect(parsed[0].messageCount).toBe(2);
    });

    it('throws a friendly error on invalid JSON', () => {
        expect(() => parseImportedConversations('{nope')).toThrow(ConversationImportError);
    });

    it('throws a friendly error on a malformed conversation entry', () => {
        // Every other field has a zod default, so a wrong-type messageCount is
        // the clearest way to make an entry genuinely malformed.
        expect(() =>
            parseImportedConversations(JSON.stringify([{ id: 'ok' }, { id: 'bad', messageCount: 'many' }]))
        ).toThrow(/Session 2 is invalid/);
    });
describe('mergeImportedMessages', () => {
    it('unions by id and prefers the newer message', () => {
        const a: Message[] = [{ id: 'm1', sender: 'user', text: 'old', timestamp: new Date(1) }];
        const b: Message[] = [{ id: 'm1', sender: 'user', text: 'new', timestamp: new Date(2) }];
        expect(mergeImportedMessages(a, b)).toEqual([{ id: 'm1', sender: 'user', text: 'new', timestamp: new Date(2) }]);
    });

    it('sorts merged messages by timestamp', () => {
        const a: Message[] = [{ id: 'm2', sender: 'ai', text: 'second', timestamp: new Date(2) }];
        const b: Message[] = [{ id: 'm1', sender: 'user', text: 'first', timestamp: new Date(1) }];
        expect(mergeImportedMessages(a, b).map((m) => m.id)).toEqual(['m1', 'm2']);
    });
});

describe('mergeImportedConversations', () => {
    function local(existing: Partial<Conversation>): Conversation {
        return {
            id: 'chat_a',
            title: 'Existing',
            date: 'Jan 1, 2026',
            messageCount: 1,
            isPinned: false,
            isArchived: false,
            lastActive: 100,
            messages: [{ id: 'm1', sender: 'user', text: 'local', timestamp: new Date(1) }],
            ...existing,
        };
    }

    it('adds brand-new imported conversations', () => {
        const merged = mergeImportedConversations([], [local({ id: 'new' })]);
        expect(merged.map((c) => c.id)).toEqual(['new']);
    });

    it('prefers newer metadata and unions messages for duplicates', () => {
        const existing = local({ lastActive: 100, title: 'old title' });
        const incoming = parseImportedConversations(
            JSON.stringify([
                {
                    id: 'chat_a',
                    title: 'new title',
                    date: 'Sep 1, 2026',
                    messageCount: 2,
                    isPinned: true,
                    lastActive: 5000,
                    messages: [
                        { id: 'm2', sender: 'ai', text: 'imported-only', timestamp: 2000 },
                        { id: 'm1', sender: 'user', text: 'imported-overwrite', timestamp: 2 },
                    ],
                },
            ])
        )[0];

        const merged = mergeImportedConversations([existing], [incoming]);
        expect(merged).toHaveLength(1);
        expect(merged[0].title).toBe('new title');
        expect(merged[0].isPinned).toBe(true);
        expect(merged[0].lastActive).toBe(5000);
        expect(merged[0].messageCount).toBe(2);
        const texts = new Set(merged[0].messages.map((m) => m.text));
        expect(texts).toEqual(new Set(['imported-only', 'imported-overwrite']));
    });

    it('keeps existing metadata when it is newer', () => {
        const existing = local({ lastActive: 9000, title: 'fresher local' });
        const incoming = local({ lastActive: 10, title: 'stale import' });
        const merged = mergeImportedConversations([existing], [incoming]);
        expect(merged[0].title).toBe('fresher local');
    });
});
});