// tests/conversation-queue.test.ts
// Unit tests for the persisted offline sync queue
// (src/services/conversationSyncQueue.ts).
import { describe, it, expect, beforeEach } from 'vitest';
import { conversationSyncQueue } from '@/services/conversationSyncQueue';
import { Conversation } from '@/types';

function installWindow() {
    const storage = new Map<string, string>();
    const fake = {
        localStorage: {
            getItem: (k: string) => (storage.has(k) ? storage.get(k)! : null),
            setItem: (k: string, v: string) => {
                storage.set(k, v);
            },
            removeItem: (k: string) => {
                storage.delete(k);
            },
            clear: () => storage.clear(),
        },
    };
    (globalThis as any).window = fake;
    return storage;
}

function makeConversation(id: string, title = 'Title', lastActive = 1000): Conversation {
    return {
        id,
        title,
        date: 'Sep 1, 2026',
        messageCount: 1,
        isPinned: false,
        messages: [{ id: `${id}_m1`, sender: 'user', text: 'hi', timestamp: new Date(1) }],
        lastActive,
        category: 'general',
    };
}

let storage: Map<string, string>;

beforeEach(() => {
    storage = installWindow();
    conversationSyncQueue.clear();
});

describe('conversationSyncQueue', () => {
    it('enqueues and reads back ops with queuedAt timestamps', () => {
        conversationSyncQueue.enqueue({ kind: 'save', clientId: 'a', conversation: makeConversation('a') });
        conversationSyncQueue.enqueue({ kind: 'metadata', clientId: 'b', patch: { isPinned: true } });
        const q = conversationSyncQueue.getQueue();
        expect(q).toHaveLength(2);
        expect(q[0].kind).toBe('save');
        expect(q[1].kind).toBe('metadata');
        expect(typeof q[0].queuedAt).toBe('number');
    });

    it('keeps only the latest save per conversation', () => {
        const first = makeConversation('a', 'First', 100);
        const second = makeConversation('a', 'Second', 200);
        conversationSyncQueue.enqueue({ kind: 'save', clientId: 'a', conversation: first });
        conversationSyncQueue.enqueue({ kind: 'save', clientId: 'a', conversation: second });
        const q = conversationSyncQueue.getQueue();
        const saves = q.filter((x) => x.kind === 'save');
        expect(saves).toHaveLength(1);
        if (saves[0].kind === 'save') {
            expect(saves[0].conversation.title).toBe('Second');
        }
    });

    it('coalesces metadata ops for the same conversation', () => {
        conversationSyncQueue.enqueue({ kind: 'metadata', clientId: 'a', patch: { isPinned: true } });
        conversationSyncQueue.enqueue({ kind: 'metadata', clientId: 'a', patch: { isArchived: true } });
        const q = conversationSyncQueue.getQueue();
        const metas = q.filter((x) => x.kind === 'metadata');
        expect(metas).toHaveLength(1);
        if (metas[0].kind === 'metadata') {
            expect(metas[0].patch).toEqual({ isArchived: true });
        }
    });

    it('lets a delete supersede pending save/metadata ops', () => {
        conversationSyncQueue.enqueue({ kind: 'save', clientId: 'a', conversation: makeConversation('a') });
        conversationSyncQueue.enqueue({ kind: 'metadata', clientId: 'a', patch: { isPinned: true } });
        conversationSyncQueue.enqueue({ kind: 'delete', clientId: 'a' });
        const q = conversationSyncQueue.getQueue();
        expect(q).toHaveLength(1);
        expect(q[0].kind).toBe('delete');
    });

    it('drops a save for a conversation that already has a pending delete', () => {
        conversationSyncQueue.enqueue({ kind: 'delete', clientId: 'a' });
        conversationSyncQueue.enqueue({ kind: 'save', clientId: 'a', conversation: makeConversation('a') });
        const q = conversationSyncQueue.getQueue();
        expect(q).toHaveLength(1);
        expect(q[0].kind).toBe('delete');
    });

    it('persists across "instances" (read from storage)', () => {
        conversationSyncQueue.enqueue({ kind: 'save', clientId: 'a', conversation: makeConversation('a') });
        // Simulate a page reload — the storage map is untouched.
        const reloaded = conversationSyncQueue.getQueue();
        expect(reloaded).toHaveLength(1);
        expect(reloaded[0].kind).toBe('save');
    });

    it('setQueue replaces the persisted queue and clear empties it', () => {
        conversationSyncQueue.enqueue({ kind: 'save', clientId: 'a', conversation: makeConversation('a') });
        conversationSyncQueue.setQueue([]);
        expect(conversationSyncQueue.getQueue()).toHaveLength(0);
        expect(storage.has('samiati_conversation_sync_queue')).toBe(false);
    });

    it('removeSaveOps prunes save ops but keeps deletes', () => {
        conversationSyncQueue.enqueue({ kind: 'delete', clientId: 'a' });
        conversationSyncQueue.enqueue({ kind: 'save', clientId: 'b', conversation: makeConversation('b') });
        conversationSyncQueue.removeSaveOps(['a', 'b']);
        const q = conversationSyncQueue.getQueue();
        expect(q).toHaveLength(1);
        expect(q[0].kind).toBe('delete');
    });
});