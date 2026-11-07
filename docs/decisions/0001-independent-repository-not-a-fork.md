# 0001 — Samiati is an independent repository, not a fork

- **Status:** Accepted
- **Date:** 2026-11-07
- **Context:** The brief asked Samiati to be "built using T3 Cloneathon as a
  reference", with the recommendation to use the cloneathon's Next.js
  architecture while keeping Samiati an independent product repository.

## Decision

Samiati is a **new repository**. It is not a fork of `t3-cloneathon` or
`thom-chat`.

From `t3-cloneathon` (MIT) Samiati copies 27 shadcn/ui primitives,
`lib/utils.ts` and `hooks/use-mobile.tsx`, with attribution. Everything else —
the layout, the providers, the design system, the domain model, the Convex
schema, the AI layer and every product surface — is written from scratch.

## Why

The repository audit found that `t3-cloneathon` is the cloneathon's
*competition website*, not a chat application: one table (`submissions`), one
domain module, no chat, no streaming, no conversations. It also ships with
type errors and lint errors disabled and no test suite or CI. Forking it
would have imported a marketing page, a judging console and a gallery while
still requiring the whole product to be written.

`thom-chat` is a real chat product but on SvelteKit 2 with Svelte 5, Melt UI,
BetterAuth and Tailwind v4. Adopting it would have required rewriting every
file — a slower path to the same result than building natively.

## Consequences

- Samiati's git history is its own and describes Samiati.
- Samiati adds the quality gates the references lack: `eslint`,
  `tsc --noEmit` as a build gate, and a `vitest` suite.
- A licence-clean lineage with an explicit audit trail exists in
  `docs/repository-audit.md`.
- The shadcn/ui primitives will not track upstream automatically.

## Alternatives rejected

| Alternative | Why rejected |
| --- | --- |
| Fork `t3-cloneathon` | Nothing to inherit beyond UI primitives; inherits disabled quality gates and a shared deployment. |
| Fork `thom-chat` | Framework mismatch makes every file a rewrite; the brief forbids migrating its architecture. |
| Start from `create-next-app` | Fine in principle, but the audited cloneathon manifest is a better-informed starting point than the generator's defaults, and it matches the target stack exactly. |

## References

- [`docs/repository-audit.md`](../repository-audit.md)
- [`docs/fork-vs-build.md`](../fork-vs-build.md)
