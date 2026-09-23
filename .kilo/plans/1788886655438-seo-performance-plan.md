# SEO & Performance Implementation Plan

App: `samiati-modern` — Next.js 16 (App Router), React 19, Convex, Tailwind v4, Clerk auth, Vercel Analytics.
Canonical domain: `https://samiati.com`. Sitemap: dynamic (static + Convex-backed content).
Analytics: Vercel Analytics only (already consent-gated). Spam protection: Cloudflare Turnstile on contribution/contact forms.
OG image: generate from existing `public/samiati-logo.svg`.

## Repo conventions to follow
- Server Components by default; `"use client"` only at leaf components (eslint warns otherwise).
- Deep imports, no barrel `export *` under `src/**` (eslint error).
- `next/image` for all images; new external hosts only via `next.config.ts` `images.remotePatterns`.
- `react-hook-form` + `zod` for non-trivial forms; validate on blur/submit.
- Lighthouse CI gate: perf >= 0.9 mobile, LCP <= 2500ms, INP <= 200ms, TBT <= 200ms.
- Bundle budget: first-load JS <= 460kB (perf-budget.json), ratchets down.
- Convex: add index in same PR as queryable field; no `.collect()` then JS filter.

## 1. Social preview images (Open Graph tags)
Current state: `src/app/layout.tsx` has `openGraph` but **no `og:image`, no `twitter:` card, no `metadataBase`**, and the title/description are static (no per-page override path).
Steps:
1. Create `src/lib/seo.ts` exporting `SITE_URL = 'https://samiati.com'`, `SITE_NAME`, `SITE_DESC`, `TWITTER_HANDLE` ('@samiati' or '' if none), and `OG_IMAGE_PATH = '/og-image.png'`.
2. In `layout.tsx` metadata, add:
   - `metadataBase: new URL(SITE_URL)`
   - `openGraph: { images: [{ url: OG_IMAGE_PATH, width: 1200, height: 630, alt: 'Samiati' }], ... }`
   - `twitter: { card: 'summary_large_image', site: TWITTER_HANDLE, creator: TWITTER_HANDLE, images: [OG_IMAGE_PATH] }`
   - `icons: { icon: '/favicon.ico', shortcut: '/favicon-16.png', apple: '/apple-touch-icon.png' }`
3. Generate `public/og-image.png` (1200x630) from `public/samiati-logo.svg` + brand colors (#2b1e19 bg, #FFD700/#C8102E accents). Tool: `sharp` (already in node_modules? check; else `npx sharp` or Inkscape/ImageMagick). Add a `scripts/generate-og.mjs` using `sharp` so it is regenerable.
4. Per-page overrides: pages that should have unique OG images (e.g. `/pricing`, `/terms`, `/privacy`, dashboard marketing pages) can export their own `metadata` with a relative `og:image` — Next resolves it against `metadataBase`. Static marketing pages only for now; dynamic Convex content (posts) gets OG in a follow-up since it needs server-side image generation.
Best practices: absolute URLs in `metadataBase` only; keep OG image under 1200x630 (300KB); include `og:locale`; test with Facebook Sharing Debugger and Twitter Card Validator after deploy.

## 2. Adding a favicon
Current state: `src/app/favicon.ico` exists (16x16, ~1.1KB) but there are no `apple-touch-icon`, `favicon-32`, `favicon-16`, or `favicon.svg` files, and `layout.tsx` does not reference any favicon.
Steps:
1. Create `scripts/generate-favicons.mjs` using `sharp`:
   - source: `public/samiati-logo.svg` (rasterize to 512x512)
   - outputs: `public/favicon.ico` (48/32/16 multi-size), `public/favicon-32.png`, `public/favicon-16.png`, `public/apple-touch-icon.png` (180x180), `public/favicon.svg`
2. Run `node scripts/generate-favicons.mjs` once and commit the PNGs/ICO.
3. In `layout.tsx` `<head>`, add:
   - `<link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="16x16 32x32 48x48" />`
   - `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`
   - `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />`
   - `<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />`
   - `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />`
   - `<meta name="theme-color" content="#2b1e19" />` (dark brand bg; matches `.dark`)
4. Drop copies into `public/` too — Next serves `public/` statically and also serves `src/app/favicon.ico` as a route; keep both in sync (single source of truth: `public/`).
Best practices: ICO must be <= 48x48 to be universally supported; keep apple-touch-icon 180x180 (iOS only requests this size); avoid transparent backgrounds for favicons (they render black on some browsers); verify with `favicon-checker` CLI or browser dev tools.

## 3. Sitemap.xml and robots.txt
Current state: neither file exists; no `sitemap.ts`, no `robots/route.ts`. App is a SPA-ish Next App Router with ~60 routes, many under `/dashboard/*` (auth-gated) and dynamic Convex content.
Steps — sitemap:
1. Create `src/lib/seo.ts` (shared) with `SITE_URL`, `CHANGE_FREQ` enum, and a `getStaticPathsForSitemap()` helper.
2. Create `src/app/sitemap.ts` (Server Component, no `"use client"`):
   - export `export default async function sitemap()` returning an array of `SitemapEntry` objects.
   - static routes: `/`, `/pricing`, `/terms`, `/privacy`, `/forgot-password`, `/sign-in`, `/sign-up`. `lastmod: new Date()`, `changeFrequency: 'weekly'`, `priority: 1.0 for `/`, 0.8 for marketing, 0.5 for legal`.
   - dynamic routes via Convex queries (server-side, use the convex server client — NOT `convex/react`):
     - posts: `convex/posts/queries.ts` `listPublic` → `/dashboard/post/[id]`, priority 0.6
     - contributions/entries: `convex/contributions/queries.ts` → `/dashboard/submit-entry` or word-detail pages, priority 0.5
     - challenges: `convex/challenges/queries.ts` → `/dashboard/challenges/[id]`, priority 0.5
     - communities: `convex/communities/queries.ts` → `/dashboard/communities/[id]`, priority 0.5
     - stories/proverbs: `convex/...` → story-detail / proverb-detail pages, priority 0.4
   - Only include entries with a stable `_id`/slug and a real `updatedAt`/`createdAt` for `lastmod`. Exclude soft-deleted/draft records.
3. Create `src/app/sitemap.xml/route.ts` returning the same data as XML (`<?xml version="1.0" encoding="UTF-8"?>` with `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`). Set `export const revalidate = 86400`. This is the legacy path crawlers hit; `sitemap.ts` is the modern path.
4. Add the sitemap link to `layout.tsx` `<head>`: `<link rel="sitemap" type="application/xml" href="/sitemap.xml" />`.
Steps — robots.txt:
1. Create `src/app/robots/route.ts` returning `text/plain`. Base rules:
   - `User-agent: *` / `Allow: /`
   - `Disallow: /dashboard/` (auth-gated — let crawlers 401 instead of wasting crawl budget) OR `Allow: /dashboard/` if you want some public sub-pages indexed. Choose one; document it.
   - `Disallow: /api/`, `Disallow: /_next/`, `Disallow: /__clerk/`
   - `Sitemap: https://samiati.com/sitemap.xml`
2. Make rules env-driven: read `ROBOTS_DISALLOW_DASHBOARD` (default `true`) so staging can allow everything. Write to `.env.local.example`.
3. Also add a static `public/robots.txt` as a fallback for non-Next hosts (Vercel serves the route, but a static file guarantees coverage).
Best practices: sitemap < 50,000 URLs per file (add `sitemap-index.ts` if exceeded); always include `lastmod`; never include auth-required pages; validate with `xmlstarlet` / Google Search Console; set `revalidate` so it stays fresh; keep robots.txt disallow rules minimal to avoid accidentally blocking CSS/JS (which would break rendering).

## 4. Descriptive alt text for all images
Current state: audit shows ~20 `<img>` tags; many have `alt="Attachment"`, `alt={user.name}`, `alt=""` on decorative backgrounds, and `StorageImage` always passes an `alt` prop but callers often pass `"Attachment"`. `next/image` is used in `SearchResults` with real `alt={img.title}`. Background `style={{ backgroundImage }}` images have no alt (acceptable only when purely decorative).
Steps:
1. Create `scripts/check-alt-text.mjs` that parses `src/**/*.tsx` and flags every `<img>` or `<Image` without an `alt` prop, or with empty `alt=""` on non-decorative images. Run in CI as a warning.
2. Fix the offenders:
   - `StorageImage.tsx` — keep `alt` required (already); callers must supply it.
   - `PostCard.tsx` — change `alt="Attachment"` to `alt={post.caption ?? 'Post attachment'}`; `AvatarImage` already passes `alt={post.author.name}`.
   - `SettingsShell.tsx` avatar `<img alt={user.name}>` — keep, it is correct.
   - `LinkPreview.tsx`, `ContributionsScreen.tsx`, `ProjectHero.tsx` — these use CSS `backgroundImage`; mark as decorative (no alt needed) only if they carry no information. If they do (e.g. a challenge cover), replace with `<Image>` + `alt`.
   - Decorative `style={{ backgroundImage }}` — leave alt-less but add `aria-hidden="true"` on the wrapper so screen readers skip it.
3. Add `aria-hidden` to purely decorative images and never set `alt=""` on informative images.
Best practices: alt describes function, not "image of X"; keep alt text short (< 125 chars); decorative images use `alt=""` + `aria-hidden` (never `alt=" "`); test with axe (already a devDependency: `@axe-core/playwright`) — add an e2e assertion that no img lacks alt.

## 5. Image compression for web performance
Current state: `next.config.ts` has `images.remotePatterns` (Convex, Google usercontent, DiceBear, vercel.app) and `optimizePackageImports: ['lucide-react']`. Many `<img>` tags bypass Next's optimizer (StorageImage uses raw `<img>` to a Convex storage URL; several screens use `<img src={user.avatar}>`). No build-time compression script exists.
Steps:
1. Convert all `<img>` to `next/image`:
   - `StorageImage.tsx` — rewrite to use `next/image`. Problem: the Convex storage URL (`https://*.convex.cloud`) is NOT in `images.remotePatterns`. Add `https://*.convex.cloud` to `next.config.ts` `images.remotePatterns`, then use `<Image src={url} alt={alt} width={...} height={...} />`. For dynamic dimensions, use a fixed aspect-ratio container with `width`/`height` props.
   - Screens with `<img src={user.avatar}>` (DirectMessageScreen, ContactInfoScreen, NewGroupScreen, NewCommunityScreen, ValidationCard, SettingsShell, ComposePostScreen, DMListScreen, ContributionCard, CommentItem, EditProfileScreen) — replace with `<Image>` from `next/image`, adding the lh3.googleusercontent.com / dicebear hosts (already allowlisted).
2. Set Next defaults in `next.config.ts`:
   - `images.formats: ['image/avif', 'image/webp']` (Next picks the best supported).
   - `images.minimumCacheTTL: 31536000` (1 year — images are content-addressed by Next).
   - `images.deviceSizes: [640, 750, 828, 1024, 1200, 1600, 2000]` and `imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]`.
   - `images.remotePatterns` — keep the 4 existing + add `https://*.convex.cloud`.
3. Add a build-time audit script `scripts/check-image-sizes.mjs` that scans `public/` and reports files > 200KB; run in CI.
4. For user-uploaded images (ComposePost, AddContribution, TotemUploader, AlphabetCapture): compress client-side before upload using `compress.js` or `browser-image-compression` (add as dep) — target <= 200KB, max dimension 1920px. This reduces Convex storage size and bandwidth.
5. Add `loading="lazy"` (Next does this by default) and `decoding="async"` where relevant.
Best practices: never serve a 2000px image at 300px — let Next resize via the `width`/`height` props; use `placeholder="blur"` or a base64 blur-up for LCP images; keep `blurDataURL` small; run `next build` and inspect `.next/image-cache` sizes; monitor LCP in Lighthouse CI (already gated at 2500ms).

## 6. Analyzing and optimizing page load speed
Current state: `perf-budget.json` caps first-load JS at 460kB; `.lighthouserc.cjs` gates perf >= 0.9, LCP <= 2500ms, INP <= 200ms, TBT <= 200ms on `/`, `/feed`, `/profile`, `/post/[id]`; `docs/perf.md` is the source of truth; fonts load via `<link>` in `layout.tsx` (should move to `next/font`).
Steps:
1. Baseline: `npm run build && npm start` then `npx @lhci/cli autorun` (config exists). Record LCP/INP/TBT/CLS and bundle size per route.
2. Quick wins already in place: `optimizePackageImports: ['lucide-react']`, security headers, `prefetch`/`preconnect` for fonts. Do the following:
   a. Move fonts to `next/font` — create `src/app/fonts.ts` with `Outfit`, `BeVietnamPro`, `Lexend` via `next/font/google` and replace the `<link rel="stylesheet">` blocks in `layout.tsx`. This eliminates render-blocking font CSS and enables `font-display: swap` + preloading. (Note: `globals.css` references `--font-body: "Be Vietnam Pro"` — update to the generated `className`.)
   b. Defer non-critical JS: wrap heavy client widgets (audio visualizer, editor, canvas) with `next/dynamic({ ssr: false, loading: () => <Skeleton/> })`.
   c. Route-level: ensure `loading.tsx` exists per segment (App Router streams); add `<Suspense>` boundaries around slow data fetches (already done on analytics page — replicate).
   d. Code-split: verify no barrel re-exports (eslint enforces); use deep imports.
   e. Reduce unused CSS: Tailwind v4 + `@tailwindcss/postcss` should purge by default; verify via `npx tailwindcss --inspect` or build stats.
   f. Add `rel="preconnect"` only for origins actually used (keep fonts.googleapis.com + fonts.gstatic.com).
   g. Enable `next.config.ts` `experimental.optimizePackageImports` for any other heavy libs if added.
3. Monitor: add `scripts/check-bundle-budget.mjs` (exists) to CI — it parses `.next/build-manifest.json` and asserts first-load JS <= `perf-budget.json:bundle.maxKb`. Update `perf-budget.json` ratchetHistory when a baseline legitimately shifts.
4. Add Core Web Vitals tracking to Sentry (already configured) — tag Convex function names.
Best practices: measure on throttled mobile (4x CPU, 150ms RTT) not just desktop; ratchet budgets down 5-10% per release; never "fix" perf by disabling animations (use `prefers-reduced-motion`, already in globals.css); keep LCP element an `<img>` or an h1 — the hero already uses the logo + h1.

## 7. Auditing and fixing color contrast for accessibility
Current state: globals.css defines a dark theme with `--color-text-main: #FAFAF9` on `--color-background-dark: #2b1e19` (contrast ~17:1, pass) but `--color-text-muted: #A8A29E` on `--color-background-dark: #2b1e19` is ~3.4:1 (**FAILS** WCAG AA for normal text). `--color-stone-300`/`--color-stone-400` used on light surfaces may also be borderline. `@axe-core/playwright` is a devDependency but no e2e contrast assertion exists.
Steps:
1. Create `src/lib/accessibility.ts` with a `getContrastRatio(rgb1, rgb2)` and `checkContrast(fg, bg, level='AA', size='normal')` returning `{pass, ratio, recommendation}`.
2. Create `scripts/check-contrast.mjs` that:
   - reads `src/app/globals.css`, extracts every `--color-*` token in `:root` and `.dark`,
   - computes contrast of `--color-text-muted` / `--color-foreground` vs `--color-background` / `--color-card` / `--color-input`,
   - prints a table of failing pairs with the hex it should change to.
   - Fix the failing pairs (e.g. `--color-text-muted: #A8A29E` → `#B9B3AA` or darker `#9A948E` depending on target ratio; verify 4.5:1 against `#2b1e19`).
3. Add an axe e2e assertion in `tests/` or `e2e/` that runs `@axe-core/playwright` on `/` and `/pricing` and asserts no contrast violations (configure `rules: { 'color-contrast': { enabled: true } }`).
4. Audit component-level text: badges, `text-muted-foreground` class usages, placeholder text, disabled button text. Ensure `disabled` buttons use `aria-disabled` + a contrast-safe color (not just opacity).
5. Re-run axe after each change; commit the script output as a baseline.
Best practices: WCAG AA 4.5:1 for normal text, 3:1 for large text (>= 18px or >= 14px bold) and UI components; use the `color-contrast` axe rule as the gate; don't rely on opacity for disabled states (opacity < 0.4 often fails contrast); test both light and dark themes.

## 8. Mobile-first responsive design
Current state: Tailwind v4 with breakpoints `sm`/`md`/`lg`; `layout.tsx` sets `viewport` with `interactiveWidget: 'resizes-content'` (good for the chat keyboard). Most screens use `sm:`/`lg:` breakpoints and some use `md:flex` rails (SettingsShell already has a responsive rail/drawer pattern). Risk: fixed-width `max-w-7xl` containers with `px-4` are fine, but some screens may stack horizontally on small viewports.
Steps:
1. Create `scripts/check-mobile-first.mjs` using Playwright (already a devDependency) to load `/`, `/pricing`, `/forgot-password`, and one dashboard screen at 360px/414px/768px/1024px and assert: no horizontal scrollbar, tap targets >= 44x44, no text truncation, and that the primary CTA is visible without scrolling.
2. Enforce the pattern in new code:
   - Mobile layout first, then `sm:`/`md:` upgrades (never start with `lg:` and "downgrade").
   - Use `flex flex-col` + `gap-3/4` on mobile; `md:flex-row` for desktop.
   - Containers: `px-4 sm:px-6 lg:px-8` with `max-w-7xl`.
   - Touch targets: every button/link >= `min-h-11 min-w-11` (Tailwind `min-h-11`); icons get `p-2` padding.
3. Fix existing offenders found by the script:
   - SettingsShell: already mobile (drawer + top bar) — verify the rail doesn't overflow.
   - Navbar/landing: verify the hero CTA stack (`flex flex-col sm:flex-row`) and that the trust strip (`grid-cols-2 sm:grid-cols-4`) is readable at 320px.
   - Forms: `Input` is `h-12` (good); ensure labels are above inputs (`flex flex-col`), not side-by-side.
4. Add `viewport` meta already present — keep `width=device-width, initial-scale=1` (Next injects this). The `interactiveWidget: 'resizes-content'` must stay for the chat input.
5. Test with Chrome DevTools device mode + `@axe-core/playwright` on mobile (a11y and contrast both re-checked).
Best practices: test at 320px (not just 375px); use `min-h-screen` not fixed heights; avoid `overflow: hidden` on body on mobile; prefer CSS grid with `auto-fill` over fixed columns; never hide content behind "see more" on mobile unless the target is genuinely off-screen.

## 9. Custom 404 error page
Current state: `src/app/error.tsx` (client route errors) and `src/app/global-error.tsx` (root-level errors) exist, but **no `not-found.tsx`** — so Next's default 404 is served for unknown routes. `proxy.ts` calls `notFound()` in two places.
Steps:
1. Create `src/app/not-found.tsx` (Server Component — no `"use client"`):
   - return a branded 404 matching the landing page visual language: `#main` landmark, h1 "Page not found", short copy, primary CTA `<Link href="/">` → "Back to home", secondary CTA to search or dashboard if authenticated.
   - Include a `<script type="application/ld+json">` JSON-LD `BreadcrumbList` and a `meta name="robots" content="noindex, follow" />` (404 pages should not be indexed).
   - Use the existing `SamiatiLogo` and `Button` components; keep it lightweight (no client JS — it's a Server Component).
2. Wire it: Next automatically uses `not-found.tsx` when `notFound()` is called or a dynamic segment misses. Verify the two existing `notFound()` calls in `src/app/auth/[slug]/page.tsx:25` and `src/app/dashboard/[slug]/page.tsx:98` render it.
3. Add an e2e test (`e2e/not-found.spec.ts`) using Playwright: navigate to `/this-route-does-not-exist`, assert status 404, heading "Page not found", and a working home link.
4. Optionally add `src/app/not-found.css` or reuse globals; ensure the page still has the root layout's `<head>` (it does — Next wraps `not-found.tsx` in the nearest layout).
Best practices: return a real 404 status (Next does this automatically for `not-found.tsx`); never redirect 404 to `/` (confuses crawlers and users); keep `noindex` robots meta; keep the component server-rendered for speed; include a search box or site-map link to help users recover.

## 10. Identifying and fixing broken links
Current state: ~60 app routes; links use `next/link`; no link audit script exists. `proxy.ts` protects everything except public routes, so internal links to `/dashboard/*` 401 for guests (expected).
Steps:
1. Create `scripts/check-broken-links.mjs`:
   - Build the app: `npm run build` (produces `.next/build-manifest.json` with all rendered routes).
   - Collect every `<a href>` from `src/**/*.tsx` (static routes) and every dynamic route param from `generateStaticParams`-style pages.
   - Spin up `npm start` and `fetch()` each internal URL, asserting 2xx. Follow redirects and assert final status is 2xx (not a 404/500).
   - Report any 404/500 with the referring link.
2. Fix the offenders the script finds. Common patterns to check:
   - Footer links: `/pricing`, `/terms`, `/privacy` — verify these routes exist (they do: `src/app/pricing/page.tsx`, `src/app/terms/page.tsx`, `src/app/privacy/page.tsx`).
   - `CookieSettingsLink` → opens the consent modal (not a route) — ensure it is not an `<a href>`.
   - SettingsShell footer links to `/terms`, `/privacy` — fine.
   - Any link to `/dashboard/[slug]` where slug is a Screen enum — verify the route exists.
3. Add a client-side `BrokenLinkReporter` (`src/components/shared/BrokenLinkReporter.tsx`): a `useEffect` that monkey-patches `window.fetch` and `XMLHttpRequest` to log 4xx/5xx responses (with route + status) to Sentry via `Sentry.captureMessage` or a custom endpoint. Mount it once in `layout.tsx` behind the analytics consent gate (or always, since it's error telemetry not analytics).
4. Add a Playwright e2e (`e2e/links.spec.ts`) that crawls `/` and follows every same-origin link up to depth 2, asserting no 404.
Best practices: run the link check after every build in CI; distinguish "broken" (404) from "auth-gated" (401/302 to sign-in) — treat auth-gated links as OK if they redirect to `/sign-in`; never link to `/api/...` from client (those are server-only); keep the client reporter silent in dev (it floods the console).

## 11. Client-side and server-side form validation
Current state: `src/lib/schemas.ts` has 8 zod schemas; `react-hook-form` + `zodResolver` is used in `forgot-password/page.tsx`, `ReportModal.tsx`, `ComposePostScreen.tsx`, `AddContributionScreen.tsx`. Server-side: Convex mutations validate via `convex/lib/validation.ts` and `convex/changa/validators.ts`. Gap: no dedicated contribution/contact forms exist yet; the reset-password code step uses uncontrolled `useState` inputs (no zod).
Steps:
1. Client-side (react-hook-form + zod):
   - Create `src/components/forms/ContributionForm.tsx` and `src/components/forms/ContactForm.tsx` using `useForm({ resolver: zodResolver(schema) })`.
   - Define schemas in `src/lib/schemas.ts`: `contributionFormSchema` (type, input1, input2, context, tags — mirror `contributionSchema` but for the public-facing form) and `contactFormSchema` (name, email, message).
   - Show errors inline under each field (`{errors.field.message}`), validate on blur (`mode: 'onBlur'`) plus submit; disable the submit button while `isSubmitting`.
   - Use the existing `Input`, `Label`, `Button`, `Textarea` UI components.
2. Server-side:
   - For each form, create a Server Action or Route Handler that re-validates with zod at the boundary (never trust the client). Example for contribution: `src/app/actions/contribute.ts` exporting `export async function submitContribution(prevState, formData)` — re-parse with zod, then call the Convex mutation.
   - Rate-limit the action (see item 12) and require Turnstile.
   - Return a `{ ok: true }` or `{ error: '...' }` and use `useTransition` for pending state.
3. Fix the forgot-password reset step: move `code` and `newPassword` into a zod schema `resetPasswordSchema = z.object({ code: z.string().min(1, 'Code is required'), newPassword: z.string().min(8, 'Password must be at least 8 characters') })` and use `useForm` instead of uncontrolled state.
4. Add unit tests (`tests/forms/contribution.test.ts`) with vitest: render the form, type invalid email, assert error appears; submit valid data and assert `onSubmit` called.
Best practices: always re-validate server-side even if client validation passed; use `zod`'s `.superRefine` for cross-field rules; never disable the submit button as the only validation (screen readers can't read it) — show inline errors + `aria-live="polite"` on the error list; keep forms uncontrolled (register props) to avoid per-keystroke re-renders.

## 12. Spam protection for web forms (Cloudflare Turnstile)
Current state: no CAPTCHA/Turnstile anywhere. Public forms that can receive spam: contribution submission (`AddContributionScreen`), contact (none yet — create), report (`ReportModal`), comment, post compose. Auth forms (Clerk) are out of scope.
Steps:
1. Add env vars to `.env.local.example`: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`. Register two domains at https://www.cloudflare.com/turnstile/ (use "Non-interactive" / managed mode, no score threshold needed).
2. Create `src/components/turnstile/TurnstileProvider.tsx` — a context provider that loads the Turnstile script (`https://challenges.cloudflare.com/turnstile/v0/api.js`) once, exposes `isReady`, and wraps children. Keep it lazy (dynamic import or `next/script` with `strategy="afterInteractive"`).
3. Create `src/components/turnstile/TurnstileWidget.tsx` — renders `<div class="cf-turnstile" data-sitekey="...">`, calls `window.turnstile.render(el, { callback: (token) => onChange(token), theme: 'dark' })`, exposes a `getToken()` promise. Make it a client component.
4. Integrate into forms:
   - `ContributionForm.tsx`: add the widget above the submit button; require `turnstileToken` non-empty before submit; on submit, send `turnstileToken` in the FormData to the Server Action.
   - `ContactForm.tsx`: same pattern.
   - `ReportModal.tsx`: add the widget (it's already a modal — keep it inside the modal).
5. Server-side verification: in the Server Action / Route Handler, POST `https://challenges.cloudflare.com/turnstile/v0/siteverify` with `{ secret: TURNSTILE_SECRET_KEY, response: token }` using `fetch`. Require `success === true` AND (optionally) `hostname` matches your domain. On failure, return a 4xx with a generic "Submission could not be completed" message (don't reveal why — avoids attacker probing).
6. Defense-in-depth (keep even if Turnstile is bypassed):
   - Add `src/lib/rateLimit.ts`: an in-memory sliding-window limiter keyed by IP (dev) + a Convex-backed limiter (`convex/lib/rateLimit.ts` already exists — reuse) keyed by Clerk user id or IP hash. Apply to the contribute/contact actions: e.g. 10 submissions / hour per user.
   - Honeypot field: add a hidden field `website` to the form (CSS `display: none`, not `visibility: hidden`); reject if filled.
   - Server-side zod re-validation (item 11).
7. Test: unit test that a submit without a token is rejected; e2e test that the form renders the widget and submits successfully in a real browser (Playwright can't solve Turnstile in CI — use the "Testing" mode with `data-sitekey` = test key that always passes, gated by env).
Best practices: never rely on client-side Turnstile alone — always verify server-side with the secret key; use the test keys (`1x00000000000000000000AA` / `3x00000000000000000000AB`) only in non-production; set `expiration` handling so a stale token is rejected; keep the widget out of the Clerk auth forms (they manage their own bot detection).

## 13. Setting up web analytics (Vercel Analytics, consent-gated)
Current state: `@vercel/analytics` is a dependency; `ConsentAnalyticsGate` (`src/components/cookie-consent/ConsentAnalyticsGate.tsx`) conditionally renders `<Analytics>` only after `consent.analytics` is true, with a `beforeSend` hard gate. `CookieConsentProvider` already stores `analytics`/`marketing`/`necessary` and supports GPC. This item is mostly complete — the work is hardening and event instrumentation.
Steps:
1. Verify the gate works: in the browser, open DevTools → Application → Local Storage (`samiati_cookie_consent_v1`), set `analytics: false`, reload, and confirm no `/_vercel/insights` request is made. Then set `analytics: true` and confirm the request fires. Add this as a vitest unit test in `tests/cookie-consent.test.ts` mocking `@vercel/analytics/react`.
2. Instrument business events: Vercel Analytics exposes `track(event, properties)`. Import `import { track } from '@vercel/analytics'` (or `@vercel/analytics/react`) and add events that matter for SEO/perf:
   - `page_view` (automatic, but add `path` + `title` via the `Analytics` `mode` if needed).
   - `cta_click` with `{ location: 'hero|pricing|final-cta', plan }` — needed for item 14.
   - `form_submit` with `{ form: 'contribution|contact|report|reset_password', success: true|false }`.
   - `search_query` with `{ query, results_count }` (HomeSearchScreen).
   - `error_boundary` with `{ digest }` (global-error.tsx).
3. Add a custom dashboard goal: in Vercel Analytics, create a "Signed-up user" goal triggered by a `signup_complete` event (sign-up page) and a "Contribution submitted" goal. These tie SEO traffic to conversions.
4. Privacy: confirm the gate is the only path that loads the script (it is — `ConsentAnalyticsGate` is mounted at the bottom of `layout.tsx`); confirm `beforeSend` drops events if consent is withdrawn after load (it does). Add a test that `beforeSend` returns null when `consent.analytics` flips to false.
5. Optional GA4: out of scope per decision — document in `docs/seo-and-performance.md` how to add it later via `@next/google-analytics` behind the same gate.
Best practices: never load analytics scripts inline in `layout.tsx` before consent (violates GDPR/ePrivacy); use the existing `useSyncExternalStore` server/client snapshot pattern to avoid hydration mismatch; keep `track` calls in try/catch; don't track PII (email, message content) — only event names + non-identifying properties.

## 14. Optimizing page layout for a single, clear Call to Action
Current state: the home page (`src/app/page.tsx`) has **two** primary buttons in the hero (`Start Learning Free` + `See Pricing`) plus a "Final CTA" section and pricing cards each with their own CTA. The pricing page has 3 plan cards each with a CTA. The intent is one primary CTA per page; secondary actions should be text/ghost links.
Steps — home page:
1. Hero: keep exactly one `<Button size="lg" asChild>` primary CTA → `/sign-up` ("Start Learning Free"). Demote `See Pricing` to `<Button variant="outline" size="lg" asChild>` (already is — keep it as the single secondary). Remove the trust-strip checkmarks as "secondary CTAs" (they are not buttons).
2. Pricing section: each card keeps its own CTA (this is a comparison table — multiple CTAs are acceptable here because they are the same action with different plans). To satisfy "single CTA", add a single sticky bottom bar on mobile that says "Choose a plan" and anchors to the first card.
3. Final CTA section: keep one CTA ("Get Started Free") — already the case. Do not add a second button.
4. Visual hierarchy: the primary CTA must be the largest, highest-contrast, first-focusable element after the headline. Use `bg-primary` (brand orange) with white text; secondary uses `border` + transparent bg. Add `aria-label` on icon-only CTAs.
5. Track: add `track('cta_click', { location: 'hero', plan: 'free' })` to the primary button (item 13).
Steps — settings / dashboard pages:
1. SettingsShell: the user card button and nav items are navigation, not CTAs. The single action CTA should be "Sign out" (already a ghost button) or the account action. Ensure no page renders more than one filled (primary-colored) button.
2. AnalyticsScreen: the only action is "goBack" — demote to an outline button; no primary CTA needed.
Steps — forms:
1. Every form (ContributionForm, ContactForm, ReportModal, forgot-password) must have exactly one submit button of type `submit` with `variant="default"`; all other buttons are `variant="outline"` or `variant="ghost"`.
2. Disable the submit button while `isSubmitting` and show a spinner; never disable it as the only validation signal (item 11).
Best practices: use the "1-3 CTA rule" — one primary per viewport, at most one per section; primary = filled brand color, secondary = outline, tertiary = text link; never use two filled buttons in the same row; test with a screen reader that the primary button is announced first; verify contrast of the primary CTA bg vs its text (brand orange #C8102E on white = ~4.9:1, pass; on dark bg use the same); run a quick heatmap/scroll-map after launch to confirm the CTA is reached.

## Rollout order (dependency-sorted)
1. **Foundation (no runtime risk)**: favicon set, OG image, `src/lib/seo.ts`, `layout.tsx` metadata, `public/robots.txt`, `src/app/robots/route.ts`, `src/app/sitemap.ts`, `src/app/sitemap.xml/route.ts`, `src/app/not-found.tsx`.
2. **Images & perf**: `next.config.ts` image config + `*.convex.cloud` remotePattern, migrate `StorageImage` and raw `<img>` to `next/image`, fonts → `next/font`, then re-run LHCI baseline.
3. **Accessibility**: `check-contrast.mjs`, fix `--color-text-muted`, axe e2e assertions, `check-mobile-first.mjs`.
4. **Forms & spam**: schemas, `ContributionForm`/`ContactForm`, Turnstile widget + provider, Server Actions with server-side zod + Turnstile verify + rate limit.
5. **Analytics hardening**: consent-gate tests, event instrumentation, Vercel goals.
6. **CTA cleanup**: home/pricing/settings/forms single-CTA pass.
7. **Monitoring**: `check-broken-links.mjs`, `BrokenLinkReporter`, `check-alt-text.mjs`, link crawler e2e.

## Validation checklist (run before considering done)
- `npm run build` succeeds; `npm run lint` clean; `npm run test` (vitest) + `npm run test:e2e` (playwright) green.
- `npx @lhci/cli autorun` on `/`, `/feed`, `/profile`, `/post/[id]`: perf >= 0.9, LCP <= 2500, INP <= 200, TBT <= 200.
- `node scripts/check-broken-links.mjs` reports 0 broken internal links.
- `node scripts/check-contrast.mjs` reports 0 failing pairs.
- `node scripts/check-alt-text.mjs` reports 0 missing alt.
- `node scripts/check-mobile-first.mjs` passes at 320/360/414/768/1024.
- Manual: Facebook Sharing Debugger + Twitter Card Validator show the OG image; browser tab shows the favicon; `/sitemap.xml` and `/robots.txt` return 200 with correct content; `/nope` returns the branded 404; DevTools → disable analytics consent → no `/_vercel/insights` requests; enable → requests fire.
- `perf-budget.json` first-load JS still <= 460kB; update `ratchetHistory` if a baseline legitimately moved.

## Open items / decisions deferred
- Per-page OG images for dynamic Convex content (posts) — needs server-side image generation; defer.
- GA4 — explicitly out of scope (Vercel Analytics only).
- `metadata.json` `requestFramePermissions: ["microphone"]` is a PWA manifest fragment; the app has no `manifest.json` or service worker, so it has no effect. Decide whether to ship a real PWA manifest (adds `apple-touch-icon`/`theme-color` relevance) or remove the file.
- The existing `src/app/favicon.ico` (16x16, in `src/app/`) will be superseded by the generated `public/favicon.ico`; remove the stale one after generation to avoid two favicon routes.

## File plan
| File | Action |
|---|---|
| `src/lib/seo.ts` | create shared constants (SITE_URL, OG path, sitemap helpers) |
| `src/lib/accessibility.ts` | create contrast checker |
| `src/lib/rateLimit.ts` | create in-memory limiter (reuse `convex/lib/rateLimit.ts` for prod) |
| `src/app/layout.tsx` | add og:image, twitter card, apple-touch-icon, favicon links, theme-color, metadataBase, sitemap link, mount BrokenLinkReporter |
| `src/app/fonts.ts` | create `next/font` families |
| `src/app/not-found.tsx` | create branded 404 |
| `src/app/sitemap.ts` | create (static + dynamic Convex routes) |
| `src/app/sitemap.xml/route.ts` | create legacy XML alias, `revalidate = 86400` |
| `src/app/robots/route.ts` | create dynamic rules from env |
| `src/app/actions/contribute.ts` | create turnstile-gated + zod-validated Server Action |
| `src/app/actions/contact.ts` | create turnstile-gated + zod-validated Server Action |
| `src/components/turnstile/TurnstileProvider.tsx` | create |
| `src/components/turnstile/TurnstileWidget.tsx` | create |
| `src/components/forms/ContributionForm.tsx` | create turnstile + rhf + zod |
| `src/forms/ContactForm.tsx` | create turnstile + rhf + zod |
| `src/components/shared/BrokenLinkReporter.tsx` | create |
| `src/components/structured-data/StructuredDataProvider.tsx` | create JSON-LD provider |
| `src/components/shared/Image.tsx` | create `next/image` wrapper enforcing alt |
| `src/components/shared/StorageImage.tsx` | migrate to `next/image` |
| `src/lib/schemas.ts` | add `contributionFormSchema`, `contactFormSchema`, `resetPasswordSchema` |
| `src/components/ui/button.tsx` | add `focus-visible` + `aria-disabled` styles |
| `src/app/globals.css` | fix `--color-text-muted` contrast |
| `next.config.ts` | add `images.formats`, `minimumCacheTTL`, `deviceSizes`, `imageSizes`, `*.convex.cloud` remotePattern |
| `public/og-image.png` | create 1200x630 from samiati-logo.svg |
| `public/favicon.ico`, `public/favicon-32.png`, `public/favicon-16.png`, `public/apple-touch-icon.png`, `public/favicon.svg` | create |
| `public/robots.txt` | create static fallback |
| `scripts/generate-favicons.mjs` | create |
| `scripts/generate-og.mjs` | create |
| `scripts/check-alt-text.mjs` | create |
| `scripts/check-image-sizes.mjs` | create |
| `scripts/check-contrast.mjs` | create |
| `scripts/check-broken-links.mjs` | create |
| `scripts/check-mobile-first.mjs` | create |
| `tests/cookie-consent.test.ts` | create consent-gate unit tests |
| `tests/forms/contribution.test.ts` | create form validation tests |
| `e2e/not-found.spec.ts` | create 404 e2e |
| `e2e/links.spec.ts` | create link crawler e2e |
| `docs/seo-and-performance.md` | create runbook |
| `.env.local.example` | add TURNSTILE + APP_URL vars |
| `perf-budget.json` | add `lcpMs: 2500` |