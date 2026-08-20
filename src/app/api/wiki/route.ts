import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

const WIKI_BASE: Record<string, string> = {
    links: 'https://{lang}.wikipedia.org/w/api.php',
    images: 'https://commons.wikimedia.org/w/api.php',
};

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const MAX_QUERY_LENGTH = 200;
const MAX_LIMIT = 50;
const WIKI_WINDOW_MS = 60 * 1000;
const WIKI_MAX_PER_MINUTE = 120;

function clientIp(req: NextRequest): string {
    const fwd = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    return fwd || 'unknown';
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const lang = searchParams.get('lang') ?? 'en';
    const query = searchParams.get('query');
    const limit = searchParams.get('limit');

    if (!type || !query) {
        return NextResponse.json({ error: 'Missing type or query' }, { status: 400 });
    }
    if (query.length > MAX_QUERY_LENGTH) {
        return NextResponse.json({ error: `Query too long (max ${MAX_QUERY_LENGTH})` }, { status: 400 });
    }
    // Only well-formed, short Wikipedia edition codes may reach the host
    // template; anything else is rejected before it touches the URL.
    if (!/^[a-z]{2,10}$/.test(lang)) {
        return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }
    if (limit && (!/^\d+$/.test(limit) || parseInt(limit, 10) < 1 || parseInt(limit, 10) > MAX_LIMIT)) {
        return NextResponse.json({ error: `Limit must be 1-${MAX_LIMIT}` }, { status: 400 });
    }

    // Public route — bound abuse with a per-IP sliding window backed by the
    // Convex rateLimits table (same counter the rest of the app uses).
    if (CONVEX_URL) {
        try {
            const convex = new ConvexHttpClient(CONVEX_URL);
            const result = await convex.mutation(api.wiki.check, {
                bucket: clientIp(req),
                windowMs: WIKI_WINDOW_MS,
                maxRequests: WIKI_MAX_PER_MINUTE,
            });
            if (!result.allowed) {
                return NextResponse.json({ error: 'Too many requests. Please slow down.' }, {
                    status: 429,
                    headers: { 'Retry-After': String(Math.ceil(result.retryAfterMs / 1000)) },
                });
            }
        } catch {
            // Rate limiting must not break the feature; fall back to open access.
        }
    }

    let url: string;
    const params = new URLSearchParams({ format: 'json' });

    if (type === 'links') {
        params.set('action', 'query');
        params.set('list', 'search');
        params.set('srsearch', query);
        if (limit) params.set('srlimit', limit);
        url = WIKI_BASE.links.replace('{lang}', lang);
    } else if (type === 'images') {
        params.set('action', 'query');
        params.set('generator', 'search');
        params.set('gsrsearch', query);
        params.set('gsrnamespace', '6');
        params.set('prop', 'imageinfo');
        params.set('iiprop', 'url|extmetadata');
        params.set('iiurlwidth', '480');
        if (limit) params.set('gsrlimit', limit);
        url = WIKI_BASE.images;
    } else {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const res = await fetch(`${url}?${params.toString()}`, {
        // Wikipedia's API rejects requests without a descriptive UA (403).
        headers: {
            'User-Agent': 'Samiati/1.0 (https://samiati-10.vercel.app; educational African languages assistant)',
            'Api-User-Agent': 'Samiati/1.0',
        },
    });
    if (!res.ok) {
        if (res.status === 429 || res.status === 403) {
            return NextResponse.json({ error: `Upstream ${res.status} — retry later` }, { status: 503 });
        }
        return NextResponse.json({ error: `Upstream ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
}