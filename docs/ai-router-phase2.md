# Phase 2 — AI Router & Platform Hardening

**Status:** Shipped (2026-09-01)
**Owner:** Engineering
**Scope:** A, B, C, D, E, F, G of the Phase 2 plan; the 10 quick fixes
from Phase 1 are prerequisites (see commit history).

This is the 1-page summary I promised in the Phase 2 kickoff. Each item
gets: status, what shipped, what was deferred, why, and the trigger to
revisit.

---

## A. AI router + provider abstraction — ✅ shipped

**What shipped:** `convex/lib/aiRouter.ts` with a `ChatProvider`
interface covering `chat`, `asr`, `tts`, `embed`, `moderate`. Single
`HuggingFaceProvider` implementation. A stub `fallbackProvider` returns
`not_implemented` for every capability so the path to wire a real
secondary (Replicate, Together, dedicated HF Inference Endpoint) is a
one-file change.

**Deferred:** A real live fallback. The contract is in place; the
secondary is not.

**Why deferred:** no concrete cost-out decision yet. The HF free
tier is currently adequate; spinning up a paid fallback would be
spending money on a hypothetical outage.

**Revisit when:** HF ToS changes, HF rate-limits us for >1 day, or
AI cost per active user exceeds 3× paid revenue.

## B. Discover embeddings — ✅ shipped

**What shipped:** Convex 1.31.2 native vector search. `discoverItems`
gained `embedding: number[]` + `embeddingModel` + `embeddedAt` and a
`vectorIndex("by_embedding", { dimensions: 384, filterFields:
["category", "country"] })`. New `convex/discover/cluster.ts` does
embedding + ANN-based clustering with a 0.78 cosine threshold. The
old string-based clusterer is now a fallback for items that failed
to embed.

**Deferred:** full semantic dedup on the corpus, periodic re-embedding
of trending clusters, model upgrade (`paraphrase-multilingual-MiniLM-L12-v2`
→ larger model once paid HF budget allows).

**Why deferred:** MiniLM-L12 is sufficient for the current corpus
volume. Larger models cost more per embed call and the search
quality hasn't yet been user-impact-limiting.

**Revisit when:** cluster quality is reported as bad by moderators,
or duplicate-event stories begin to dominate Discover.

## C. Convex lock-in decision record — ✅ shipped

**What shipped:** `docs/architecture/convex-decision.md` (ADR-0001).
Documents the lock-in acceptance, the schema-boringness guard, the
"when to revisit" triggers, and the relationship to the AI-router
and Clerk mitigations.

**Deferred:** the quarterly Convex-pricing/ToS review process. The
ADR specifies when to revisit but doesn't own the process.

**Why deferred:** infra governance, not a code change.

**Revisit when:** Convex announces a >2× pricing change, deprecates
vector search, or Samiati needs a feature Convex cannot provide
(cross-region replication, e.g.).

## D. Cost monitoring — ✅ shipped

**What shipped:** `convex/lib/aiUsage.ts` with `recordUsage` (internal
mutation) and `getDailyUsage` (read-side aggregator). `UsageEstimate`
on every router call (reported when the provider returns `usage`,
estimated from char counts otherwise). Per-model pricing table.
Captured in 7 call sites: chat, translate, tts, asr (public + internal),
search (public + internal), discover/embed, moderation.

**Deferred:** real-time alerting on free-tier cost > paid revenue.
A cost dashboard UI. Backfill coverage of the legacy
`callSunflower` path (which throws on permanent errors and loses
usage info).

**Why deferred:** the free-tier burn is currently small enough to
monitor by hand. A dashboard is straightforward to build now that
the data is captured; it just hasn't been prioritized.

**Revisit when:** weekly free-tier cost > 1× paid revenue, or before
launching a marketing push that materially increases free-tier
sign-ups.

## E. Moderation classifier — ✅ shipped

**What shipped:** `convex/changa/moderationClassifier.ts` wrapping
`unitary/toxic-bert` (HuggingFace). Returns a 7-class score vector
(0..1). Records the score in the processing run; surfaces scores
above conservative thresholds as **soft flags** (`model_toxicity_high`
et al.) on the submission. The existing `requiresHumanModeration: true`
contract is preserved — humans are still the only deciders; the
classifier only adds prioritization signal for the moderator queue.

**Deferred:** multilingual toxicity model (toxic-bert is English-centric).
False-positive / false-negative agreement measurement against
human-moderator decisions. Auto-suggested review-priority scoring
(softmax of all 7 categories).

**Why deferred:** A multilingual model would cost more per call and
the soft-flag pattern is deliberately conservative (high thresholds)
to minimize false positives in training data. Agreement measurement
needs N months of moderator decisions to be statistically meaningful.

**Revisit when:** N ≥ 500 moderator decisions on real Changa
submissions, OR a contributor files a complaint about a
soft-flagged submission being auto-rejected (which shouldn't happen
but should be checked).

## F. Dataset-write chokepoint + CI — ✅ shipped (expanded)

**What shipped (Phase 2F, initial):** `convex/changa/datasetWrites.ts`
wraps writes to the 6 lineage tables (`changaCuratedExamples`,
`changaDatasetReleases`, `changaReleaseMembers`,
`changaEvaluationSets`, `changaEvaluationItems`, `changaDecisions`)
with inline contamination-guard logic. `scripts/check-dataset-chokepoints.mjs`
fails the build on direct writes outside the chokepoint.

**What shipped (this turn):** the chokepoint was expanded to all
**23 changa\* tables** — every `insert*` and `patch*` in `submissions`,
`tasks`, `campaigns`, `validation`, `worker`, `processing`, `stats`,
`reputation`, `invites`, `consent`, `documents`, `seedSheng`,
`curation`, `evaluation` now routes through the chokepoint. Three
helpers (`enqueueSubmissionProcessing`, `insertConsentRecord`,
`recordValidationStats`) had their signatures changed to take
`{ db, runMutation }` so they can call the chokepoint internally.

**Deferred:** the chokepoint could be extended to other domains
(`discover*` clusters, `billing*` subscriptions, `comments`,
`posts`, `dms`) with the same pattern. Not done because the
lineage invariants are the only ones currently requiring
centralized enforcement.

**Why deferred:** discover/cluster has different invariants
(vector search, not training data); the others have lower write
volume and lower security stakes. Worth doing as separate workstreams
when the invariants exist.

**Revisit when:** any future incident where a direct write to a
changa* table bypasses the chokepoint, OR when a new invariant
needs the same pattern.

## G. Nonce-based CSP — ✅ shipped

**What shipped:** `src/proxy.ts` now generates a per-request nonce
via `crypto.randomUUID` (base64), sets `x-nonce` for Server Components,
and emits a strict CSP with `'strict-dynamic'`. `'unsafe-eval'` only
in dev. The static `next.config.ts` CSP header was removed; the
proxy is the single source. `src/app/api/csp-report/route.ts` is
the edge endpoint for browser CSP violation reports.

**Deferred:** tightening `style-src 'unsafe-inline'`. This would
require removing the inline `style={...}` attributes Radix and
shadcn components emit (substantial refactor). The `'report-uri'`
directive is in place so we can observe violations before the
tightening.

**Why deferred:** the perf vs security trade is explicit. Per the
Next 16 docs, nonce-based CSP forces all pages to dynamic rendering,
disables CDN caching, and is incompatible with PPR. We chose security
+ flexibility; a hash-based SRI path is the path back to static
generation when Next 16's SRI support stabilizes.

**Revisit when:** Next 16 SRI becomes stable (currently experimental),
OR when the performance hit of dynamic rendering becomes user-visible
(p95 TTFB > 1s on a Vercel regional benchmark).

---

## What the planning doc did NOT cover

- **Phase 1 quick fixes** — those are in the commit log; this doc
  only describes Phase 2.
- **Other Convex domains** — `discover*` clusters, `comments`,
  `posts`, `dms`, `payments*` are not in scope of this doc and
  not yet chokepointed.
- **Per-feature dashboards** — Discover, Changa review queue, and
  AI usage need real dashboards. The data layer for AI usage is
  in place; the other two are separate workstreams.

## What I'd do next

In order of impact-per-hour:

1. **Cost dashboard** (D-followup) — the data is captured; a small
   chart in the moderator dashboard closes the cost-feedback loop.
2. **A real fallback provider** (A) — when the HF free tier rate-limits
   us, this is the first thing to break. Worth a 2-day spike before
   we hit the wall.
3. **Chokepoint for `discover*` clusters** (F-extension) — if/when
   clusters start affecting training data via export, this becomes
   load-bearing.
4. **Style-src 'unsafe-inline' tightening** (G-followup) — long
   tail; revisit when (3) and (1) are done.
