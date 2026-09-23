// tests/local-conversation-service.test.ts
// Unit tests for the localStorage read/write cache
// (src/services/localConversationService.ts).
import { describe, it, expect, beforeEach } from 'vitest';
import { localConversationService } from '@/services/localConversationService';

function installWindow() {
    const storage = new Map<string, string>();
    const fakeStorage = {
        getItem: (k: string) => (storage.has(k) ? storage.get(k)! : null),
        setItem: (k: string, v: string) => {
            storage.set(k, v);
        },
        removeItem: (k: string) => {
            storage.delete(k);
        },
        clear: () => storage.clear(),
    };
    // localConversationService guards with `typeof window !== 'undefined'` but
    // then reads the bare `localStorage` global, so both must be installed.
    (globalThis as any).window = { localStorage: fakeStorage };
    (globalThis as any).localStorage = fakeStorage;
    return storage;
}

let storage: Map<string, string>;

beforeEach(() => {
    storage = installWindow();
    storage.set('samiati_active_chat', 'active-1');
});

describe('localConversationService', () => {
    it('returns an empty list when nothing is stored', () => {
        expect(localConversationService.getConversations()).toEqual([]);
    });

    it('saves and reads back a conversation, unshifting new items to the front', () => {
        const conv = localConversationService.createNewConversation();
        conv.title = 'First';
        conv.messages.push({ id: 'm1', sender: 'user', text: 'Jambo', timestamp: new Date(1000) });
        conv.messageCount = 1;

        localConversationService.saveConversation(conv);

        const second = localConversationService.createNewConversation();
        second.title = 'Second';
        second.messages.push({ id: 'm2', sender: 'ai', text: 'Habari', timestamp: new Date(2000) });
        second.messageCount = 1;
        localConversationService.saveConversation(second);

        const all = localConversationService.getConversations();
        expect(all.map((c) => c.title)).toEqual(['Second', 'First']);
        expect(localConversationService.getConversation(conv.id)).toMatchObject({ title: 'First' });
    });

    it('updates an existing conversation in place rather than duplicating it', () => {
        const conv = localConversationService.createNewConversation();
        localConversationService.saveConversation(conv);
        localConversationService.saveConversation({ ...conv, title: 'Renamed' });

        const all = localConversationService.getConversations();
        expect(all).toHaveLength(1);
        expect(all[0].title).toBe('Renamed');
    });

    it('clears the active chat pointer when the active conversation is deleted', () => {
        const conv = localConversationService.createNewConversation();
        localStorage.setItem('samiati_active_chat', conv.id);
        localConversationService.deleteConversation(conv.id);
        expect(localStorage.getItem('samiati_active_chat')).toBeNull();
        expect(localConversationService.getConversation(conv.id)).toBeUndefined();
    });

    it('deleteConversations removes multiple ids and clears a matching active pointer', () => {
        const a = localConversationService.createNewConversation();
        const b = localConversationService.createNewConversation();
        localConversationService.saveAll([a, b]);
        localStorage.setItem('samiati_active_chat', b.id);

        localConversationService.deleteConversations([a.id, b.id]);
        expect(localConversationService.getConversations()).toEqual([]);
        expect(localStorage.getItem('samiati_active_chat')).toBeNull();
    });

    it('builds unique conversation ids including a random suffix', () => {
        const a = localConversationService.createNewConversation();
        const b = localConversationService.createNewConversation();
        expect(a.id).not.toBe(b.id);
        expect(a.id).toMatch(/^chat_/);
    });

    it('tolerates corrupt JSON in storage', () => {
        storage.set('samiati_conversations', '{not json');
        expect(localConversationService.getConversations()).toEqual([]);
        expect(localConversationService.getConversation('x')).toBeUndefined();
    });

    it('setActiveConversationId writes and clears the pointer', () => {
        localConversationService.setActiveConversationId('chat_abc');
        expect(localConversationService.getActiveConversationId()).toBe('chat_abc');
        localConversationService.setActiveConversationId(null);
        expect(localConversationService.getActiveConversationId()).toBeNull();
    });
});