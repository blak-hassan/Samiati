# Repository Audit

Phase 0 deliverable. Samiati was specified as "built using T3 Cloneathon as a
reference". This document records what was actually found in the referenced
repositories, because **the premise of the reference turned out to be
partly wrong** and the differences materially change the build plan.

Audit performed: 2026-11-07
Method: both repositories were cloned locally and read at source level — file
trees, package manifests, schemas, components and licence files — rather than
from their README pages.

---

## 1. Executive summary

| Finding | Consequence |
| --- | --- |
| **T3 Cloneathon contains no chat application.** It is the competition website for the cloneathon: a submission registry, a judging console and a gallery. | There is no chat code to fork or port. The chat product must be built from scratch. |
| **thom-chat is a complete chat product, but on SvelteKit.** | Its *behaviour* is the reference; its *code* cannot be reused. |
| **Both repositories are MIT licensed.** | Code may be copied with attribution. |
| **The cloneathon repo has no linting, no type-check gate and no tests.** | Samiati adds `eslint`, `tsc --noEmit` in CI and `vitest`. |
| **The cloneathon's Convex schema has exactly one table (`submissions`).** | The Convex schema must be written from scratch. |

The recommendation — *use the cloneathon's Next.js/Convex/Clerk/shadcn
scaffolding as the reference, but keep Samiati an independent repository* —
turns out to be correct, though for a different reason than expected: there
was no forkable chat application in the first place.

---

## 2. `T3-Content/t3-cloneathon`

- **Upstream:** https://github.com/T3-Content/t3-cloneathon
- **Licence:** MIT (Copyright (c) 2025 Theo Browne) — verified in `LICENSE`
- **Commit audited:** `e8382e4` ("let everyone see winners")
- **Size:** 85 commits, one-page application, ~60 shadcn/ui components

### 2.1 What it actually is

The repository is the *cloneathon website* — the site contestants used to
register their T3 Chat clones and where judges scored them. Its README says:

> The first ever "Cloneathon" — Build an open source clone of T3 Chat and win
> up to $5,000 in prizes. This repo is very much a vibe coded WIP.

The entire application surface is:

```
app/
├── page.tsx                     # marketing landing page
├── terms-and-conditions/
└── (dashboard)/
    ├── register/                # contestant submission form
    ├── judge/                   # judging console (scores, finalists, winners)
    ├── gallery/                 # public gallery of submissions
    └── TopNav.tsx
convex/
├── schema.ts                    # ONE table: `submissions`
├── submission.ts                # the only domain logic
├── devfuncs.ts
└── auth.config.ts
components/ui/                   # the shadcn/ui set (reusable)
```

### 2.2 Direct answers to the Phase 0 questions

| Question asked | Finding |
| --- | --- |
| Application entry points | `app/layout.tsx` → `app/page.tsx`; `(dashboard)` route group for the authenticated area. |
| App Router structure | Yes — Next.js App Router with a route group and a `metadata` export per page. |
| Pages and layouts | `app/(dashboard)/layout.tsx` wraps children in `ClerkProvider` → `ConvexProviderWithClerk` → `Authenticated`/`Unauthenticated` gates. |
| Sidebar implementation | **None.** There is no sidebar; navigation is a top bar. |
| Chat components | **None.** |
| Message rendering | **None.** |
| Chat input | **None.** |
| Conversation history | **None.** |
| Authentication | Clerk, with `public_metadata.role === "admin"` used for judge authorisation. `convex/auth.config.ts` wires Clerk's domain into Convex. |
| Database schema | One table: `submissions` (project name, members, URLs, judge score, finalist scores). |
| Convex functions | `submission.ts` only — CRUD plus judging queries. |
| AI integration | **None.** |
| Streaming implementation | **None.** |
| State management | React `useState` plus Convex reactive queries. No global store. |
| UI components | The full shadcn/ui set (~60 components) under `components/ui`. |
| Styling conventions | Tailwind v3 + shadcn CSS variables in `app/globals.css`; `baseColor: neutral`. |
| Environment variables | `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CLERK_FRONTEND_API_URL`, plus Clerk's own publishable/secret keys. |
| Deployment configuration | Vercel-oriented (`next.config.mjs` uses `withPlausibleProxy`), but no committed CI. |
| Tests | **None.** No test runner, no test files, no CI workflow. |
| Missing functionality | Everything a chat product needs: chat, streaming, history, search, attachments, sharing, voice. |
| Development maturity | Low. It is an explicitly "vibe coded WIP" and is a competition artefact, not a product. |

### 2.3 Engineering quality of the cloneathon code

| Aspect | Finding | Samiati's response |
| --- | --- | --- |
| Type safety | `next.config.mjs` sets `typescript.ignoreBuildErrors: true` — **type errors never fail the build**. | Samiati sets `ignoreBuildErrors: false`. Type errors fail the build. |
| Linting | `next.config.mjs` sets `eslint.ignoreDuringBuilds: true`, and `eslint`/`eslint-config-next` are **not even in `package.json`** — `npm run lint` would prompt for an install. | Samiati adds `eslint` + `eslint-config-next` and a working `lint` script. |
| Tests | None. | Samiati adds `vitest` with 38 unit tests over the registry, the pipeline and the data layer. |
| Security | `requireAdmin` reads `identity.public_metadata.role` — acceptable for a demo, but the admin check is duplicated in ~8 handlers rather than centralised. | Samiati centralises the "current user" resolution in `convex/lib/currentUser.ts`. |
| Data safety | `getTopWinners` filters on `score >= 9` with no index. | Samiati indexes every table on its access path. |
| Dead code | `convex/devfuncs.ts` is not referenced by any page. | Samiati has no unreferenced modules. |

### 2.4 Component reuse inventory

**Reuse directly (MIT, unmodified):**

| Component | Path | Why |
| --- | --- | --- |
| shadcn/ui primitives | `components/ui/*.tsx` (27 copied) | Standard, well-tested React components. Copying them is cheaper and safer than re-deriving them. |
| `lib/utils.ts` | `cn()` helper | Standard `clsx` + `tailwind-merge`. |
| `hooks/use-mobile.tsx` | Mobile breakpoint hook | Standard. |

**Reuse with visual modification:**

| Component | Change |
| --- | --- |
| `button`, `input`, `card`, `badge`, `dialog`, `sheet`… | Restyled onto Samiati's warm-brown token set; no structural changes. |

**Reuse with architectural modification:**

| Component | Change |
| --- | --- |
| `app/(dashboard)/layout.tsx` | Became `components/layout/app-shell.tsx`: a persistent sidebar on desktop, the same sidebar in a `Sheet` drawer on mobile, plus a mobile header. |
| `convex-provider.tsx` | Became `lib/data/provider.tsx` + `lib/auth/provider.tsx`: backend and identity are chosen at runtime from the environment rather than hardcoded. |
| `middleware.ts` (Clerk) | Only mounted when Clerk keys are present; local mode needs no middleware. |
| `convex/auth.config.ts` | Kept, plus a local fallback user so the backend works without Clerk. |

**Replace:**

| Cloneathon thing | Replacement | Reason |
| --- | --- | --- |
| `components/ui/sidebar.tsx` (not copied) | `components/layout/sidebar.tsx` | shadcn's sidebar is 1,000+ lines with its own context and cookie persistence; Samiati needed a simpler, fully-controlled implementation with search and per-conversation actions. |
| `components/ui/toast.tsx` + `hooks/use-toast.ts` (not copied) | `sonner` | shadcn deprecated `toast` in favour of `sonner`. |
| `next-plausible` (not copied) | — | Samiati does not need third-party analytics in the MVP; adding a vendor is a cost and privacy decision, not a default. |
| `recharts` (not copied) | — | No charts in the MVP; the profile heat map is CSS. |
| `react-hook-form` + `zod` resolver forms (not copied) | — | No complex forms; Changa uses a single validated textarea. `zod` is kept for API input validation. |

**Build from scratch:**

Sidebar navigation, chat input, message rendering, markdown rendering, code
blocks, message actions, language selector, streaming, conversation history,
search, onboarding, Discover, Changa, Communities, Profile, Settings, the AI
service layer, the language registry, and the whole Convex domain schema.

---

## 3. `TGlide/thom-chat`

- **Upstream:** https://github.com/TGlide/thom-chat
- **Licence:** MIT (Copyright (c) 2025 Thomas G. Lopes) — verified in `LICENSE`
- **Commit audited:** `062193d` ("remove dompurify")
- **Stack:** SvelteKit 2 + Svelte 5, Convex 1.24, BetterAuth, Tailwind v4,
  Melt UI, OpenRouter, Vitest + Playwright

### 3.1 Why the reference was useful

thom-chat is a real, working T3 Chat alternative. Its **behaviour** is the
best available reference for the features Samiati needs. The following
patterns were studied and re-implemented in React:

| Pattern | Source | Samiati implementation |
| --- | --- | --- |
| Server-side streaming with interruption | `src/routes/api/generate-message/+server.ts` — a route handler that opens an OpenAI stream, accumulates chunks and persists each chunk to Convex | `app/api/chat/route.ts` + `lib/ai/pipeline.ts` — the route handler streams newline-delimited JSON events to the browser; the client renders them and persists the completed reply once. |
| Branching conversations | `convex/conversations.ts` → `createBranched` copies the message prefix into a new conversation | Modelled in the schema (`branchedFromId`) and reserved for Phase 5; the MVP ships regenerate/edit instead. |
| Conversation search | `convex/conversations.ts` → `search` scores titles and message bodies | `SamiatiStore.searchConversations` — same idea, simpler implementation. |
| Title-from-first-message | `convex/conversations.ts` → `createAndAddMessage` uses the first sentence | `LocalStore.addMessage` titles the conversation from the first user message. |
| Pinned conversations | `togglePin` | Included in the schema and the store interface. |
| Message actions (copy / regenerate / branch) | `src/routes/chat/[id]/message.svelte` | `components/chat/message-item.tsx` — copy, regenerate, edit, thumbs up/down. |
| Free-tier message accounting | `user_settings.free_messages_used` | Deliberately **not** copied — Samiati has no paywall in the MVP. |
| Cursor-style "rules" | `user_rules` table + `parseMessageForRules` | Deliberately **not** copied — out of scope, and it is a substantial feature of its own. |

### 3.2 What was deliberately not taken

- **The SvelteKit architecture.** Its routing, load functions, form actions,
  `+layout.server.ts` and `$app` imports have no Next.js equivalent that
  would survive translation; the prompt also explicitly forbids migrating it.
- **BetterAuth.** Samiati uses Clerk (already audited above) with a local
  fallback.
- **Melt UI + Tailwind v4 + `unplugin-icons`.** Samiati uses Radix +
  shadcn/ui + Tailwind v3 + `lucide-react`, matching the audited cloneathon
  stack.
- **`neverthrow`.** thom-chat wraps every fallible call in `Result`/`ResultAsync`.
  Samiati uses a single, typed error path in the pipeline (an `error` event)
  instead of threading `Result` through the whole UI.
- **Vercel AI SDK / `openai` package.** Samiati talks to the provider with
  `fetch` against the OpenAI-compatible chat-completions shape, so no
  provider SDK is a dependency.

### 3.3 Quality observations

thom-chat is materially more mature than the cloneathon repo: it has
`eslint`, `prettier`, `vitest`, `playwright`, `svelte-check`, and a real
domain model. It also has known rough edges that Samiati avoids:

- `convex/chat.ts` stores API keys in plaintext in the database (`user_keys`
  table). Samiati keeps all provider keys in server environment variables.
- The Convex functions take a `session_token` argument and re-validate it on
  every call, including inside `ctx.runQuery` calls. Samiati resolves the
  user once per request.
- The `messages` table stores both `content` and a rendered `content_html`
  copy. Samiati renders markdown at display time instead, so there is one
  source of truth.

---

## 4. shadcn/ui

- **Upstream:** https://github.com/shadcn-ui/ui
- **Licence:** MIT
- **Role in Samiati:** the component foundation.

Samiati copies 27 primitives from the cloneathon's `components/ui` (which are
themselves unmodified shadcn/ui) rather than running the shadcn CLI, because
the CLI would pull in newer Radix versions than the audited set and a large
set of components Samiati does not use. The primitives were restyled onto
Samiati's token set; their internals are unchanged.

---

## 5. Licence and attribution summary

| Source | Licence | What was taken | Obligation |
| --- | --- | --- | --- |
| T3 Cloneathon | MIT | 27 shadcn/ui primitives, `cn()` helper, `use-mobile` hook | Keep the MIT notice — see `LICENSE` and the acknowledgements section of `README.md`. |
| thom-chat | MIT | Behavioural patterns only; no source code copied | Attribution in the acknowledgements. |
| shadcn/ui | MIT | Component designs | Attribution in the acknowledgements. |
| T3 Chat (Theo's product) | Proprietary | **Nothing.** | Not copied. |

`samiati` itself is released under the MIT licence. See `LICENSE`.

---

## 6. Conclusions carried into the build

1. The chat product is **built from scratch**; the cloneathon contributed
   scaffolding and UI primitives only.
2. The Convex schema, the AI layer and the domain model are **new**.
3. `eslint`, `tsc --noEmit` and `vitest` are **added**, because the audited
   reference has none of them.
4. The **language registry** (`lib/languages/`) is the spine of the product
   and has no precedent in either reference — it is the main thing that makes
   Samiati different.


