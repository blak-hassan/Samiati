// src/app/robots/route.ts
// Dynamic robots.txt. The static fallback lives at public/robots.txt;
// this route is authoritative and lets staging override the dashboard
// disallow via ROBOTS_DISALLOW_DASHBOARD=false.
import { NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/seo';

export const revalidate = 86400;

export function GET() {
  const disallowDashboard =
    process.env.ROBOTS_DISALLOW_DASHBOARD !== 'false';

  const lines: string[] = [
    'User-agent: *',
    'Allow: /',
    '',
    'Disallow: /api/',
    'Disallow: /_next/',
    'Disallow: /__clerk/',
  ];

  if (disallowDashboard) {
    // The app shell is auth-gated. Let crawlers request it and receive a
    // 401 instead of wasting crawl budget on pages they cannot render.
    lines.push('Disallow: /dashboard/');
  }

  lines.push(`Sitemap: ${SITE_URL}/sitemap.xml`);

  return new NextResponse(lines.join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}