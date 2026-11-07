# 0003 — The data layer is a repository interface with a local-first default

- **Status:** Accepted
- **Date:** 2026-11-07
- **Context:** The brief prefers Convex for application data, but also
  requires the application to stay runnable after every phase and to work for
  users on limited bandwidth.

## Decision

The persistence contract is `SamiatiStore` (`lib/data/store.ts`). Two
implementations exist:

| Implementation | File | Selected when |
| --- | --- | --- |
| `LocalStore` | `lib/data/local-store.ts` | Default — no environment variables set |
| `ConvexStore` | `lib/data/convex-store.ts` | `NEXT_PUBLIC_CONVEX_URL` is set |

`lib/data/provider.tsx` picks one at runtime and exposes it through
`useStore()`. No component branches on the backend.

The store interface is asynchronous CRUD with no reactivity. Streaming is
handled at the route-handler layer, so the two backends behave identically.

## Why

A chat product for users on metered, slow connections should not require a
server round-trip to render the interface. In local mode Samiati runs with no
accounts, no deployment and no API keys — the fastest possible way to
evaluate the product, and the fastest way for a community to start
contributing.

It also keeps the application runnable at every phase boundary: the Convex
backend can be switched on later without touching a single component.

## Consequences

- Zero-configuration onboarding: `npm install && npm run dev` works.
- Conversations and contributions never leave the device in local mode, which
  is a genuine privacy property for the target users.
- The Convex path is exercised only when a deployment is configured. It is
  covered by the same `SamiatiStore` contract and is tested indirectly through
  `LocalStore`.
- Real-time reactivity (Convex's `useQuery`) is not used. The MVP re-fetches
  after mutations. Moving to live queries is a documented Phase 6 item.
- The `ConvexStore` adapter talks to Convex over HTTP rather than through the
  React provider, so it works from both the server and the browser.

## References

- [`docs/architecture.md`](../architecture.md)
- [`docs/database-schema.md`](../database-schema.md)
