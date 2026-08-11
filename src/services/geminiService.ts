// =============================================================================
// AI SERVICE — Client-side proxy
// =============================================================================
// Delegates to server-side Convex actions powered by
// Sunflower-Gemma4-E2B via HuggingFace Inference API.
// API key is stored securely in Convex environment variables.
// =============================================================================

import { Message } from '@/types';

export interface SearchResult {
    answer: string;
    sources: { title: string; url: string; snippet: string }[];
    followUps: string[];
}

export async function sendMessageToGemini(
    userMessage: string,
    conversationHistory: Message[]
): Promise<string> {
    // Use the Convex action directly via fetch
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) throw new Error("Convex URL not configured");

    const response = await fetch(`${convexUrl}/api/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            path: 'gemini:sendMessage',
            args: {
                userMessage,
                conversationHistory: conversationHistory.map(msg => ({
                    sender: msg.sender,
                    text: msg.text,
                })),
            },
        }),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Failed to call AI API: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    if (result.status === 'error') {
        throw new Error(result.errorMessage || 'Convex action failed');
    }

    return result.value ?? '';
}

export async function searchWithGrounding(
    query: string,
    language: string
): Promise<SearchResult> {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) throw new Error("Convex URL not configured");

    const response = await fetch(`${convexUrl}/api/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            path: 'gemini:search',
            args: { query, language },
        }),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Failed to call AI search: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    // Handle Convex action response format
    if (result.status === 'error') {
        throw new Error(result.errorMessage || 'Convex action failed');
    }

    const value = result.value;

    if (!value || typeof value !== 'object') {
        throw new Error('Invalid response format from search');
    }

    return {
        answer: value.answer || '',
        sources: Array.isArray(value.sources) ? value.sources : [],
        followUps: Array.isArray(value.followUps) ? value.followUps : [],
    };
}