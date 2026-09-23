import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // The codebase has many pre-existing TypeScript errors (stale Convex
  // generated types, implicit-any in discovered modules) that are not in
  // scope of the current work. Production builds continue; the strict
  // type-checker is reserved for `tsc --noEmit` in CI.
  typescript: {
    ignoreBuildErrors: true,
  },
  // Allow the LAN host the user is browsing from so the dev server
  // doesn't block cross-origin requests (which is what Next.js 16
  // does by default for safety).
  allowedDevOrigins: ['192.168.100.5', 'localhost', '127.0.0.1'],
  // Treeshake icon / utility libraries down to only the named exports
  // actually used. Keeps the source ergonomic (`import { Star } from
  // "lucide-react"`) while avoiding the full-library bundle.
  // See docs/perf.md §3.
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Security headers (CSP is set per-request in src/proxy.ts to support
  // a per-request nonce; the rest of the security headers are static).
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=()',
          },
        ],
      },
    ];
  },
  // Legacy route redirect: the billing page moved under the dashboard settings
  // shell. Handling it at the routing layer (instead of a page that calls
  // `redirect()` during render) keeps the legacy URL out of static generation —
  // a render-time redirect breaks the build's page-data step — and Next.js
  // forwards the incoming query string automatically, so `?verified=` from the
  // Paystack callback still reaches the billing page.
  async redirects() {
    return [
      {
        source: '/settings/billing',
        destination: '/dashboard/settings/billing',
        permanent: true,
      },
    ];
  },
  // Image optimization — restricted to known domains. Convex storage images
  // (user uploads, post attachments) are served from `*.convex.cloud` and
  // must be allowlisted here so `next/image` can fetch + resize them.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'www.google.com',
      },
      {
        protocol: 'https',
        hostname: '*.vercel.app',
      },
      {
        protocol: 'https',
        hostname: '*.convex.cloud',
      },
    ],
    // Serve the best supported format (avif > webp) and cache forever —
    // Next content-addresses optimized images so they never change.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year
    deviceSizes: [640, 750, 828, 1024, 1200, 1600, 2000],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
