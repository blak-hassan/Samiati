# Implementation Roadmap

Where Samiati is, and what comes next. Phases follow the brief; each one
ends with a runnable application.

Status legend: **Done** · **Partial** · **Planned**

---

## Phase 0 — Repository audit

**Status: Done**

| Deliverable | Where |
| --- | --- |
| Repository inspection report | `docs/repository-audit.md` |
| Licensing report | `docs/repository-audit.md` §5 |
| Dependency analysis | `docs/repository-audit.md` §2.2 |
| Fork-versus-build decision | `docs/fork-vs-build.md` |
| Component reuse inventory | `docs/repository-audit.md` §2.4 |
| Architecture proposal | `docs/architecture.md` |

**The key finding:** the T3 Cloneathon repository is the cloneathon's
competition website, not a chat application. Samiati therefore borrows its
scaffolding and UI primitives but builds the chat product itself.

## Phase 1 — Foundation

**Status: Done**

| Item | Where |
| --- | --- |
| Samiati branding (mark, wordmark, palette) | `components/layout/samiati-logo.tsx`, `app/globals.css` |
| Design system (tokens, type, radius, elevation, motion) | `docs/design-system.md` |
| Sidebar, responsive drawer, app shell | `components/layout/` |
| Routing (App Router, route groups, metadata) | `app/` |
| Responsive layout | `app/globals.css`, `components/layout/app-shell.tsx` |
| Authentication integration (Clerk with a local fallback) | `lib/auth/provider.tsx` |
| Language registry | `lib/languages/` |
| Language selector | `components/language/language-selector.tsx` |
| Onboarding | `app/onboarding/`, `components/onboarding/` |
| Quality gates: eslint, `tsc --noEmit`, vitest | `package.json`, `tests/` |

## Phase 2 — Chat MVP

**Status: Done**

| Item | Where |
| --- | --- |
| Chat interface | `components/chat/chat-view.tsx` |
| Conversation creation, persistence, titles | `lib/data/local-store.ts` |
| Conversation history and search | `components/layout/sidebar.tsx` |
| Streaming | `app/api/chat/route.ts` |
| Message actions: copy, regenerate, edit, delete, feedback | `components/chat/message-item.tsx` |
| Markdown and code blocks | `components/chat/markdown.tsx` |
| Error, loading and empty states | Throughout |
| Keyboard shortcuts, stop generation | `components/chat/chat-input.tsx` |

## Phase 3 — AI integration

**Status: Done**

| Item | Where |
| --- | --- |
| AI service abstraction | `lib/ai/types.ts` |
| Translation middleware | `lib/ai/pipeline.ts` |
| Reasoning provider (OpenAI-compatible) | `lib/ai/providers/openai-compatible.ts` |
| Translation provider (Hugging Face / NLLB-200) | `lib/ai/providers/huggingface.ts` |
| Labelled mock providers | `lib/ai/providers/mock.ts` |
| Error handling and honest degradation | `lib/ai/pipeline.ts` |
| Conversation context with no duplicate requests | `lib/ai/pipeline.ts` (per-turn translation cache) |
| Translation feedback | `MessageMeta`, provenance badge, thumbs up/down |
| Runtime provider resolution | `lib/ai/index.ts` |

## Phase 4 — Changa

**Status: Done**

| Item | Where | Notes |
| --- | --- | --- |
| Contribution dashboard | `components/changa/changa-view.tsx` | Open tasks, submitted, accepted, impact points |
| Translation, validation, correction, comparison and terminology tasks | `lib/data/types.ts`, `convex/changa.ts` | |
| Submission workflow | `SamiatiStore.submitContribution` | Persisted |
| Automated quality checks | `lib/changa/quality.ts` | Six checks: empty/trivial, duplicate, copy-of-accepted, register mismatch, length sanity, script mismatch. They **flag**; they never accept. |
| Composite quality score | `lib/changa/quality.ts` | Weighted across review judgement, agreement, consistency, novelty and reliability — never a raw count. |
| Review queue | `/changa/review` | Ordered by suspicion, not by age. |
| Reviewer reliability and recognition tiers | `lib/changa/recognition.ts` | New reviewers may not approve alone. |
| Moderation actions with an audit log | `convex/changa.ts`, `SamiatiStore.createModerationAction` | Every action is written to the log before it is applied. |
| Contribution profile | `/profile` | |
| Voice contribution tasks | — | Planned. Needs audio storage, consent flows and per-language speech quality criteria. |

## Phase 5 — Discover and Communities

**Status: Done**

| Item | Where | Notes |
| --- | --- | --- |
| Discover page with topics, filters, save and "Discuss" | `components/discover/discover-view.tsx` | |
| Discover ingestion pipeline | `lib/discover/ingest.ts`, `scripts/ingest-discover.ts` | Reads RSS, Atom and JSON feeds that publishers have chosen to publish. Samiati does not scrape. |
| Language-personalised ranking | `lib/discover/rank.ts` | Every score has a named, visible reason. |
| Communities list, membership, language scoping | `components/communities/communities-view.tsx` | |
| Community discussion threads | `components/communities/community-view.tsx` | Threads are scoped to one language. |
| Post moderation | `hideThreadPost` | The post is kept for the audit trail and hidden from the thread. |
| Live African news from a licensed wire | — | The ingestion pipeline is ready for one; the licence is the remaining gap. |

## Phase 6 — Advanced language intelligence

**Status: Done**

| Item | Where | Notes |
| --- | --- | --- |
| Voice input | `lib/ai/browser-voice.ts` | Browser dictation. Only languages with a standard BCP-47 locale are supported, and Samiati says so. |
| Voice output | `lib/ai/browser-voice.ts` | The browser's own synthesiser. No model download, works offline, costs nothing. |
| Streaming translation | `lib/ai/sentence-window.ts` | The answer is translated sentence by sentence as the model writes it, so the reader sees their own language immediately. The English is available in a disclosure. |
| Per-language translation routing | `lib/ai/router.ts` | A dedicated model for a language wins over the general multilingual model. |
| Dataset export | `lib/dataset/pipeline.ts`, `/dataset` | JSONL and CSV, with a checksum and full provenance. |
| Dataset cleaning | `lib/dataset/pipeline.ts` | Normalisation and per-language de-duplication. |
| Quality scoring | `lib/changa/quality.ts`, `lib/dataset/pipeline.ts` | |
| Dataset versioning | `convex/dataset.ts`, `/dataset` | `draft → reviewed → training_ready → released`, with the gates enforced on both sides. |
| Training-readiness gate | `checkReadiness` | A version with no items, no quality score or no provenance cannot become training-ready. |
| Evaluation harness | `lib/dataset/evaluate.ts` | chrF (character n-gram F-score) plus word error rate, reported per language with the worst samples kept for inspection. |
| Fine-tuning infrastructure | `scripts/export-dataset.ts`, `/dataset` | A training-ready manifest and split. **Not** a trainer: Samiati produces the data, it does not train foundation models. |
| Playwright end-to-end tests | `e2e/samiati.spec.ts` | Runs against the production build with the local backend. |
| Convex live queries | — | Planned. The store contract is deliberately non-reactive so both backends behave identically; moving to live queries is a change to one provider. |
| Model-based language identification | — | Planned. The heuristic detector is adequate and free; the seam (`TranslationService.detectLanguage`) already exists. |

---

## What is deliberately not planned

| Item | Why |
| --- | --- |
| A user-facing model selector | Samiati's differentiator is that there isn't one. |
| A mobile native app | The web app is mobile-first; a native client is a distribution decision, not a technical necessity. |
| Training a foundation model from scratch | Out of reach. Samiati fine-tunes and evaluates open models. |
| Live news scraping | Licensing and reliability. A publisher's own feed is the right answer. |

---

## Current state

```
npm install
npm run dev        → http://localhost:3000, fully working, no keys needed

npm run typecheck  → tsc --noEmit
npm run lint       → eslint
npm test           → vitest (131 unit tests)
npm run build      → next build (type errors fail the build)
npm run test:e2e   → playwright (needs a build first)
```

Adding a provider key to `.env.local` switches Samiati from the labelled
placeholder to a real model, with no code change.

### The scripts

| Script | What it does |
| --- | --- |
| `npm run ingest:discover -- --url <feed-url>` | Fetch a publisher's feed and write `public/discover-feed.json`. The app merges it into the catalogue on load. |
| `node scripts/export-dataset.ts --help` | Build a training-ready dataset manifest from a contributions export. |
| `node scripts/repair-encoding.mjs <file…>` | Repair UTF-8 files mangled by a Windows PowerShell round-trip. |
