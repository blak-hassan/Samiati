# Fork versus Build

Phase 0 deliverable. This is the decision record for how Samiati came to
exist. The recommendation in the brief was to use the T3 Cloneathon Next.js
architecture as the primary reference, selectively reuse compatible
components, and keep Samiati as an independent product repository. The
audit ([`repository-audit.md`](./repository-audit.md)) confirmed that
recommendation — with one significant correction.

---

## The decision

**Samiati is a new, independent repository.** It is *not* a fork of
`t3-cloneathon` and *not* a fork of `thom-chat`.

| Question | Answer |
| --- | --- |
| Which repository is the starting point? | Neither, as a fork. `t3-cloneathon` is the **scaffolding donor**: 27 shadcn/ui primitives, the `cn()` helper, the `use-mobile` hook, and the dependency manifest. |
| Should Samiati fork t3-cloneathon? | **No.** |
| What is copied? | The MIT-licensed UI primitives and two small utility files. Nothing else. |
| What is redesigned? | The layout (sidebar shell), the providers (runtime-selected backend + identity), and the entire visual system (warm-brown tokens). |
| What is implemented independently? | The chat product, the language registry, the AI service layer, the Convex schema, Discover, Changa, Communities, Profile, Settings and onboarding. |
| What are the architectural risks of inheriting the cloneathon code? | See [§4](#4-risks-of-inheriting-the-cloneathon-code). They are real but small, because the cloneathon contains almost no domain code. |

---

## 1. Why not fork `t3-cloneathon`

The usual reasons to fork are: to keep the git history, to inherit bug fixes
upstream, and to avoid re-creating configuration. None of them apply here.

**1. There is nothing to inherit.** The repository is the cloneathon's
competition website. Its domain model is one table (`submissions`) and one
module (`submission.ts`). Forking it would import a marketing page, a
submission form, a judging console and a gallery — none of which Samiati
uses — while still requiring every line of chat, conversation, language and
contribution code to be written from scratch.

**2. Its history is noise, not signal.** The 85 commits are a weekend
competition artefact ("vibe coded WIP", per its own README). There is no
long-lived maintainer to inherit fixes from, and the commit history would
obscure Samiati's own history in a product that will live for years.

**3. Its quality gates are worse than Samiati's requirements.** The cloneathon
ships with:

```
next.config.mjs
  typescript: { ignoreBuildErrors: true }   ← type errors never fail the build
  eslint:     { ignoreDuringBuilds: true }  ← lint errors never fail the build
```

and **no `eslint` package, no `eslint-config-next`, no test runner, no CI**.
Adopting that repository would mean *removing* safety gates that Samiati
needs. A fork inherits configuration; Samiati would have to un-inherit it.

**4. Its product framing is wrong.** The cloneathon organises everything
around "models", "judges" and "submissions". Samiati organises everything
around "languages", "speakers" and "contributions". The information
architecture is inverted. Keeping the cloneathon's route structure and
rewriting every page underneath it would cost more than starting from an
empty `app/` directory.

**5. The Convex deployment is shared.** Forking a repository that has a live
`NEXT_PUBLIC_CONVEX_URL` in its deployment environment invites the mistake of
pointing Samiati at the cloneathon's database — which contains other people's
submissions.

### What a fork *would* have saved

Approximately 1,200 lines of shadcn/ui components and four config files. Those
are copied verbatim instead, with attribution. The saving is the same; the
cost is not paid.

---

## 2. Why not fork `thom-chat`

thom-chat is the better *product* reference — it has real streaming, real
conversation management and a real domain model. It is still the wrong
starting point:

**1. Different framework.** SvelteKit 2 with Svelte 5 runes, `+page.server.ts`
load functions, form actions, `+layout.server.ts` and `$app` navigation. The
prompt explicitly says not to migrate its architecture, and the brief's own
stack is Next.js + React.

**2. Different UI system.** Melt UI (headless Svelte) and `unplugin-icons`,
against Samiati's Radix + shadcn/ui + `lucide-react`.

**3. Different auth.** BetterAuth with a session-token argument threaded
through every Convex function, against Samiati's Clerk + local fallback.

**4. Different styling generation.** Tailwind v4's CSS-first `@theme` against
Tailwind v3's `tailwind.config.ts` token map.

**5. Different backend style.** thom-chat passes `session_token` as an
argument to every query and mutation, re-validating it inside each handler
(including nested `ctx.runQuery` calls). Samiati resolves the current user
once per request through `convex/lib/currentUser.ts`.

A fork would mean a rewrite of essentially every file. That is not a fork;
it is a slower way of building the same thing.

### What thom-chat *was* used for

Its behaviour was studied and re-implemented natively:

| thom-chat behaviour | Samiati equivalent |
| --- | --- |
| Route handler streams a provider response and persists chunks | `app/api/chat/route.ts` streams NDJSON events; the client persists once |
| `createBranched` forks a conversation at a message | Schema field `branchedFromId` reserved; Phase 5 |
| `search` scores titles and bodies | `SamiatiStore.searchConversations` |
| `createAndAddMessage` titles a conversation from its first sentence | `LocalStore.addMessage` |
| Copy / regenerate / branch message actions | `components/chat/message-item.tsx` |
| Pinned conversations | Schema + store support |

---

## 3. What was actually done

Samiati's repository was initialised empty and built up:

```
1.  git init
2.  package.json — dependency manifest derived from the audited cloneathon
                   manifest, minus everything unused, plus eslint/vitest/zod
3.  Copy 27 shadcn/ui primitives + lib/utils.ts + hooks/use-mobile.tsx
                   from t3-cloneathon (MIT, attributed)
4.  Design system — app/globals.css + tailwind.config.ts, written from scratch
5.  Domain — lib/data, lib/languages, lib/ai, written from scratch
6.  UI — components/*, written from scratch
7.  Backend — convex/*, written from scratch
```

The git history of Samiati is therefore its own, and every commit tells the
story of Samiati rather than of a competition weekend.

---

## 4. Risks of inheriting the cloneathon code

Even though little was inherited, these risks were assessed and mitigated.

| Risk | Mitigation |
| --- | --- |
| **Type-safety regression.** The cloneathon disables build-time type checking. | `next.config.mjs` sets `ignoreBuildErrors: false`; `npm run typecheck` runs `tsc --noEmit`; CI must pass it. |
| **Lint regression.** The cloneathon has no eslint dependency at all. | `eslint` + `eslint-config-next` pinned; `npm run lint` is a first-class script. |
| **No test baseline.** The cloneathon has no tests, so regressions are invisible. | `vitest` suite over the registry, the pipeline and the data layer — 38 tests. |
| **Dead code.** The cloneathon ships `convex/devfuncs.ts`, which nothing references. | Samiati has no unreferenced modules; `convex/devfuncs.ts` was not copied. |
| **Shared deployment.** Forking invites pointing at the upstream Convex deployment. | Samiati requires its own `NEXT_PUBLIC_CONVEX_URL`; the default is a local backend with no deployment at all. |
| **Licence drift.** MIT requires the notice to travel with copied code. | `LICENSE` carries the MIT text; `README.md` credits both upstream projects; `docs/repository-audit.md` records exactly what was taken. |
| **Framework churn.** A fork tracks the upstream's lockfile and Renovate cadence. | Samiati pins exact Radix versions (as the cloneathon did) and uses caret ranges elsewhere, so it can move on its own schedule. |

---

## 5. Consequences of choosing "build"

**Accepted costs:**

- The shadcn/ui primitives are a copy, so improvements upstream are not
  inherited automatically. Accepted: the upstream cloneathon rarely updated
  them, and the Radix versions are pinned anyway.
- The Convex schema has no upstream to compare against. Accepted: the schema
  is Samiati-specific by definition.
- More code to write from scratch. Accepted: the code that matters to
  Samiati's differentiation is new regardless.

**Gains:**

- A clean, focused repository where every line is load-bearing.
- Quality gates that match the product's ambitions rather than a competition
  weekend's.
- A licence-clean lineage with an explicit audit trail.
- Freedom to use the Convex deployment and the Clerk application for
  Samiati's own purposes, with no risk of touching other people's data.

---

## 6. Decision status

**Accepted** — 2026-11-07. Recorded as
[`decisions/0001-independent-repository-not-a-fork.md`](./decisions/0001-independent-repository-not-a-fork.md).

