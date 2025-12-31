
import { ChatPreview } from '@/types';

// Extended Message Type for DMs
export interface DMMessage {
    id: string;
    senderId: string; // 'me' or user ID
    text: string;
    time: string; // Display time string for now
    timestamp: number; // for sorting
    status: 'sent' | 'delivered' | 'read';
    type: 'text' | 'image' | 'voice';
    mediaUrl?: string; // for image/voice
    duration?: string; // for voice
}

export interface DMChat {
    id: string;
    participants: {
        id: string;
        name: string;
        avatar: string;
        isOnline: boolean;
    }[];
    messages: DMMessage[];
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
}

// Initial Mock Data
const MOCK_CHATS: DMChat[] = [
    {
        id: '1',
        participants: [{
            id: 'KP',
            name: 'Kwame Mensah',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuGLE0i9NWNJMGLNeeS7Y-fkwpi4GavU-5tFQGjerfZBUK9A2baVE6a0v9b6Le6AIX-Xejh_WCf4Bb8tk8yqNXUeyVehi927mNkXbnvMb3ggvQTzfMzZcJc0kPiyaqMcPlts57mpPxJLq5-lgGwTjXzXNGyasv8_llUjyNVB2m-dLngZv8en8HyHDdbU1j_Wt2xl1HDaHg_iKgKX7HviRx7y_sXmAmU_NNuzZlrcnkbqtGL8NTvNgBOFaC4sSZ5yd97zBiTylIkog',
            isOnline: true
        }],
        messages: [
            { id: 'm1', senderId: 'KP', text: 'Jambo! Have you seen the new challenge?', time: '10:30 AM', timestamp: Date.now() - 3600000, status: 'read', type: 'text' },
            { id: 'm2', senderId: 'me', text: 'Yes! The village storyteller one?', time: '10:32 AM', timestamp: Date.now() - 3500000, status: 'read', type: 'text' },
            { id: 'm3', senderId: 'KP', text: 'Exactly. I am thinking of sharing a story about the tortoise.', time: '10:35 AM', timestamp: Date.now() - 3400000, status: 'read', type: 'text' }
        ],
        lastMessage: 'Exactly. I am thinking of sharing a story about the tortoise.',
        lastMessageTime: '10:35 AM',
        unreadCount: 0
    },
    {
        id: '2',
        participants: [{
            id: 'ZA',
            name: 'Zahra Ali',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHGQCh7G1VnjuVj9331GPw-eizTILg3UcwDA4ENWzw4Y4k-YeCgWzwUxAmYXQWIcfUfbQwVHw6sT-X-LP9EspDfXqNOQnm6QUcAN3d9HAxoEJ5kesDAP6W6EUQ6odygBf2Q2-wGIcEgisM6jeCizwsbd9roCE4EDfeK74dHdCooeQh3_eioZBLFJNPfGi8Cp4ke9oJ11DKdl5pNseP-GKgaT-tyieX9Uimavj73AayhR3msq3f9Dcw-BdgSJNRK5-7MQYX9T0wH_8',
            isOnline: false
        }],
        messages: [
            { id: 'm1', senderId: 'ZA', text: 'Asante sana for the help yesterday!', time: 'Yesterday', timestamp: Date.now() - 86400000, status: 'read', type: 'text' }
        ],
        lastMessage: 'Asante sana for the help yesterday!',
        lastMessageTime: 'Yesterday',
        unreadCount: 0
    }
];

export const dmService = {
    getChats: (): ChatPreview[] => {
        return MOCK_CHATS.map(chat => ({
            id: chat.id,
            name: chat.participants[0].name,
            avatar: chat.participants[0].avatar,
            lastMessage: chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].text : '',
            time: chat.lastMessageTime,
            unreadCount: chat.unreadCount,
            isOnline: chat.participants[0].isOnline,
            status: chat.messages.length > 0 && chat.messages[chat.messages.length - 1].senderId === 'me'
                ? chat.messages[chat.messages.length - 1].status
                : undefined
        }));
    },

    getChatMessages: (chatId: string): DMMessage[] => {
        const chat = MOCK_CHATS.find(c => c.id === chatId);
        return chat ? chat.messages : [];
    },

    sendMessage: (chatId: string, text: string, type: 'text' | 'image' | 'voice' = 'text', mediaUrl?: string, duration?: string): DMMessage => {
        const chatIndex = MOCK_CHATS.findIndex(c => c.id === chatId);
        if (chatIndex === -1) throw new Error('Chat not found');

        const newMessage: DMMessage = {
            id: Date.now().toString(),
            senderId: 'me',
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now(),
            status: 'sent',
            type,
            mediaUrl,
            duration
        };

        MOCK_CHATS[chatIndex].messages.push(newMessage);
        MOCK_CHATS[chatIndex].lastMessage = type === 'voice' ? 'Voice Message' : type === 'image' ? 'Image' : text;
        MOCK_CHATS[chatIndex].lastMessageTime = 'Just now';

        // Simulate delivery/read
        setTimeout(() => {
            newMessage.status = 'delivered';
            // Force trigger update in real app, but here we just rely on refetch
        }, 1000);

        setTimeout(() => {
            newMessage.status = 'read';
        }, 2500);

        return newMessage;
    },

    // Simulate receiving a reply
    simulateReply: (chatId: string): Promise<DMMessage> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const chatIndex = MOCK_CHATS.findIndex(c => c.id === chatId);
                if (chatIndex === -1) return;

                const replies = [
                    "That's interesting! Tell me more.",
                    "Sawa sawa.",
                    "I will check it out later.",
                    "Hahaha!",
                    "Have you tried the new feature?"
                ];
                const randomReply = replies[Math.floor(Math.random() * replies.length)];

                const replyMsg: DMMessage = {
                    id: (Date.now() + 1).toString(),
                    senderId: MOCK_CHATS[chatIndex].participants[0].id,
                    text: randomReply,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    timestamp: Date.now(),
                    status: 'read',
                    type: 'text'
                };

                MOCK_CHATS[chatIndex].messages.push(replyMsg);
                MOCK_CHATS[chatIndex].lastMessage = randomReply;
                MOCK_CHATS[chatIndex].lastMessageTime = 'Just now';
                MOCK_CHATS[chatIndex].unreadCount += 1; // Increment unread for demo

                resolve(replyMsg);
            }, 3000);
        });
    },

    createChat: (user: { name: string; avatar: string; id?: string }): string => {
        // Check if exists
        const existing = MOCK_CHATS.find(c => c.participants[0].name === user.name);
        if (existing) return existing.id;

        const newId = Date.now().toString();
        const newChat: DMChat = {
            id: newId,
            participants: [{
                id: user.id || `u-${Date.now()}`,
                name: user.name,
                avatar: user.avatar,
                isOnline: true
            }],
            messages: [],
            lastMessage: '',
            lastMessageTime: '',
            unreadCount: 0
        };
        MOCK_CHATS.unshift(newChat);
        return newId;
    },

    markAsRead: (chatId: string) => {
        const chat = MOCK_CHATS.find(c => c.id === chatId);
        if (chat) chat.unreadCount = 0;
    }
};
