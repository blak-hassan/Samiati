// src/lib/seo.ts
// Shared SEO constants and helpers. Import from layout.tsx, sitemap.ts,
// robots/route.ts, and any page that needs canonical URLs.

export const SITE_URL = 'https://samiati.com';
export const SITE_NAME = 'Samiati';
export const SITE_DESCRIPTION =
  'Explore, learn, and contribute to African language preservation with AI-powered chat, voice messages, and community challenges.';
export const SITE_LOCALE = 'en_US';
export const TWITTER_HANDLE = '@samiati'; // set once the handle is confirmed
export const OG_IMAGE_PATH = '/og-image.png';
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export const STATIC_ROUTES = [
  { path: '/', changeFrequency: 'weekly' as const, priority: 1.0 },
  { path: '/pricing', changeFrequency: 'monthly' as const, priority: 0.8 },
  { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.3 },
  { path: '/forgot-password', changeFrequency: 'yearly' as const, priority: 0.3 },
  { path: '/sign-in', changeFrequency: 'yearly' as const, priority: 0.3 },
  { path: '/sign-up', changeFrequency: 'yearly' as const, priority: 0.5 },
  { path: '/about', changeFrequency: 'monthly' as const, priority: 0.6 },
  { path: '/faq', changeFrequency: 'monthly' as const, priority: 0.6 },
  { path: '/languages', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/languages/kikuyu', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/languages/dholuo', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/languages/kalenjin', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/languages/luhya', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/languages/kamba', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/languages/somali', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/languages/swahili', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/languages/sheng', changeFrequency: 'monthly' as const, priority: 0.7 },
] as const;

export type ChangeFrequency = (typeof STATIC_ROUTES)[number]['changeFrequency'];

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}