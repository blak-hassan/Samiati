# SEO & Performance — runbook

Canonical domain: `https://samiati.com`. This doc is the source of truth for
the SEO + performance work in `.kilo/plans/1788886655438-seo-performance-plan.md`.

## Automated checks (run in CI + locally before every PR)

| Script | What it asserts |
|---|---|
| `node scripts/check-contrast.mjs` | 0 WCAG AA contrast failures across `globals.css` tokens |
| `node scripts/check-alt-text.mjs` | 0 `<img>`/`<Image>` missing `alt` |
| `node scripts/check-broken-links.mjs` | 0 broken internal links (builds + starts the prod server) |
| `npx @lhci/cli autorun` | perf >= 0.9, LCP <= 2500, INP <= 200, TBT <= 200 on `/`, `/feed`, `/profile`, `/post/[id]` |
| `node scripts/check-bundle-budget.mjs` | first-load JS <= `perf-budget.json:bundle.maxKb` |
| `npm run test` (vitest) + `npm run test:e2e` (playwright) | unit + e2e green |

## Favicon / OG
- Regenerate: `node scripts/generate-favicons.mjs` (source: `public/favicon-source.svg`).
- Layout references: `favicon.ico`, `favicon-48/32/16.png`, `apple-touch-icon.png`,
  `favicon.svg`, `og-image.png` (1200x630). All live in `public/`.
- Verify: browser tab icon, Facebook Sharing Debugger, Twitter Card Validator.

## Sitemap / robots
- `src/app/sitemap.ts` — Next App Router sitemap (static routes; dynamic
  content is rendered via `searchParams`, not URL segments, so there are no
  per-record URLs). Emits `/sitemap.xml`.
- `src/app/robots/route.ts` — dynamic rules; `ROBOTS_DISALLOW_DASHBOARD=false`
  in staging to allow the app shell.
- Static fallback: `public/robots.txt`.

## Images
- All images go through `next/image`. `StorageImage` is the wrapper for Convex
  storage uploads; the Convex host is allowlisted in `next.config.ts`.
- `next.config.ts` sets `formats: ['image/avif','image/webp']`,
  `minimumCacheTTL: 31536000`, `deviceSizes`, `imageSizes`.
- Fonts moved to `next/font` (`src/app/fonts.ts`); Material Symbols stylesheet
  kept but preloaded so it doesn't block the first paint.

## Forms & spam
- `src/components/forms/ContributionForm.tsx` + `ContactForm.tsx` — rhf + zod,
  honeypot, Turnstile widget, `useTransition` Server Actions.
- `src/app/actions/contribute.ts` + `contact.ts` — re-validate server-side,
  verify Turnstile via `/siteverify`, rate-limit per IP (`src/lib/rateLimit.ts`).
- Turnstile env: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.
- Test keys (`1x00000000000000000000AA` / `3x00000000000000000000AB`) only in
  non-production; the server fails closed when the secret is missing in prod.

## Analytics
- Vercel Analytics only, behind `ConsentAnalyticsGate` (renders `<Analytics>`
  only after `consent.analytics`, with a `beforeSend` hard gate).
- Verify: set `analytics: false` in `samiati_cookie_consent_v1` → no
  `/_vercel/insights` requests; set `true` → requests fire.
- Events: `cta_click`, `form_submit`, `search_query`. Never log PII.

## Accessibility
- `src/lib/accessibility.ts` — WCAG contrast helpers (pure, Node + browser).
- `e2e/mobile-first.spec.ts` — axe + layout assertions at 320/360/414/768px.
- `e2e/not-found.spec.ts` — branded 404.
- `e2e/links.spec.ts` — link crawler (added in follow-up).

## Open items
- Per-page OG images for dynamic Convex content (posts) — needs server-side
  image generation; deferred.
- GA4 — explicitly out of scope (Vercel Analytics only).
- `metadata.json` is a PWA manifest fragment but the app has no manifest or
  service worker. Ship a real manifest or remove the file.