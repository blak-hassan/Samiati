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

**Remaining in this phase:** streaming translation (Phase 6), and a
model-based language detector (Phase 6).

## Phase 4 — Changa MVP

**Status: Partial**

| Item | Status |
| --- | --- |
| Contribution dashboard | Done |
| Translation, validation, correction, comparison and terminology tasks | Done |
| Submission workflow | Done |
| Validation and review | Done |
| Contribution profile | Done |
| Basic review system | Done |
| Moderator-only review | Planned |
| Automated quality checks (duplicate, copy, register, script) | Planned |
| Reviewer reliability scoring | Planned |
| Community moderation actions and an audit log | Planned |

The gap between "done" and "planned" is the moderation and quality-checking
layer, which needs a real reviewer pool before it can be implemented
honestly.

## Phase 5 — Discover and Communities

**Status: Partial**

| Item | Status |
| --- | --- |
| Discover page with topics, filters, save and "Discuss" | Done |
| Discover content pipeline | Planned — needs a licensed feed and a summarisation pipeline |
| Communities list, membership, language scoping | Done |
| Community discussion threads | Planned |
| Community moderation tools | Planned |
| User personalisation of Discover | Planned |

## Phase 6 — Advanced language intelligence

**Status: Planned**

| Item | Notes |
| --- | --- |
| Voice input and output | Web Speech API first for the browser; per-language ASR/TTS models second. The `SpeechRecognitionService` and `SpeechSynthesisService` interfaces are already defined. |
| Improved translation models | Per-language models where NLLB's coverage is weak; a routing layer that picks the best model per language pair. |
| Dataset export | `DatasetExporter` interface, `DatasetVersion` records with provenance and checksums. |
| Quality scoring | The composite model in `docs/changa-architecture.md` §5.1. |
| Evaluation | Per-language evaluation sets built from accepted contributions. |
| Fine-tuning infrastructure | Only from reviewed, scored, versioned datasets. |
| Streaming translation | Removes the intermediate English text. |
| Convex live queries | Replaces the re-fetch-after-mutation pattern. |
| Playwright end-to-end tests | Following thom-chat's approach. |

---

## What is deliberately not planned

| Item | Why |
| --- | --- |
| A user-facing model selector | Samiati's differentiator is that there isn't one. |
| A mobile native app | The web app is mobile-first; a native client is a distribution decision, not a technical necessity. |
| Training a foundation model from scratch | Out of reach. Samiati fine-tunes and evaluates open models. |
| Live news scraping | Licensing and reliability. A licensed feed is the right answer. |

---

## Current state

```
npm install
npm run dev        → http://localhost:3000, fully working, no keys needed

npm run typecheck  → tsc --noEmit
npm run lint       → eslint
npm test           → vitest (38 tests)
npm run build      → next build (type errors fail the build)
```

Adding a provider key to `.env.local` switches Samiati from the labelled
placeholder to a real model, with no code change.
