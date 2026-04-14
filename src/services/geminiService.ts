import { GoogleGenAI } from '@google/genai';
import { Message } from '@/types';

const GEMINI_API_KEY = 'AIzaSyC5ce5RJF-TKjLk5s0hKQt-6gDTD4X1L1s';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function sendMessageToGemini(
    userMessage: string,
    conversationHistory: Message[]
): Promise<string> {
    const historyText = conversationHistory
        .map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
        .join('\n');

    const fullPrompt = historyText
        ? `${historyText}\nUser: ${userMessage}`
        : `User: ${userMessage}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: fullPrompt,
        config: {
            temperature: 0.9,
            topP: 0.95,
            topK: 40,
        },
    });

    return response.text ?? '';
}