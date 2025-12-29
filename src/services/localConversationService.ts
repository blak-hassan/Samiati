import { Conversation, Message } from "@/types";
import { INITIAL_CONVERSATIONS } from "@/data/mock";

const STORAGE_KEY = 'samiati_conversations';

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
    }
};
