# Discover — Pre-Launch Implementation Plan

**Scope:** make `/dashboard/discover` launch-safe (correct, secure, accessible, fast, measurable) and wire it into the Samiati AI funnel.
**Source documents:**
- `Samiati_Pre_Launch_Implementation_Plan.md` — §3.4 server-side validation, §3.5 rate limiting, §4.3 moderation, §6 SEO, §7 accessibility/mobile, §8 reliability, §9 performance, §10 analytics, §15 P0/P1/P2.
- Supersedes `.kilo/plans/1788090020188-discover-page-analysis.md` (its Tasks 1–5 are ~70% landed; its four open questions are answered with evidence in §3 below).

**Conventions this plan follows:** Convex mutations guard identity via `ctx.auth.getUserIdentity()` + `users.by_clerkId`; server rate limits via `convex/lib/rateLimit.ts#checkRateLimit`; toasts via `src/hooks/useToast.tsx` (already mounted in `src/app/layout.tsx:139`); analytics via `src/lib/analytics.ts#trackEvent`; gates via `scripts/check-*.mjs` + `.github/workflows/ci.yml`.

---

## 1. Current Implementation Map (verified on disk)

| Layer | File | What it does |
|---|---|---|
| Entry point (only one) | `src/components/screens/HomeSearchScreen.tsx:563-574` | Compass icon in the chat header, rendered only when `user` is truthy |
| Route | `src/app/dashboard/discover/page.tsx` | `"use client"`, renders `DiscoverScreen` with `navigate` |
| Nav mapping | `src/hooks/useNavigation.ts:88` | `Screen.DISCOVER → /dashboard/discover` |
| Screen | `src/components/screens/DiscoverScreen.tsx` (258 lines) | Tabs, feed accumulation, 3 mutations, refresh, load-more |
| Card | `src/components/discover/DiscoverCard.tsx` (272 lines) | Badges, image, title/summary/whyTrending, save/share/dismiss, local toast |
| Read API | `convex/discover/feed.ts:9-101` | `getFeed`, `getCluster`, `getTrending`, `getCategoryCounts` |
| Write API | `convex/discover/feed.ts:104-217` | `trackEngagement`, `saveTopic`, `dismissTopic`, `getSavedTopics` |
| Ingest | `convex/discover/sources.ts` | 8 Kenyan RSS feeds + GDELT; `classifyCategory`, `extractCountry`, `extractCounty`, `getSourceReputation` (pure fn) |
| Normalize/dedup | `convex/discover/process.ts` | `fetchAndStore`, `processRawItems`, legacy `clusterItems`, `archiveOldItems` |
| Cluster (live) | `convex/discover/cluster.ts` | `embedRawItems` (HF MiniLM 384d via AI router) + `clusterByEmbedding` (vector search, 0.78 cosine) |
| Enrich | `convex/discover/enrich.ts` | `enrichClusters`, `computeTrendScores` |
| Schedule | `convex/crons.ts:47-77` | fetch+process /15m, cluster+enrich /30m, trend scores /60m, cleanup daily 03:00 UTC |
| Schema | `convex/schema.ts:947-1038` | `discoverRawItems`, `discoverItems` (+vector index), `discoverClusters`, `discoverEngagement`, `discoverUserInterests`, `discoverSourceReputation` |
| Reaching chat | `src/app/dashboard/page.tsx:20,117` → `HomeSearchScreen.tsx:127-139` | `?q=` → `initialQuery` → auto-search. Fully built, nothing triggers it. |

**Pipeline today:** `sources → process(fetchAndStore, processRawItems) → cluster(embed, clusterByEmbedding) → enrich(summary, trendScore) → feed(getFeed) → DiscoverScreen`.

---

## 2. Findings (evidence-backed)

### F-01 — P0 — The Discover → Chat "explore" funnel is dead code
`DiscoverCard.tsx:95-97` defines `handleExplore` → `onExplore(cluster.suggestedQuery, cluster._id)`, and `DiscoverScreen.tsx:94-100` implements it (`trackEngagement("explore")` + `navigate(Screen.HOME_CHAT, { q: query })`). **Nothing calls it.** The card's only `onClick` handlers are `handleSave` (`:235`), `handleShare` (`:247`), `handleDismiss` (`:256`); the root `<div>` (`:144`) has no `onClick`, `role`, or `tabIndex`, and the earlier plan's Task 3b removed the CTA button without a replacement.
**Impact:** the headline reason Discover exists (turn a trending topic into an AI conversation) never runs; `discoverEngagement` never records `explore`; the whole `?q=` → auto-search path in `HomeSearchScreen` is unreachable in practice.

### F-02 — P0 — Every feed/pipeline query does an unbounded `.collect()` then filters in memory
| Query | Evidence | Problem |
|---|---|---|
| `getFeed` | `feed.ts:19-27` | collects **all active clusters**, then filters 30-day + category, sorts, slices |
| `getCategoryCounts` | `feed.ts:79-97` | collects all active clusters per call (runs on every screen mount) |
| `getTrending` | `feed.ts:61-69` | same |
| `getSavedTopics` | `feed.ts:201-208` | collects all engagement rows for the user |
| `saveTopic` | `feed.ts:144-147` | collects all engagement rows to check one duplicate |
| `getUnenrichedClusters` | `enrich.ts:183-191` | collects all active clusters every 30 min |
| `getActiveClusters` | `enrich.ts:196-203` | same, every 60 min |
| `findClusterByTopicTitle` | `cluster.ts:148-152` | collects all active clusters **per item** in the clustering loop |
| `findClusterContainingItem` | `cluster.ts:315-319` | collects all active clusters **per vector neighbor** inside `clusterByEmbedding` (`cluster.ts:263-266`) |
| `findClusterByTitle` | `process.ts:304-309` | same pattern in the legacy path |

With 50–200 ingested items per 15 min (`sources.ts` feeds + GDELT), the cluster table reaches the thousands within days. These reads will hit Convex per-query read limits and degrade the feed from "instant" to "spinner", and `clusterByEmbedding` becomes a near-quadratic cron that starts timing out.
**Required:** index-bounded reads (`.withIndex(..., q.gte/q.lt)` + `.take(n)`), a `newestPublishedAt`-bounded feed query, and an item→cluster back-reference (`discoverItems.clusterId`) so `findClusterContainingItem` is a point read.

### F-03 — P1 — Anonymous writes silently succeed, so the UI lies
`/dashboard/*` is explicitly guest-friendly (`src/proxy.ts:43-46`) and `AuthGuard` only waits for `isLoaded` — it never redirects a signed-out user (`src/components/auth/AuthGuard.tsx:52-81`). Every Discover mutation starts with `if (!identity) return;` / `if (!user) return;` (`feed.ts:110-111, 133-141, 168-176`).
Meanwhile `DiscoverCard.tsx:99-107` sets `isSaved` and fires the "Topic saved" toast **regardless of** any server result, and `DiscoverScreen.tsx:102-112` awaits a mutation that resolves successfully while doing nothing.
**Impact:** a signed-out (or not-yet-synced) visitor gets a confirmed-feeling success for a write that never happened — the misleading-state class §8 of the pre-launch plan calls out.

### F-04 — P1 — Engagement writes are unvalidated, unrate-limited, and duplicated
`trackEngagement` takes `action: v.string()` (`feed.ts:107`) — any caller can write arbitrary action strings. None of the three engagement mutations use `checkRateLimit` (compare `convex/waitlist/mutations.ts`). `dismissTopic` (`feed.ts:165-185`) inserts a **new row on every tap** with no dedupe (unlike `saveTopic`).
**Impact:** §3.4 and §3.5 both fail on this surface: unbounded row growth from one authenticated account (storage + cost abuse), plus a drifting action vocabulary.

### F-05 — P1 — "Dismiss" removes nothing, anywhere
`DiscoverCard.tsx:134-138` shows a "Topic dismissed" toast and calls `onDismiss`; `DiscoverScreen.tsx:108-112` writes an engagement row; **no client filter exists** (the list renders `feed.map(...)` at `DiscoverScreen.tsx:223-231` with no `dismissedIds` check) and **no server filter exists** (`getFeed` never reads `discoverEngagement`, `feed.ts:9-44`).
**Impact:** the user taps X, is told it worked, and the card stays; a reload brings it back. Worse than not shipping the control.

### F-06 — P1 — Saved state is not hydrated and has no destination
`DiscoverCard.tsx:87` holds `isSaved` in component state only. `getSavedTopics` (`feed.ts:188-217`) is never called from `src/**` (the only consumer of `api.discover.*` is `DiscoverScreen.tsx`, which uses `getFeed`, `getCategoryCounts`, `trackEngagement`, `saveTopic`, `dismissTopic`).
**Impact:** bookmarks visually reset on every navigation/refresh and there is nowhere to read saved topics — the bookmark is currently decorative.

### F-07 — P1 — The image path cannot work as written
`DiscoverCard.tsx:172-180` renders a raw `<img src={cluster.imageUrl}>`, but `imageUrl` is **never populated**: `process.ts:122` (`imageUrl: undefined`), `process.ts:338`, `cluster.ts:179`, and `enrich.ts:220-233` (patches only `summary`, `whyTrending`, `suggestedQuery`). Even if it were populated with a publisher URL it would be blocked twice: CSP `img-src` (`src/proxy.ts:63-69` — only `*.convex.cloud`, `*.googleusercontent.com`, `api.dicebear.com`, `www.google.com`, `*.vercel.app`) and `next.config.ts` `images.remotePatterns` (same allowlist). It also bypasses `next/image`, against §9.1.
**Impact:** dead render branch; the moment someone populates the field, images break at runtime in production instead of failing at build time.

### F-08 — P1 — "AI enrichment" is not AI, and summaries are raw text fragments
`enrich.ts:9-41` defines `SUNFLOWER_URL` + `callSunflower()` and **never calls them** (grep: no other reference in the repo). `enrichClusters` (`enrich.ts:62-89`) instead does `descriptions[0].replace(/<[^>]*>/g,"").slice(0, 200)` and appends `Also reported by: …`. `language` is hard-coded `"en"` at ingestion (`process.ts:117`), so Taifa Leo (Swahili) content is labelled English. Titles are stored unsanitized (`process.ts:113`, `cluster.ts:166`).
**Impact:** the "summary" is a 200-char truncation that can end mid-sentence and may carry publisher HTML entities; the `HUGGINGFACE_API_KEY` dependency in that file is dead weight. §8.1 (provider-failure handling) and §11 (AI quality) are untested here precisely because the provider is never called.

### F-09 — P1 — No error state, no retry, blocking loading, fake refresh
`DiscoverScreen.tsx:127` — `const isLoading = feedResult === undefined || categoryCounts === undefined;` means a slow *counts* query blanks the entire feed. There is no `isError`/retry branch anywhere in the file; a thrown Convex error is caught only by the app-level boundary (`src/app/error.tsx`), replacing the whole page. `handleRefresh` (`:114-119`) clears local state and fakes completion with `setTimeout(..., 1000)` — it reports success independently of the refetch.
**Impact:** §8.2 (loading) and §8.3 (useful failure messages) unmet; on a slow Android network the user sees one long blank screen with no explanation and no retry.

### F-10 — P1 — Accessibility gaps on the interactive card
- Icon-only buttons with no accessible name: save/share/dismiss (`DiscoverCard.tsx:231-260`) and back/refresh (`DiscoverScreen.tsx:137-163`).
- The hand-rolled toast (`DiscoverCard.tsx:265-269`) is a plain `<div>` with no `role="status"`/`aria-live`, while the project already ships `src/hooks/useToast.tsx:32-52` (`aria-live="polite"`, `role="status"`), mounted globally at `src/app/layout.tsx:139`.
- `h-7 w-7` icon buttons (`:234, :246, :255`) are below the 44×44 target enforced by `e2e/mobile-first.spec.ts:41-52`.
- Once explore is re-attached (F-01) the card needs to be a real button/link with a visible focus ring, not a clickable `div`.

### F-11 — P2 — The Discover funnel is invisible to analytics
`src/lib/analytics.ts:31` declares `'discover_opened'`, but nothing calls it (grep across `src/` finds it only in the declaration list). There is no category-selection, explore, save, dismiss, or empty-feed event, so §10's "Discover engagement" funnel cannot be measured.

### F-12 — P2 — Cursor pagination is fragile by construction
`feed.ts:29-40` keys the cursor on a cluster `_id` and returns `filtered[startIndex + limit]._id`. The trend-score cron rewrites ordering hourly and new clusters arrive every 30 min, so a cursor can vanish mid-scroll; `feed.ts:32-36` correctly returns an empty page rather than page 1, but that surfaces as an unexplained "Load more does nothing". The frontend also calls `setIsLoadingMore(false)` on any subscription update inside the effect (`DiscoverScreen.tsx:76-88`).

### F-13 — P2 — No attribution/outbound link, no report path
`discoverClusters` (`schema.ts:995-1011`) has **no article URL field**; `itemIds` → `discoverItems.url` (`schema.ts:967`) is never surfaced. The card shows a topic title/summary derived from third-party publishers with **no link to the original article** and no attribution line. There is also no "report topic" affordance, and the trust data that exists is unused (F-14).
**Impact:** for a product that summarizes and clusters third-party news, missing outbound attribution is an ethics and legal exposure, and it blocks §4.3's moderation loop for ingested content.

### F-14 — P2 — Dead/duplicated code in the pipeline
- `process.ts:194-274` legacy `clusterItems` is never scheduled (`crons.ts:47-77` calls only `embedRawItems` / `clusterByEmbedding`), while `cluster.ts` re-implements `createCluster` / `markItemClustered`.
- `process.ts:8` imports `getSourceReputation` and never calls it; `reputation.ts#seedSourceReputation` is never invoked anywhere, so `discoverSourceReputation` is never populated — the whole trust-tier concept is inert.
- `discoverUserInterests` (`schema.ts:1023-1028`) has no reader and no writer → "For You" is just "everything, sorted by trendScore" (`feed.ts:26`).
- Unused public API: `getCluster` (`feed.ts:47-52`) and `getTrending` (`feed.ts:55-71`).

### F-15 — P2 — Indexing and guest visibility are undecided
`robots/route.ts` disallows `/dashboard/`, but the Discover page exports no metadata, so there is no explicit `noindex` if that env flag is flipped (`ROBOTS_DISALLOW_DASHBOARD=false` is the documented staging escape hatch). Separately, Discover is reachable signed-out (F-03) while its empty state ("content will appear as Samiati ingests news") reads as an authenticated product surface.

---

## 3. Decisions (open questions from the earlier plan, now resolved)

| # | Question | Recommendation | Why |
|---|---|---|---|
| D-1 | Is Discover guest-visible or signed-in only? | **Signed-in only.** Gate the screen with `useAppUser()` and redirect to `Screen.SIGN_IN`; keep `/dashboard` guest-friendly per `src/proxy.ts` | Explore consumes paid AI (`convex/translate.ts`/`chat.ts` quota), and the engagement writes are per-user by design (F-03) |
| D-2 | What is "For You"? | **Rename the tab to "Latest" for launch** and drop the personalization promise; implement `discoverUserInterests` in Phase 4 | Nothing reads/writes interests today (F-14); a tab that says "For You" while returning everything is a trust bug |
| D-3 | Do saved topics persist and have a home? | **Persist + surface.** Hydrate from `getSavedTopics`, add a "Saved" filter chip on the same screen (no new route) | Cheapest way to make the existing bookmark honest (F-06) |
| D-4 | Keep image thumbnails? | **Defer to Phase 3 and cache to Convex storage** rather than allowlisting N news domains in CSP | Keeps the CSP tight (F-07); the branch stays removed until images actually exist |
| D-5 | Outbound publisher links? | **Yes — every card links to the original article** via a new `primaryUrl` on the cluster, plus per-source attribution | F-13; also the only honest way to present third-party news summaries |
| D-6 | Dismiss semantics | **Persist, filter server-side, and stay hidden** (they are user feedback, not a session affordance) | F-05; server-side filtering also prevents the dismissed card reappearing after reload |

---

## 4. Phased Implementation Plan

Ordering follows the pre-launch sequence (`§16`): security/data integrity first, then UX, then content quality, then growth.

### Phase 0 — Guardrails & measurement (≈0.5 day)
| # | Task | File(s) | Notes |
|---|---|---|---|
| T0.1 | Gate the screen on `useAppUser()`; while `!isLoaded` render the existing skeleton, when loaded-but-no-user `navigate(Screen.SIGN_IN)` | `DiscoverScreen.tsx` | Closes F-03's root cause for this screen; mirrors the gate in `HomeSearchScreen.tsx:185-188` |
| T0.2 | Fire analytics: `discover_opened` on mount, plus new `discover_category_selected` / `discover_topic_explored` events (extend the `AnalyticsEvent` union) | `DiscoverScreen.tsx`, `src/lib/analytics.ts` | Closes F-11; keep payloads to `{ location, category }` — never topic text (§10 constraint) |
| T0.3 | Add `export const metadata: Metadata = { robots: { index: false, follow: false } }` — split the route into a server `page.tsx` + client child component | `src/app/dashboard/discover/page.tsx` | Closes F-15 |
| T0.4 | Delete dead pipeline code (see §5) | `convex/discover/process.ts`, `convex/discover/cluster.ts` | Closes F-14; do it before editing the same files in Phase 1 |

**Gate 0:** a signed-out visit to `/dashboard/discover` lands on `/sign-in`; `discover_opened` appears in the dev console (`analytics.ts` logs in development); `npm run lint` + `npx tsc --noEmit` show no new errors.

### Phase 1 — Backend correctness & hardening (≈1.5 days)
| # | Task | File(s) | Notes |
|---|---|---|---|
| T1.1 | Replace unbounded `.collect()` with bounded reads: add `by_status_newest` (`["status","newestPublishedAt"]`) and `by_status_category_newest` (`["status","category","newestPublishedAt"]`) to `discoverClusters`; `getFeed` uses `.withIndex(...q.eq("status","active").gte("newestPublishedAt", cutoff))` + `.take(limit + 1)`; same treatment for `getCategoryCounts`, `getUnenrichedClusters`, `getActiveClusters` | `convex/schema.ts`, `convex/discover/feed.ts`, `convex/discover/enrich.ts` | Closes F-02 (the P0). Use `q.order("desc")` for stable ordering; the in-memory `trendScore` sort then only runs on a bounded page |
| T1.2 | Add `discoverItems.clusterId` (optional `v.id("discoverClusters")`, indexed `by_cluster`) written by `appendToCluster`/`createCluster`; rewrite `cluster.ts#findClusterContainingItem` as a point read | `convex/schema.ts`, `convex/discover/cluster.ts` | Closes the worst F-02 case (per-neighbor full scan inside the cron) |
| T1.3 | `trackEngagement`: `action` becomes a union literal (`"impression" \| "click" \| "explore" \| "save" \| "share" \| "dismiss"`), add `checkRateLimit(ctx.db, \`discover:engage:${user._id}\`, 60_000, 60)`, and skip duplicate `(userId, clusterId, action)` rows | `convex/discover/feed.ts` | Closes F-04; reuse `convex/lib/rateLimit.ts` exactly as `convex/waitlist/mutations.ts` does |
| T1.4 | `dismissTopic`: dedupe like `saveTopic`, same rate limit; add `unsaveTopic` so the bookmark can toggle | `convex/discover/feed.ts` | Closes F-05/F-06 at the source |
| T1.5 | `getFeed` accepts the caller's dismissed cluster ids (or joins `discoverEngagement`) and excludes them server-side; expose `savedIds` (or a small `getEngagementState` query) so bookmarks hydrate | `convex/discover/feed.ts` | Closes F-05/F-06; keep it inside the same bounded read |
| T1.6 | Replace the `_id` cursor with an opaque `(newestPublishedAt, _id)` cursor; return `{ clusters, nextCursor, hasMore }` | `convex/discover/feed.ts`, `DiscoverScreen.tsx` | Closes F-12 — a vanishing cursor can no longer skip a page |
| T1.7 | Throwing contract: throw `ConvexError` with a code (`unauthenticated`, `rate_limited`, `invalid_action`) instead of silently returning | `convex/discover/feed.ts` | Makes F-03's lying UI impossible — the client can distinguish "done" from "not allowed" |

**Gate 1:** with >5k seeded clusters, `getFeed` stays well inside Convex per-query read limits; unauthorized calls throw `ConvexError`; a scripted 200-tap dismiss produces **one** engagement row; `npm test` green.

### Phase 2 — Frontend UX, accessibility & states (≈1.5–2 days)
| # | Task | File(s) | Notes |
|---|---|---|---|
| T2.1 | Re-attach the funnel: wrap the card body in a real `<button>` (or `<a>`) calling `handleExplore`, `aria-label="Explore {topicTitle} with Samiati"`, visible focus ring, `disabled` while navigation is in flight | `DiscoverCard.tsx` | Closes F-01 — the highest-value change in this plan |
| T2.2 | Replace the hand-rolled toast with `useToast()`; add `aria-label` to save/share/dismiss; raise icon targets to ≥44×44 (`h-11 w-11`) | `DiscoverCard.tsx`, `DiscoverScreen.tsx` | Closes F-10; `ToastProvider` is already global (`src/app/layout.tsx:139`) |
| T2.3 | Optimistic save with revert-on-failure (using `unsaveTopic` from T1.4); seed `isSaved` from server state; dismiss hides the card immediately via a `dismissedIds` set **and** persists via T1.5; surface failures as an error toast | `DiscoverCard.tsx`, `DiscoverScreen.tsx` | Closes F-03/F-05/F-06 |
| T2.4 | Split the loading model: `feed === undefined` → card skeletons (not a full-screen spinner); `categoryCounts === undefined` → tabs render without badges; add an explicit error state with "Samiati couldn't load Discover right now. Please try again." + Retry; make Refresh a real pending→settled cycle (no `setTimeout`), toasting success **only after** fresh data arrives | `DiscoverScreen.tsx` | Closes F-09 and §8.2/§8.3 |
| T2.5 | Add a "Saved" chip to `CATEGORIES` rendering `getSavedTopics` output; rename `for_you` → "Latest" (D-2) | `DiscoverScreen.tsx` | Closes F-06 |
| T2.6 | Virtualize the list with `@tanstack/react-virtual` once >50 items are loaded (the dependency is already used by the feed screens) | `DiscoverScreen.tsx` | §9.2; keep the same card renderer |
| T2.7 | Distinct empty states: "no topics in this category yet" vs "no saved topics" vs "everything here is dismissed", each with its own copy | `DiscoverScreen.tsx` | §8.1 |

**Gate 2:** axe + `e2e/mobile-first.spec.ts` pass on Discover at 360/375/390/412/768; keyboard-only: Tab to a card → Enter starts a chat with `?q=`; dismiss removes the card and it stays gone after reload; a blocked mutation shows an error toast (never a false success).

### Phase 3 — Content quality, attribution & moderation (≈1.5–2 days)
| # | Task | File(s) | Notes |
|---|---|---|---|
| T3.1 | Add `primaryUrl` (+ optional `primaryDomain`) to `discoverClusters`; populate it in `cluster.ts#createCluster`/`appendToCluster` from the newest item's `url`; render "Read at {domain} ↗" on the card with `rel="noopener noreferrer nofollow"` and `target="_blank"` | `convex/schema.ts`, `convex/discover/cluster.ts`, `DiscoverCard.tsx` | Closes F-13; attribution is now a data guarantee, not a UI afterthought |
| T3.2 | Make enrichment real: call the AI router (`convex/lib/aiRouter.ts`, as `cluster.ts:78-87` already does for embeddings) with a strict prompt returning `{summary, whyTrending, suggestedQuery}` JSON; validate + truncate to a whole-sentence boundary; strip HTML entities; fall back to the current deterministic text when the provider fails, and record usage via `convex/lib/aiUsage.ts#usageToRecordArgs`; delete the unused `callSunflower`/`SUNFLOWER_URL` | `convex/discover/enrich.ts` | Closes F-08 and satisfies §8.1 (provider failure must degrade, not blank) + §11 (quality loop) |
| T3.3 | Sanitize + bound ingested text at the boundary: `sanitizeText(title, 300)` / `sanitizeText(description, 2000)` from `convex/lib/validation.ts`; detect language for the RSS feeds that aren't English (`taifaleo.nation.co.ke`) instead of hard-coding `"en"` | `convex/discover/process.ts` | Closes the sanitization half of F-08; §3.4 server-side validation for ingested data |
| T3.4 | Activate the trust layer: schedule `reputation.seedSourceReputation` once (cron or one-shot) and use `getSourceReputation` (currently an unused import at `process.ts:8`) to drop/flag tier ≥7 domains before clustering; expose `trustTier` on the cluster for a "Verified source" hint | `convex/discover/process.ts`, `convex/discover/reputation.ts`, `convex/crons.ts` | Closes the F-14 trust gap and gives §4.3 a first moderation filter for ingested content |
| T3.5 | Add a "Report topic" action on the card that writes to the existing `reports` table path (reuse whatever `convex/reports.ts` exposes) and hides the card locally | `DiscoverCard.tsx`, `DiscoverScreen.tsx` | §4.3 moderation loop + §7.3 error affordances |
| T3.6 | Images (only if D-4 is approved): download the publisher image once, store it in Convex storage, keep the `_storage` id on the cluster, render with `next/image` (`*.convex.cloud` is already allowlisted in both CSP and `next.config.ts`); otherwise delete the `imageUrl` render branch and the field | `convex/discover/enrich.ts`/new `convex/discover/images.ts`, `DiscoverCard.tsx` | Closes F-07 without loosening CSP |

**Gate 3:** every card exposes an outbound link that resolves; a simulated AI-provider failure leaves summaries non-empty (deterministic fallback) and logs a usage row; a tier-7 domain never reaches the feed; `node scripts/check-alt-text.mjs`, `check-image-sizes.mjs`, `check-broken-links.mjs` pass.

### Phase 4 — Personalization (post-launch, optional)
| # | Task | Notes |
|---|---|---|
| T4.1 | Write `discoverUserInterests` from `discoverEngagement` during the hourly trend cron (weighted: explore 3, save 2, click 1, dismiss −1) | Finally gives the table a writer (F-14) |
| T4.2 | Add a `for_you` mode to `getFeed` that blends interest-weighted `trendScore` with recency, still inside the bounded index read | Restores the "For You" tab honestly |
| T4.3 | Add "because you explored …" explanation chips | Keeps personalization explainable and testable |

---

## 5. Files to Modify / Create

| File | Change | Findings closed |
|---|---|---|
| `convex/schema.ts` | +`discoverClusters.primaryUrl`/`primaryDomain`, +`by_status_newest`, +`by_status_category_newest`, +`discoverItems.clusterId` + `by_cluster` | F-02, F-13 |
| `convex/discover/feed.ts` | Bounded index reads, union-typed `action`, rate limits, dedupe, `unsaveTopic`, dismissal filtering, `savedIds`, opaque cursor, `ConvexError` codes | F-02, F-04, F-05, F-06, F-12 |
| `convex/discover/cluster.ts` | Point-read `findClusterContainingItem` via `clusterId`, write `primaryUrl`, delete dead duplicates | F-02, F-13, F-14 |
| `convex/discover/enrich.ts` | Real AI summaries via the router + usage recording + fallback, bounded queries, delete `callSunflower` | F-02, F-08 |
| `convex/discover/process.ts` | Sanitize/bound text, real language detection, remove unused `getSourceReputation` import (or use it, per T3.4), remove legacy `clusterItems` | F-08, F-14 |
| `convex/discover/reputation.ts` / `convex/crons.ts` | Schedule reputation seeding + tier filtering | F-14, §4.3 |
| `src/app/dashboard/discover/page.tsx` | Server wrapper + `noindex` metadata | F-15 |
| `src/components/screens/DiscoverScreen.tsx` | Auth gate, analytics, skeletons, error+retry, real refresh, saved chip, dismissed set, virtualization, cursor handling | F-01, F-03, F-05, F-06, F-09, F-11, F-12 |
| `src/components/discover/DiscoverCard.tsx` | Explore as a real button/link, `useToast`, `aria-label`s, ≥44px targets, hydration of saved state, outbound attribution link, report action, image branch decision | F-01, F-05, F-06, F-07, F-10, F-13 |
| `src/lib/analytics.ts` | Add Discover event names | F-11 |
| `tests/discover-*.test.ts` (new) | Unit tests for the new pure helpers + query-shape guards | §6 below |
| `e2e/discover.spec.ts` (new) | Route-level smoke: tabs, explore → chat, save/dismiss persistence, a11y | §6 below |

---

## 6. Validation & Test Plan

### 6.1 Automated gates (every phase must keep all of these green)
| Gate | Command | Relevance |
|---|---|---|
| Lint / format / types | `npm run lint`, `npm run format:check`, `npx tsc --noEmit` | CI `lint-and-build` |
| Unit tests | `npm test` (`vitest run`) | CI `lint-and-build` |
| Schema index coverage | `node scripts/check-schema-index.mjs` | CI `schema-index` — the new Discover indexes are inspected here |
| Bundle budget | `npm run build` then `node scripts/check-bundle-budget.mjs` | CI `bundle-budget`; confirm Discover does not push first-load JS past `perf-budget.json:bundle.maxKb` (460 kB) |
| A11y + SEO static audits | `node scripts/check-contrast.mjs`, `check-alt-text.mjs`, `check-broken-links.mjs`, `check-mobile-first.mjs`, `check-image-sizes.mjs` | CI `accessibility-audit`; T2.2/T3.1/T3.6 all touch these |
| Secrets | `npm run secrets:scan` | §3.1 — the pipeline touches `HUGGINGFACE_API_KEY`; deleting `callSunflower` must not leak it elsewhere |

### 6.2 New unit tests (`tests/`)
Follow the existing style (`tests/schema-index.test.ts` parses `convex/schema.ts` as text; `tests/rate-limit.test.ts` exercises the pure limiter).

1. `tests/discover-feed.test.ts` — pure helpers extracted from `feed.ts`:
   - cursor encode/decode round-trip: `(newestPublishedAt, _id)` → string → same pair;
   - page splitting returns `hasMore` correctly at exactly `limit`, `limit+1`, and 0 rows;
   - a cluster list containing a dismissed id is filtered out;
   - "Latest" and a concrete category select the expected subsets.
2. `tests/discover-engagement.test.ts` — pure action-validation helper:
   - the union accepts only the six known actions and rejects `"__proto__"`, `""`, and 10 kB strings;
   - duplicate `(user, cluster, action)` is collapsed;
   - the rate-limit key builder produces `discover:engage:<userId>` (assert it the way `tests/rate-limit.test.ts` covers waitlist).
3. `tests/discover-pipeline.test.ts` — pure text helpers used by T3.2/T3.3:
   - HTML/entity stripping, sentence-boundary truncation, and the deterministic fallback summary when the AI result is empty or malformed.

### 6.3 e2e (`e2e/discover.spec.ts`, Playwright, matching `e2e/mobile-first.spec.ts` style)
Discover lives behind auth, so the spec must either run in demo mode (`src/lib/appMode.ts` activates when `NEXT_PUBLIC_CONVEX_URL` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` are absent in a non-production build) or be `test.skip()`-gated when no session is seeded. Assertions:
- tabs render and switch without horizontal overflow at 360/390/412 px;
- axe reports no `color-contrast` / `target-size` violations on the route;
- keyboard: focus a card, press Enter, expect `/dashboard?q=` and a chat turn started;
- save → reload → bookmark still filled (proves F-06 is fixed at the data layer);
- dismiss → card disappears and does not return after reload (proves F-05).

### 6.4 Manual matrix (§7.1/§7.2 of the pre-launch plan)
360 / 375 / 390 / 412 / 768 / 1024 / 1440 px, plus one low-end Android with Chrome remote debugging:
- first paint on "Slow 3G" + 4× CPU throttling shows skeletons, not a blank screen;
- opening the on-screen keyboard does not clip the tab row;
- rotating the device keeps the feed scroll position;
- an airplane-mode toggle mid-scroll surfaces the error state with Retry (not an infinite spinner).

### 6.5 Definition of Done for Discover
A signed-in user can: open Discover from the chat header → see a bounded, attributed list of topics → tap a card and land in a chat already asking about that topic → save it, find it under "Saved", dismiss another and never see it again → hit a provider/network failure and be told, in plain words, what happened and what to do — while the database stores exactly one engagement row per (user, topic, action), no query scans an unbounded collection, and analytics records `discover_opened` without leaking any topic text.

---

## 7. Risks & Rollback

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Schema additions need a Convex migration (`primaryUrl`, `clusterId`) | Medium | New fields are invalid for existing rows | Make both `v.optional(...)`; backfill via a one-shot `internalAction`; the read path tolerates `undefined` (the card hides the link until backfilled) |
| Bounded `getFeed` changes ranking behaviour vs today's global sort | Medium | Topics a user expects may drop off page 1 | Log page-1 overlap before/after for a day, then keep the bounded version |
| A real AI summary provider raises Discover's AI cost | High | §9 budget pressure | Enrich only 10 clusters per 30 min (the existing cap at `enrich.ts:50`), record usage via `aiUsage`, and add a monthly ceiling check in the cron |
| Removing the `imageUrl` render branch breaks a future design | Low | Rework later | The schema field stays; only the unpopulated render branch goes (T3.6) |
| Dismiss filtering surprises heavy dismissers | Low | Empty feed | T2.7's dedicated empty state + a "Show dismissed" reset action |

**Rollback:** every phase is independently revertable — T1.1/T1.2 are additive indexes plus read changes, T2.x is confined to two components, T3.x is additive schema fields plus one cron. No phase requires a destructive data migration.

---

## 8. Recommended Execution Order (first three PRs)

1. **PR-1 (P0, lowest risk):** T2.1 + T2.2 — re-attach Explore, adopt `useToast`, add `aria-label`s and 44 px targets. Restores the product's core loop and clears visible a11y debt without touching the backend.
2. **PR-2 (P0):** T1.1 + T1.2 + T0.4 — bounded reads, the `clusterId` back-reference, dead-code removal. Protects the surface from collapse as the corpus grows.
3. **PR-3 (P1):** T0.1 + T1.3–T1.7 + T2.3 — auth gate, validated/rate-limited/deduped engagement writes, dismissal + save persistence, honest `ConvexError` contract, optimistic UI with revert.

Then Phase 3 (attribution + real enrichment) and Phase 4 (personalization) after the soft launch, per the pre-launch plan's §15 P2 bucket.

---

## 9. Progress Log

### PR-1 — T2.1 + T2.2 (done)
| Task | Change | Evidence |
|---|---|---|
| T2.1 | Card body is now a real `<button type="button" onClick={handleExplore}>` with `aria-label="Explore {topicTitle} with Samiati"` and a `focus-visible` ring, plus a low-emphasis "Explore with Samiati" affordance (reusing the previously-unused `Compass` import). No nested interactive elements. | `src/components/discover/DiscoverCard.tsx:179-221` |
| T2.2 | Hand-rolled toast replaced with `useToast()` (`aria-live` announcements); `aria-label` + `title` on save/share/dismiss; icon targets raised from `h-7 w-7` (28 px) to `size-11` (44 px); decorative icons marked `aria-hidden`; save label reflects state | `DiscoverCard.tsx:245-290` |
| T2.2 | Back/refresh buttons: `aria-label`, `title`, `size-11`, `aria-busy={isRefreshing}` on refresh; decorative icons `aria-hidden`; loading block now `role="status"` | `src/components/screens/DiscoverScreen.tsx:137-170, 215-224` |

**Verification run:** `npx eslint` (both files — 1 pre-existing error at `DiscoverScreen.tsx:79:7`, `react-hooks/set-state-in-effect`, code untouched by this PR and scheduled for T1.6/T2.4), `npx tsc --noEmit` (0 errors mentioning either file), `npx vitest run` (24 files / 247 tests passed), `node scripts/check-alt-text.mjs` (0 violations), `node scripts/check-mobile-first.mjs` (pass), `node scripts/check-contrast.mjs` (0/12 pairs fail).

**Not yet done (next PRs):** T0.1/T0.2/T0.3 (auth gate, analytics, `noindex`), T1.x backend hardening, T2.3–T2.7 (persistent save/dismiss, skeleton + error states, real refresh, saved list, virtualization, empty states).
