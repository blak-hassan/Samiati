# ADR-0001: Convex as the System of Record

**Status:** Accepted (2026-09-01)
**Deciders:** Engineering

## Context

Samiati's data layer is entirely Convex: a reactive document database
plus serverless `query` / `mutation` / `action` / `internalAction`
functions and scheduled `crons`. As of this ADR, this includes ~35
tables in `convex/schema.ts` and the business rules for quotas,
reputation, Changa processing, Discover ingestion, AI security, and
paystack billing.

The Convex React client (`useQuery` / `useMutation` from
`convex/react`) drives live updates in the UI. Real-time is not a
nice-to-have; several screens (Discover feed, Changa review queue,
conversations) require it.

## Decision

**We accept the Convex lock-in and explicitly choose to mitigate it
rather than avoid it.**

Specifically:

1. The data layer stays on Convex. Migration cost is high; the value
   Convex provides (reactive queries, serverless functions, crons,
   file storage in one runtime) collapses what would otherwise be 3-4
   services (Postgres, Redis, a queue, serverless compute) into one.
   This is worth the lock-in for our scale.
2. We do not introduce Convex-specific features in the data model. No
   `_id` polymorphism outside Convex's own use, no Convex-only types
   in the public TypeScript API, no use of the `_storage` system
   table from outside `convex/`. This keeps the schema boring and the
   migration cost bounded.
3. The Convex React client is used only inside `src/`. Server-to-server
   call sites use `ConvexHttpClient` (no subscriptions). A migration
   to a non-reactive backend would require rewriting the live-update
   layer; everything else is portable.
4. We do not use Convex's HTTP actions, scheduled functions, or
   vector search as a hard dependency for a critical flow. Vector
   search was added in Phase 2B because Convex's native API was
   available; if it is ever removed, the `convex/discover/cluster.ts`
   module is the only consumer and can be swapped to a different
   vector store with no schema change (`discoverItems.embedding` is
   just `v.array(v.number())`).

## Schema-Boringness Guard (mechanical)

To enforce point (2), a CI check (added in Phase 2F) greps for the
following anti-patterns and fails the build if found outside the
allowlist:

- `ctx.db.insert("changaCuratedExamples", ...)` or
  `ctx.db.patch(<changaCuratedExamples id>, ...)` from any file other
  than `convex/datasetWrites.ts`. (Contamination guard depends on
  every write going through the chokepoint.)
- Same rule for `changaReleaseMembers`, `changaEvaluationItems`,
  `changaEvaluationSets`, `changaDecisions`. (All of these define
  training/eval data lineage.)
- Any import of `convex/_generated/api` from `src/` outside the
  Convex client provider.
- Any import of `convex/_generated/dataModel` from outside `convex/`.

These checks are mechanical and run in CI on every PR.

## Consequences

**Positive**

- One runtime to operate, monitor, and back up.
- Live updates "just work" for any new screen.
- The Convex dashboard is the only ops surface most engineers need.

**Negative / Risks**

- **Vendor pricing change.** Convex charges per function call, per
  storage, per bandwidth. A pricing change that increases our
  effective cost 3-5x is a 3-6 month project to migrate. **Mitigation:**
  the schema-boringness guard above; quarterly review of Convex
  pricing/ToS changes; the no-HTTP-actions rule.
- **Realtime architecture.** If the product ever needs a non-Convex
  backend (regulatory, region-specific, etc.), every live-update
  screen needs a rewrite. **Mitigation:** server-to-server flows
  already use `ConvexHttpClient`; documented in
  `src/app/ConvexClientProvider.tsx`.
- **Convex deprecates a feature we use.** Vector search is the
  highest-risk one. **Mitigation:** `convex/discover/cluster.ts` is
  the only consumer; the embedding column is untyped from Convex's
  perspective.

## When to revisit

This ADR is reconsidered if any of the following happens:

- Convex announces a pricing model change of >2x for our usage
  pattern.
- Convex deprecates vector search without a comparable replacement.
- The product needs a feature that Convex cannot provide (e.g.
  cross-region replication with strong consistency).
- A migration framework to a non-Convex backend (Drizzle + Postgres,
  e.g.) reaches feature parity with our usage.

## What this ADR explicitly does NOT cover

- AI provider lock-in (HF router). See
  `convex/lib/aiRouter.ts` header for that mitigation.
- Auth provider lock-in (Clerk). Mitigation: middleware
  short-circuits cleanly when keys are absent (`src/proxy.ts`).
- Payment provider lock-in (Paystack). Mitigation: Paystack-specific
  fields are isolated in `convex/payments/paystack.ts`.
