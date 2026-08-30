import { Conversation } from "@/types";

const STORAGE_KEY = 'samiati_conversations';
const ACTIVE_CHAT_KEY = 'samiati_active_chat';

function loadSettings(): Conversation[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function persistSettings(conversations: Conversation[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

export const localConversationService = {
    getConversations: (): Conversation[] => {
        return loadSettings();
    },

    getConversation: (id: string): Conversation | undefined => {
        const conversations = loadSettings();
        return conversations.find(c => c.id === id);
    },

    saveConversation: (conversation: Conversation) => {
        const conversations = loadSettings();
        const index = conversations.findIndex(c => c.id === conversation.id);

        if (index >= 0) {
            conversations[index] = conversation;
        } else {
            conversations.unshift(conversation);
        }

        persistSettings(conversations);
    },

    deleteConversation: (id: string) => {
        const conversations = loadSettings();
        const filtered = conversations.filter(c => c.id !== id);
        persistSettings(filtered);

        if (localStorage.getItem(ACTIVE_CHAT_KEY) === id) {
            localStorage.removeItem(ACTIVE_CHAT_KEY);
        }
    },

    saveAll: (conversations: Conversation[]) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    },

    createNewConversation: (): Conversation => {
        const newConversation: Conversation = {
            id: `chat_${Date.now()}`,
            title: "New Conversation",
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            messageCount: 0,
            isPinned: false,
            messages: [],
            lastActive: Date.now(),
            category: 'general'
        };
        return newConversation;
    },

    getActiveConversationId: (): string | null => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(ACTIVE_CHAT_KEY);
    },

    setActiveConversationId: (id: string | null) => {
        if (typeof window === 'undefined') return;
        if (id) {
            localStorage.setItem(ACTIVE_CHAT_KEY, id);
        } else {
            localStorage.removeItem(ACTIVE_CHAT_KEY);
        }
    }
};
