# Architecture

How Samiati is put together, and why.

---

## 1. Shape of the system

```
┌─────────────────────────────────────────────────────────────────┐
│                          Browser                                │
│                                                                 │
│  app/(app)/* ── pages                                          │
│      ├── chat      → ChatScreen → ChatView → MessageItem        │
│      ├── discover  → DiscoverView                               │
│      ├── changa    → ChangaView                                 │
│      ├── communities → CommunitiesView                          │
│      ├── profile   → ProfileView                                │
│      └── settings  → SettingsView                              │
│                                                                 │
│  Providers (app/providers.tsx)                                  │
│      ThemeProvider                                               │
│        └─ SamiatiAuthProvider   (Clerk | Local)                 │
│             └─ SamiatiDataProvider   (LocalStore | ConvexStore) │
│                  ├─ LanguagePreferencesProvider                  │
│                  └─ PreferencesProvider                         │
│                                                                 │
│  lib/languages  ── the language registry (single source)       │
│  lib/data       ── domain types + SamiatiStore                  │
│  lib/ai         ── service interfaces + providers + pipeline    │
└───────────────────────────┬─────────────────────────────────────┘
                            │  POST /api/chat  (NDJSON stream)
┌───────────────────────────▼─────────────────────────────────────┐
│                       Next.js server                            │
│                                                                 │
│  app/api/chat/route.ts                                          │
│      └── runChatPipeline()                                      │
│            ├── TranslationService   (HuggingFace | Mock)         │
│            └── ReasoningService     (OpenAI-compatible | Mock)   │
│                                                                 │
│  Secrets are read here only. Never in the browser.              │
└─────────────────────────────────────────────────────────────────┘
```

The shape follows three rules:

1. **The browser never holds a secret.** Provider keys are read in the route
   handler and nowhere else.
2. **The browser never talks to a provider.** It talks to `/api/chat`,
   which speaks the provider's protocol.
3. **No component knows which backend it is on.** Components ask the store.

---

## 2. Directory map

```
app/
├── api/chat/route.ts        Streaming chat endpoint (NDJSON)
├── (app)/                   The signed-in product (sidebar shell)
│   ├── layout.tsx           → AppShell
│   ├── page.tsx             → WelcomePanel (new chat)
│   ├── chat/[id]/page.tsx   → ChatScreen
│   ├── discover/page.tsx
│   ├── changa/page.tsx
│   ├── communities/page.tsx
│   ├── profile/page.tsx
│   └── settings/page.tsx
├── onboarding/page.tsx      First-run language selection
├── globals.css              Design tokens
├── layout.tsx               Root layout, fonts
└── providers.tsx            Client provider boundary

components/
├── chat/                    chat-view, chat-screen, chat-input,
│                            message-item, markdown, welcome-panel
├── changa/                  changa-view
├── communities/             communities-view
├── discover/                discover-view
├── language/                language-selector
├── layout/                  app-shell, sidebar, samiati-logo
├── onboarding/              onboarding-view
├── profile/                 profile-view
├── settings/                settings-view
├── theme-provider.tsx
└── ui/                      27 shadcn/ui primitives (MIT, from t3-cloneathon)

lib/
├── ai/
│   ├── types.ts             Service interfaces
│   ├── pipeline.ts          translate → reason → translate
│   ├── index.ts             Runtime provider resolution
│   └── providers/           mock, huggingface, openai-compatible
├── data/
│   ├── types.ts             Domain model
│   ├── store.ts             SamiatiStore interface
│   ├── local-store.ts       Browser-storage backend
│   ├── convex-store.ts      Convex backend
│   ├── provider.tsx         React context
│   └── seed.ts              Sample content
├── languages/
│   ├── types.ts
│   ├── registry.ts          ← the language registry
│   ├── capability.ts
│   ├── starters.ts
│   └── index.ts             Search & ordering
├── auth/provider.tsx        Clerk | Local identity
├── language-preferences/    Active language, favourites, recents
├── preferences/             Appearance, accessibility, transparency
├── runtime.ts               Which backend/providers are active
└── utils.ts                 cn()

convex/                      Convex backend (own tsconfig)
docs/                        This documentation
tests/                       vitest suite
```

---

## 3. The four layers

### 3.1 Language layer (`lib/languages`)

Pure data and pure functions. No React, no I/O. The registry is the only
place that knows a language exists, what it is called, how well it is
supported, and which direction it reads. See
[ADR 0004](./decisions/0004-language-registry-as-single-source-of-truth.md).

### 3.2 Data layer (`lib/data`)

`SamiatiStore` is an asynchronous CRUD contract over the whole domain:
users, conversations, messages, contribution tasks, contributions, reviews,
communities and Discover items.

Two implementations:

- **`LocalStore`** — `localStorage`, synchronous under the hood, no server.
  The default. See [ADR 0003](./decisions/0003-local-first-data-backend.md).
- **`ConvexStore`** — talks to Convex over HTTP, so it works from the server
  and the browser without a React provider.

The store is deliberately **not** reactive. Mutations return the updated
record; the UI updates its own state and re-fetches lists. This keeps the two
backends behaviourally identical.

### 3.3 AI layer (`lib/ai`)

Four interfaces, a pipeline, and providers. See
[`ai-pipeline.md`](./ai-pipeline.md) and
[ADR 0002](./decisions/0002-provider-agnostic-ai-services.md).

The pipeline is a pure async generator over events, so it can be tested
without a browser or a network:

```ts
type PipelineEvent =
  | { type: "stage";    stage: PipelineStage; message?: string }
  | { type: "delta";    text: string; stage: "reasoning" | "translation" }
  | { type: "final";    text: string; languageId: string; meta: MessageMeta }
  | { type: "error";    message: string };
```

### 3.4 Presentation layer (`components`, `app`)

React only. Components read from context and call store methods. The only
component that performs network I/O of consequence is `ChatView`, which
consumes the `/api/chat` stream.

---

## 4. Request lifecycle for one turn

```
User types "Habari za asubuhi" and presses Enter
  │
  ├─ ChatView.sendMessage()
  │    ├─ store.addMessage({ role: "user", … })      ← persisted first
  │    └─ POST /api/chat { message, languageId, history }
  │
  ├─ route handler
  │    ├─ resolveAiRuntime()                          ← picks providers
  │    └─ for await (event of runChatPipeline(...)):
  │         ├─ stage "translate-input"     → NDJSON line → browser
  │         ├─ delta  (reasoning text)     → NDJSON line → browser
  │         ├─ stage "translate-output"    → NDJSON line → browser
  │         ├─ delta  (translated text)    → NDJSON line → browser
  │         └─ final { text, meta }        → NDJSON line → browser
  │
  └─ ChatView
       ├─ renders the reasoning stream live
       ├─ replaces it with the translated text when it arrives
       └─ store.addMessage({ role: "assistant", meta })  ← persisted once
```

The reply is persisted **once**, when it is complete. The alternative —
persisting every chunk — was rejected: it multiplies writes, and a
half-written assistant message is a bad thing to find in the history.

---

## 5. Streaming protocol

`app/api/chat/route.ts` responds with `application/x-ndjson`. Each line is a
complete JSON object. The client splits on newlines and parses each line
independently; a malformed line is skipped rather than killing the reply.

```
{"type":"stage","stage":"translate-input","message":"Translating from Kiswahili…"}
{"type":"delta","text":"Good ","stage":"reasoning"}
{"type":"delta","text":"morning.","stage":"reasoning"}
{"type":"stage","stage":"translate-output","message":"Translating into Kiswahili…"}
{"type":"delta","text":"Habari za asubuhi.","stage":"translation"}
{"type":"final","text":"Habari za asubuhi.","languageId":"kiswahili","meta":{…}}
```

The response sets `X-Accel-Buffering: no` and
`Cache-Control: no-cache, no-transform` so that reverse proxies do not buffer
the stream.

---

## 6. Why the reply shows English first

The reasoning model answers in English and the answer is then translated
into the user's language. Two consequences follow:

1. **The user sees the reasoning stream live** in English while the model
   writes. This keeps the interface responsive even though the translation
   step is not streamable.
2. **The final text is the translation**, and the metadata records that it
   was translated, so the UI can label it.

This is an honest trade-off. A streaming translation model would remove the
intermediate English text, but at the time of writing no provider offers
reliable, cheap, streaming translation for all eleven target languages.
`MessageMeta.inputTranslated` and `MessageMeta.translated` exist so the UI
can state precisely what happened.

---

## 7. Error handling

| Failure | Behaviour |
| --- | --- |
| Reasoning provider unreachable | The pipeline yields an `error` event. The reply is persisted with `status: "error"` and an error message; the UI shows an alert and a retry control. |
| Output translation fails | The English answer is delivered; `meta.translated` is `false`; a stage message explains what happened. The user is never silently given an English answer inside a Kiswahili conversation. |
| Input translation fails | The original text is passed to the reasoning model unchanged; `meta.inputTranslated` is `false`; a stage message explains it. |
| Network drops mid-stream | The browser's `AbortError` path keeps whatever text had arrived and persists it as a complete reply. |
| Store unavailable | Every store call is wrapped; pages render an empty state rather than crashing. |

---

## 8. Performance and bandwidth

The brief calls for low-bandwidth operation. The choices that serve it:

- **No chart library.** The profile heat map is CSS.
- **No analytics vendor.** No third-party script is loaded.
- **Markdown rendered at display time**, so only raw text is stored and
  transferred.
- **Local-first data.** In local mode a conversation never leaves the device.
- **Fonts are self-hosted** by `next/font`, so there is no render-blocking
  request to a third party.
- **The first-load JavaScript budget** is visible in the build output
  (103 kB shared, 234 kB worst route). A target of under 300 kB per route is
  a reasonable budget for a phone on a slow connection.

---

## 9. Accessibility

- Every interactive element has an accessible name (`aria-label`).
- Focus is visible everywhere: a global `:focus-visible` ring in
  `app/globals.css`, and Radix primitives preserve their own focus traps.
- Streaming status is announced (`role="status"`, `aria-live="polite"`).
- The in-app **Reduce motion** preference adds a `.reduce-motion` class to
  the document, and the stylesheet honours `prefers-reduced-motion`.
- Colour is never the only signal: availability badges carry text as well as
  a dot.
- The language selector is a `cmdk` command palette — keyboard navigable, and
  its search is diacritic-insensitive.

---

## 10. Security

| Concern | Mitigation |
| --- | --- |
| Provider keys | Server environment variables only. No key is ever referenced from a client component. `lib/runtime.ts` exposes booleans and labels, never secrets. |
| Model output rendering | `react-markdown` with **no** `rehype-raw`. Raw HTML from a model is never injected into the page. Links get `rel="noopener noreferrer"`. |
| Prompt injection into stored content | Stored messages are plain text; only the app's own routes render them. |
| Cross-user data access | Every Convex query and mutation resolves the current user and verifies ownership before reading or writing. `LocalStore` is single-user by construction. |
| Data deletion | Settings → Data and privacy → **Clear local data** removes every `samiati:*` key from `localStorage`. |

---

## 11. Testing strategy

| Layer | Tool | What is covered |
| --- | --- | --- |
| Language registry | vitest | The eleven required languages are present; ids are unique and stable; every record carries the metadata the UI needs; search is diacritic-insensitive; Sheng is modelled as a register. |
| AI pipeline | vitest | Translate-in → reason → translate-out; no translation for English; no duplicate translation calls; honest degradation when either translation direction fails; reasoning failures surface as an `error` event. |
| Data layer | vitest | Conversation lifecycle, message ordering, deletion cascade, search, contribution submission and review, community membership, saved items. |
| Type safety | `tsc --noEmit` | The whole application. |
| Lint | `eslint` | `next/core-web-vitals` plus the project's own rules. |
| Build | `next build` | Type errors fail the build (`ignoreBuildErrors: false`). |

Browser-level end-to-end tests are a Phase 6 item; the reference project
thom-chat uses Playwright and Samiati will adopt it once the surfaces stop
moving.

---

## 12. Extension points

| Extension | Where |
| --- | --- |
| A new language | `lib/languages/registry.ts` + optional `lib/languages/starters.ts` |
| A new AI provider | `lib/ai/providers/<name>.ts` + a branch in `resolveAiRuntime()` |
| A new persistence backend | Implement `SamiatiStore`; add a branch in `lib/data/provider.tsx` |
| A new domain entity | `lib/data/types.ts` + `SamiatiStore` + the Convex schema and functions |
| A new page | `app/(app)/<name>/page.tsx` |
| A new contribution task type | `lib/data/types.ts` (`ContributionTaskType`), `lib/data/seed.ts`, `convex/schema.ts`, `convex/changa.ts` |


