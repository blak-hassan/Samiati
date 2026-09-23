// src/app/sitemap.ts
// Next.js App Router sitemap. Samiati's dynamic content (posts, challenges,
// communities, contributions, stories) is rendered through a single route
// per surface with the record passed via `searchParams` (JSON), not via URL
// segments — so there are no per-record URLs to enumerate. This sitemap lists
// the static, genuinely addressable routes. See docs/seo-and-performance.md.
import type { MetadataRoute } from 'next';
import { STATIC_ROUTES, absoluteUrl } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return STATIC_ROUTES.map((r) => ({
    url: absoluteUrl(r.path),
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}

export const revalidate = 86400; // daily — routes are effectively static