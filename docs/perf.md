# Performance Guide

Rules of thumb for keeping samiati-modern fast as the codebase grows. These are preventative: every item is meant to be applied _before_ a regression, not after.

Owners: engineering. Source of truth for CI gates: `perf-budget.json`, `.lighthouserc.cjs`, `scripts/check-schema-index.mjs`, `eslint.config.mjs`.

If a rule changes here, update `perf-budget.json` and link the PR in `docs/adr/`.

## 1. Architecture (App Router, code-split, streaming)

- Pages and layouts are Server Components by default. Add `"use client"` at the **leaf**, never on `page.tsx`/`layout.tsx`.
- Split data fetches from rendering. A `page.tsx` should be thin; data assembly lives in a server loader, rendering in a presentational component.
- Wrap slow data sections in `<Suspense fallback={<Skeleton/>}>`. Each boundary is its own streaming chunk.
- Use `loading.tsx` per route segment.
- Avoid `await` in a layout unless every child depends on it. Layouts compose streamed children.
- **Code-splitting**:
  - Route-level splitting is automatic in App Router. Don't import heavy client libs from `layout.tsx`.
  - Wrap heavy client-only widgets (editor, canvas, audio visualizer) with `next/dynamic({ ssr: false })`.
  - **No barrel `index.ts` re-exports under `src/**`** that re-export whole features. They pull every component into one bundle. Use deep imports (`@/features/posts/PostCard`).
- **Runtime**: default to Node. Use `export const runtime = "edge"` only for pure, latency-sensitive reads. Every Route Handler and page with a non-default runtime must include a 1-line comment `// runtime: node|edge — why: ...`.
- **Feature flags**: ship new expensive features behind a Convex-backed flag for safe rollback.

## 2. Database (Convex)

- Every queryable field needs a matching index. Add the index **in the same PR** that adds the field or the query.
- Compound index order: equality fields first, then sort fields. Example: `.index("by_community_createdAt", ["communityId", "createdAt"])`.
- Use `defineSearchIndex` for any user-facing text search. Never `filter` on strings in a query.
- `.vectorIndex` is opt-in only when semantic search is actually needed.
- **Query rules**:
  - Never `.collect()` then filter in JS. Use `q.eq(...)` / `q.and(...)` so Convex can use indexes.
  - Any list that may exceed ~50 items must accept `paginationOpts` and pair with `usePaginatedQuery` on the client.
  - Cap fan-out: a query that returns N rows and each row triggers a separate lookup is N+1. Denormalize the fields you need into the parent table.
  - `ctx.db.query(...).take(n)` only when ordering is not needed.
- **Writes**: combine related writes in a single `mutation`. Avoid re-writing whole documents when a partial update suffices.
- **Background work**: long-running / third-party calls (translate, TTS, ASR, payments webhooks) live in `convex/actions/` or `convex/crons.ts`, not mutations. `crons.ts` also cleans up orphan files and expired rate-limit buckets (see `convex/smsRateLimit.ts`).
- **Idempotency**: webhooks and inbound jobs persist an idempotency key and short-circuit on re-delivery.

## 3. Frontend (React 19, virtualization, assets)

- **Lists > 50 rows**: must use `useVirtualizer` from `@tanstack/react-virtual` with a stable `getRowKey` (server id, never array index). Pair with Convex `usePaginatedQuery`.
- **Forms**: `react-hook-form` + `zod` resolver for any non-trivial form. Validate on blur / on submit, not on every keystroke. Uncontrolled inputs avoid per-keystroke re-renders.
- **Search inputs**: debounce 250–400 ms before calling Convex; cancel in-flight on new keystroke.
- **Icons**: prefer named imports from `lucide-react` (e.g. `import { Star } from "lucide-react"`). The repo enables `experimental.optimizePackageImports: ["lucide-react"]` in `next.config.ts` so these named imports tree-shake correctly without per-icon subpath imports. The ESLint rule (`no-restricted-imports` on `lucide-react` in `src/components/**`) is a warning that points at the doc and is safe to ignore while the optimizer is on.
- **Images**: every `<img>` becomes `next/image`. New external hosts are added to `next.config.ts` `images.remotePatterns` only — never disable the restriction.
- **Fonts**: custom fonts go through `next/font` in `src/app/layout.tsx`. No `<link>` font loads.
- **Effects**: don't put data-derivation work in `useEffect`. Compute during render or in a `useMemo`/server query.
- **State placement**: lift state down. A `useState` in a parent that only one child reads forces siblings to re-render.
- **`React.memo`**: only when props are stable and the subtree is non-trivial. Measure first.
- **Animations**: prefer `transform`/`opacity`. Don't disable animations as a "perf fix".

## 4. Backend / Server-side

- **Form-driven mutations**: use Server Actions. They avoid a custom API round-trip and ship a typed RPC.
- **Route Handlers** (`src/app/api/**/route.ts`): reserved for webhooks (raw body), public REST endpoints, and streaming responses. Validate input with `zod` at the boundary.
- **Cacheable GETs**: set `export const revalidate = N` at the route, or use `unstable_cache` with a key that excludes user identity.
- **`Cache-Control`**: explicit headers on public Route Handlers (`s-maxage=60, stale-while-revalidate=300`). Personalized responses use `Vary: Cookie` or per-user cache keys — never shared.
- **Telemetry**: rely on Sentry performance traces (p95/p99) to spot regressions, not averages. Tag Convex function names as transaction names. `tracesSampleRate: 0.1` in prod, 1.0 in dev.
- **Rate limiting**: enforce per-user / per-IP at the boundary (Server Action, webhook, Convex mutation). Cheap guard before expensive op.
- **Secrets**: prefer server-only env vars. `NEXT_PUBLIC_*` only when the value must be on the client.

## 5. Quick-wins checklist (apply on any new change)

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
- Update `perf-budget.json` and this file when baselines shift

## 6. CI gates (hard failing)

The following are enforced in `.github/workflows/ci.yml` and must pass before merge:

1. **Bundle-size budget** — first-load JS for budgeted routes must not exceed `perf-budget.json: bundle.maxKb`.
2. **Schema review gate** — any change to `convex/schema.ts` that adds a queryable field must add a matching index in the same diff. Escape hatch: PR label `perf:no-schema-impact` from a CODEOWNER.
3. **Lighthouse CI** — performance score ≥ 0.9 (mobile), LCP/INP/TBT within budget on `/`, `/feed`, `/profile`, `/post/[id]`.

The first enforcement pass sets the budget to current + 5%, then ratchets down.
