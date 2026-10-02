// tests/export-conversation.test.ts
// Unit tests for the export helpers (src/lib/exportConversation.ts), focused on
// `isBodyMissing` — the guard that prevents exporting a metadata-only session
// (hydrated from the server but never opened) as a body-less file.
import { describe, it, expect } from 'vitest';
import { isBodyMissing } from '@/lib/exportConversation';
import { Conversation } from '@/types';

function conversation(overrides: Partial<Conversation> = {}): Conversation {
    return {
        id: 'chat_1',
        title: 'Swahili greetings',
        date: 'Sep 1, 2026',
        messageCount: 0,
        isPinned: false,
        messages: [],
        lastActive: 1000,
        category: 'general',
        ...overrides,
    };
}

describe('isBodyMissing', () => {
    it('is false when messages are cached locally', () => {
        const c = conversation({
            messageCount: 2,
            messages: [
                { id: 'm1', sender: 'user', text: 'Jambo', timestamp: new Date(1) },
                { id: 'm2', sender: 'ai', text: 'Habari!', timestamp: new Date(2) },
            ],
        });
        expect(isBodyMissing(c)).toBe(false);
    });

    it('is true when messageCount is non-zero but no body is cached', () => {
        // This is the exact state produced by mapConvexConversation for a
        // session synced from another device that has not been opened yet.
        expect(isBodyMissing(conversation({ messageCount: 5, messages: [] }))).toBe(true);
    });

    it('is false for a genuinely empty session', () => {
        expect(isBodyMissing(conversation({ messageCount: 0, messages: [] }))).toBe(false);
    });

    it('tolerates a missing messages array', () => {
        const c = { ...conversation({ messageCount: 3 }) } as Conversation;
        delete c.messages;
        expect(isBodyMissing(c)).toBe(true);
    });
});