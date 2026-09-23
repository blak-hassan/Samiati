# Performance Optimization Plan — samiati-modern

Stack: Next.js 16.3 (App Router) + React 19, Convex, Clerk, Sentry, Vercel, `@tanstack/react-virtual`, Radix, Tailwind v4. CI: `.github/workflows/ci.yml`, `.github/workflows/strix.yml`.

Goal: keep the app fast as new features land, by adopting practices and CI gates that prevent regressions rather than chasing today's hot path.

## Decisions

- **CI enforcement = "Hard failing gates"** (user-confirmed). Bundle-size budget, schema-review check, and Lighthouse CI on key routes block PRs.
- **Realtime boundary**: subscribe to the smallest Convex slice that powers the screen; never `.collect()` the whole table.
- **Lists > 50 rows**: must use `@tanstack/react-virtual` + Convex `usePaginatedQuery`.
- **Server Actions over Route Handlers** for form-driven mutations; Route Handlers reserved for webhooks / public REST / streaming.
- **Runtime default = Node**; Edge only with a written justification comment.
- **Out of scope** for this plan: semantic/vector search, locale-split bundles, custom self-hosted CDN. See §8.

## Architecture & Conventions (one-time, document in `CONTRIBUTING.md` or `docs/perf.md`)

1. Add a `docs/perf.md` capturing these rules verbatim so reviewers can link to it. Sections mirror the four areas below plus the §6 checklist.
2. Add a `perf-budget.json` at the repo root with current bundle, LCP, INP, TBT baselines and the allowed delta. Tracked in git, updated in the same PR that intentionally changes a baseline.

## Ordered Task List

### 1. Architecture (App Router, code-split, streaming)

- [ ] `src/app/**/page.tsx`: review each page; if it has both a server data fetch and a client island, split so `page.tsx` is a Server Component that streams a child `<Suspense>` boundary containing a client component.
- [ ] `src/app/**/loading.tsx`: add one per route segment that does a Convex or fetch on first paint.
- [ ] `src/components/**`: forbid feature-root barrel `index.ts` re-exports (add ESLint rule `no-restricted-syntax` matching `ExportAllDeclaration` in `src/**/index.ts`).
- [ ] Heavy client-only widgets (editor, canvas, audio visualizer): wrap with `next/dynamic({ ssr: false })` at the import site; add an ESLint rule banning the heavyweight import outside `*.client.tsx`.
- [ ] Any new Route Handler: include a 1-line `// runtime: node|edge — why: ...` comment.

### 2. Database (Convex schema & queries)

- [ ] `convex/schema.ts`: audit every `defineTable`; for every field used in a `q.eq` / `q.and` / sort, ensure a matching `.index(...)` exists. Add missing indexes in the same PR — do not ship a schema change without them.
- [ ] Grep `ctx.db.query(.*).collect()` and `ctx.db.query(.*).filter(` across `convex/**`. Each hit must be either: (a) rewritten to use an index, or (b) reduced to `.take(n)`, or (c) replaced with `paginationOpts`.
- [ ] Lists: any query that can return > 50 rows must accept `paginationOpts` and pair with `usePaginatedQuery` on the client.
- [ ] Mutations: combine related writes into a single `mutation` call; avoid re-writing whole docs when a partial update suffices.
- [ ] Long-running / third-party work: route through `convex/actions/` or `convex/crons.ts`. Add a `crons.ts` cleanup job for orphan files and expired rate-limit buckets (reuse `convex/smsRateLimit.ts` pattern).
- [ ] Webhook handlers: persist an idempotency key on first delivery; short-circuit re-deliveries.

### 3. Frontend (React 19, virtualization, assets)

- [ ] Lists: every new list component uses `useVirtualizer` from `@tanstack/react-virtual` with `getRowKey` returning the server id. Replace existing un-virtualized lists one at a time as they are touched.
- [ ] Forms: use `react-hook-form` + `zod` resolver; validate on blur/submit, not on every keystroke.
- [ ] Search inputs: debounce 250–400 ms before calling Convex; cancel in-flight on new keystroke.
- [ ] Icons: import specific paths from `lucide-react` in hot components; ban `lucide-react` barrel imports via ESLint in `src/components/**`.
- [ ] Images: every `<img>` in `src/**` is replaced with `next/image`; new external hosts are added to `next.config.ts` `images.remotePatterns` only.
- [ ] Fonts: custom fonts go through `next/font` in `src/app/layout.tsx`; no `<link>` font loads.
- [ ] `'use client'`: only at the leaf; add a CI grep that flags `page.tsx` / `layout.tsx` containing `"use client"`.
- [ ] `useEffect` audit: remove effects that only derive data; replace with render-time computation or a server query.

### 4. Backend / Server-side

- [ ] New mutations from forms → Server Action with `zod`-validated input. New public endpoints → Route Handler under `src/app/api/**/route.ts` with explicit `Cache-Control` headers.
- [ ] Cacheable GETs: set `export const revalidate = N` at the route or use `unstable_cache` with a key that excludes user identity.
- [ ] Personalized responses: never share across users at the edge; `Vary: Cookie` or per-user cache keys.
- [ ] `sentry.{client,server,edge}.config.ts`: keep `tracesSampleRate: 0.1` in prod, 1.0 in dev; tag Convex function names as transaction names.
- [ ] Rate limiting: enforce per-user / per-IP at the boundary (Server Action, webhook, Convex mutation). Cheap guard before expensive op.

### 5. Preventative CI gates (Hard failing, per user decision)

Wire into `.github/workflows/ci.yml` after the existing install/lint/test jobs; all three must pass before merge.

- [ ] **Bundle-size budget**:
  - Add `@next/bundle-analyzer` (dev dep) and an `ANALYZE=true npm run build` step in CI.
  - Add a Node step that parses `.next/analyze/*.json` and fails if any first-load JS chunk for an entry in `BUDGETED_ROUTES` (home, feed, profile, post detail) exceeds `perf-budget.json` `bundle.maxKb`.
  - PR must include the budget change if a known-good chunk grows.
- [ ] **Schema review gate**:
  - Add a CI step that detects changes under `convex/schema.ts` and posts a PR check requiring either: an `index`/`searchIndex`/`vectorIndex` added in the same diff, or a label `perf:no-schema-impact` from a CODEOWNER.
  - Implemented as a lightweight Node script in `scripts/check-schema-index.mjs` invoked from `ci.yml`; the script diffs `convex/schema.ts` and fails if queryable fields gained without a matching index entry.
- [ ] **Lighthouse CI**:
  - Add `@lhci/cli` (dev dep) and a config `.lighthouserc.cjs` that runs on the built app against routes `[/, /feed, /profile, /post/sample]`.
  - Assert: LCP ≤ budget, INP ≤ budget, TBT ≤ budget, performance score ≥ 0.9 (mobile).
  - Block PRs that breach any threshold.

### 6. Quick-wins checklist (apply on any new change touching these areas)

- Replace `.collect().filter(...)` with indexed queries
- Virtualize new lists with `usePaginatedQuery` + TanStack Virtual
- Add `paginationOpts` to any list that may exceed ~50 items
- Move heavy work into `actions` / `crons`, not mutations
- Add `<Suspense>` around any new server data fetch
- Add `Cache-Control` headers on new public Route Handlers
- Validate new Server Action / API input with `zod`
- Import icons from `lucide-react` directly
- Add an index in the same PR that adds a new queryable field
- Add Sentry tags / spans to any new long-running operation
- Update `perf-budget.json` and `docs/perf.md` when baselines shift

### 7. Validation

- After landing §1–§4 changes, re-run `npm run build` with `ANALYZE=true`; record new bundle sizes in `perf-budget.json`.
- After landing the §5 CI gates, open a sample PR that intentionally grows a chunk; confirm CI fails with an actionable message.
- After landing Lighthouse CI, capture the first green baseline; copy the four metrics into `perf-budget.json`.
- Manual smoke: home, feed (scroll 500 virtualized rows), profile, post detail — confirm no regressions in DevTools Performance trace.

### 8. Out of scope (revisit when triggered)

- Vector/semantic search (would change `convex/schema.ts` materially).
- Locale-split bundles (only if build cost or TTI by locale becomes a measured problem).
- Custom CDN (assumes Vercel edge cache; revalidate §4.2 headers if self-hosting).
- Throttling Convex subscriptions on tab hidden (only after observing realtime-cost ceiling; needs a separate plan with Sentry/Convex metrics to anchor the threshold).

## Risks

- **Bundle budget tuning**: the first enforcement pass will surface existing chunks over the new budget. Mitigation: set the budget to current + 5% on first CI run, then ratchet down over a few releases.
- **Schema-review gate false positives**: pure renames or refactors that don't add queryable fields should not be blocked. Mitigation: CODEOWNER label escape hatch, plus the script only flags *new* queryable fields without a matching index.
- **Lighthouse CI flakiness** in CI runners. Mitigation: run twice and take the median; require a 5% headroom under threshold.
- **Page-level `'use client'` check** is a coarse heuristic; rely on review for nuanced cases.
