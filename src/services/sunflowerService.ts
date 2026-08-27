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