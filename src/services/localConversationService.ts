import { Conversation, Message } from "@/types";
import { INITIAL_CONVERSATIONS } from "@/data/mock";

const STORAGE_KEY = 'samiati_conversations';
const ACTIVE_CHAT_KEY = 'samiati_active_chat';


export const localConversationService = {
    // Load all conversations from local storage
    getConversations: (): Conversation[] => {
        if (typeof window === 'undefined') return [];

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                // Initialize with mock data if empty (for demo purposes)
                localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CONVERSATIONS));
                return INITIAL_CONVERSATIONS;
            }
            return JSON.parse(stored);
        } catch (error) {
            console.error("Failed to load conversations:", error);
            return [];
        }
    },

    // Get a specific conversation by ID
    getConversation: (id: string): Conversation | undefined => {
        const conversations = localConversationService.getConversations();
        return conversations.find(c => c.id === id);
    },

    // Save or update a conversation
    saveConversation: (conversation: Conversation) => {
        const conversations = localConversationService.getConversations();
        const index = conversations.findIndex(c => c.id === conversation.id);

        if (index >= 0) {
            conversations[index] = conversation;
        } else {
            conversations.unshift(conversation); // Add to top
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    },

    // Create a new empty conversation
    createNewConversation: (): Conversation => {
        const newConversation: Conversation = {
            id: Date.now().toString(),
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

    // Get the last active conversation ID
    getActiveConversationId: (): string | null => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(ACTIVE_CHAT_KEY);
    },

    // Set the active conversation ID
    setActiveConversationId: (id: string | null) => {
        if (typeof window === 'undefined') return;
        if (id) {
            localStorage.setItem(ACTIVE_CHAT_KEY, id);
        } else {
            localStorage.removeItem(ACTIVE_CHAT_KEY);
        }
    }
};

