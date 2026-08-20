// =============================================================================
// AI SERVICE — Client-side proxy
// =============================================================================
// Delegates to server-side Convex actions powered by
// Sunflower-Gemma4-E2B via HuggingFace Inference API.
// API key is stored securely in Convex environment variables.
// Links + images are fetched from free, keyless public APIs
// (language-specific Wikipedia + Wikimedia Commons) so search
// results always have data.
// =============================================================================

import { Message } from '@/types';

export interface SearchSource {
    title: string;
    url: string;
    snippet: string;
}

export interface SearchImage {
    title: string;
    url: string;
    thumbnail: string;
    source: string;
    width?: number;
    height?: number;
}

export interface SearchResult {
    answer: string;
    sources: SearchSource[];
    followUps: string[];
    images: SearchImage[];
}

export interface SearchAttachment {
    id: string;
    name: string;
    kind: 'doc' | 'image';
    text?: string;
}

// Language code -> Wikipedia edition. Only editions with meaningful
// local content are mapped; everything else falls back to English.
const WIKI_LANG_MAP: Record<string, string> = {
    sw: 'sw',
    ki: 'ki',
    luo: 'luo',
    en: 'en',
};

export function getWikiLangCode(code: string): string {
    return WIKI_LANG_MAP[code] ?? 'en';
}

export async function sendMessageToSunflower(
    userMessage: string,
    conversationHistory: Message[],
    accessToken?: string
): Promise<string> {
    // Use the Convex action directly via fetch
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) throw new Error("Convex URL not configured");

    const response = await fetch(`${convexUrl}/api/action`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
            path: 'sunflower:sendMessage',
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

// -----------------------------------------------------------------------------
// Links — Wikipedia search API (free, keyless, CORS-enabled, per-language)
// -----------------------------------------------------------------------------

interface WikipediaSearchItem {
    title: string;
    snippet: string;
}

function decodeHtmlEntities(text: string): string {
    return text
        .replace(/<[^>]+>/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
}

export async function fetchWikipediaLinks(query: string, lang = 'en', limit = 6): Promise<SearchSource[]> {
    const params = new URLSearchParams({ type: 'links', lang, query, limit: String(limit) });
    const response = await fetch(`/api/wiki?${params.toString()}`);
    if (!response.ok) return [];

    const data = await response.json();
    const items: WikipediaSearchItem[] = data?.query?.search ?? [];

    return items.map(item => ({
        title: item.title,
        url: `https://${lang}.wikipedia.org/wiki/${item.title.replace(/ /g, '_')}`,
        snippet: decodeHtmlEntities(item.snippet),
    }));
}

// -----------------------------------------------------------------------------
// Images — Wikimedia Commons search API (free, keyless, CORS-enabled)
// -----------------------------------------------------------------------------

interface CommonsImageInfo {
    title: string;
    url?: string;
    thumburl?: string;
    width?: number;
    height?: number;
    descriptionurl?: string;
}

interface CommonsPage {
    title: string;
    imageinfo?: CommonsImageInfo[];
}

export async function fetchCommonsImages(query: string, limit = 9): Promise<SearchImage[]> {
    const params = new URLSearchParams({ type: 'images', query, limit: String(limit) });
    const response = await fetch(`/api/wiki?${params.toString()}`);
    if (!response.ok) return [];

    const data = await response.json();
    const pages: Record<string, CommonsPage> = data?.query?.pages ?? {};

    return Object.values(pages)
        .filter(page => page.imageinfo && page.imageinfo.length > 0)
        .map(page => {
            const info = page.imageinfo![0];
            return {
                title: page.title.replace(/^File:/, '').replace(/_/g, ' '),
                url: info.descriptionurl || info.url || '',
                thumbnail: info.thumburl || info.url || '',
                source: 'Wikimedia Commons',
                width: info.width,
                height: info.height,
            };
        })
        .filter(img => img.url && img.thumbnail);
}

// -----------------------------------------------------------------------------
// Generic Convex action caller
// -----------------------------------------------------------------------------

interface ConvexActionResult {
    status: 'success' | 'error';
    value?: unknown;
    errorMessage?: string;
}

async function callConvexAction(path: string, args: Record<string, unknown>, accessToken?: string): Promise<unknown> {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) throw new Error("Convex URL not configured");

    const response = await fetch(`${convexUrl}/api/action`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ path, args }),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Failed to call Convex action: ${response.status} ${errorText}`);
    }

    const result: ConvexActionResult = await response.json();
    if (result.status === 'error') {
        throw new Error(result.errorMessage || 'Convex action failed');
    }
    return result.value;
}

// -----------------------------------------------------------------------------
// Search — answer from Convex (Sunflower), links + images in parallel
// -----------------------------------------------------------------------------

export async function searchWithGrounding(
    query: string,
    language: string,
    langCode = 'en',
    documentText = '',
    accessToken?: string
): Promise<SearchResult> {
    const wikiLang = getWikiLangCode(langCode);

    // Fetch links first so the model can cite them by number
    const links = await fetchWikipediaLinks(query, wikiLang);

    const document = documentText.trim().slice(0, 8000);

    const [value, images] = await Promise.all([
        callConvexAction('sunflower:search', { query, language, links, document }, accessToken),
        fetchCommonsImages(query).catch(() => []),
    ]);

    if (!value || typeof value !== 'object') {
        throw new Error('Invalid response format from search');
    }

    const result = value as { answer?: string; sources?: SearchSource[]; followUps?: string[] };

    return {
        answer: result.answer || '',
        sources:
            Array.isArray(result.sources) && result.sources.length > 0
                ? result.sources
                : links,
        followUps: Array.isArray(result.followUps) ? result.followUps : [],
        images,
    };
}

// -----------------------------------------------------------------------------
// ASR — Paza Whisper (Kenyan languages), TTS — Orpheus (African voices)
// -----------------------------------------------------------------------------

export async function transcribeAudioBase64(
    audioBase64: string,
    accessToken?: string
): Promise<{ text: string; error: string | null }> {
    const value = await callConvexAction('asr:transcribeAudio', { audioBase64 }, accessToken);
    if (!value || typeof value !== 'object') {
        return { text: '', error: 'ASR returned an unexpected response.' };
    }
    const result = value as { text?: string; error?: string | null };
    return { text: result.text ?? '', error: result.error ?? null };
}

export async function synthesizeSpeech(
    text: string,
    language: string,
    accessToken?: string
): Promise<{ audioBase64: string | null; contentType: string; error: string | null }> {
    const value = await callConvexAction('tts:synthesizeSpeech', { text, language }, accessToken);
    if (!value || typeof value !== 'object') {
        return { audioBase64: null, contentType: 'audio/wav', error: 'TTS returned an unexpected response.' };
    }
    const result = value as { audioBase64?: string | null; contentType?: string; error?: string | null };
    return {
        audioBase64: result.audioBase64 ?? null,
        contentType: result.contentType ?? 'audio/wav',
        error: result.error ?? null,
    };
}