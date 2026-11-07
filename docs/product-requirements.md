# Product Requirements

What Samiati is, for whom, and what it must do. This document defines scope;
`docs/implementation-roadmap.md` defines the order it is built in.

---

## 1. The problem

General-purpose AI assistants are good at English and at major world
languages. They are uneven — sometimes poor — across the African languages
that millions of people actually think in: Kikuyu, Dholuo, Sheng, Kamba,
Luhya, Kalenjin, Somali, Gusii, Meru, Maasai.

Where these languages are supported, the user is still asked to choose a
*model* before they can ask a question. That question means nothing to
someone who wants to write a letter to their landlord in Dholuo.

Samiati flips the model. The user picks a **language**, and Samiati handles
the model, the translation and the reasoning.

## 2. Users

| User | Need |
| --- | --- |
| **The everyday speaker** | Ask a question, write a letter, understand a notice — in the language they think in, without reading English instructions. |
| **The student** | Learn how a concept is explained in their own language, not in a translation of a textbook. |
| **The contributor** | Teach the model their language by writing, validating and correcting text. |
| **The language steward** | Keep their language's coverage honest, moderate the community, and watch the impact of their work. |
| **The developer** | Swap providers, run locally, and read a codebase that documents its decisions. |

## 3. Principles

1. **Language first, always.** The language selector is the primary control.
   Models are an implementation detail and are never surfaced.
2. **Honesty about coverage.** Every language declares how well translation
   and voice are supported. Samiati never implies parity it does not have.
3. **No fake intelligence.** A mock provider is labelled as a mock, in the
   reply itself and in the UI.
4. **Works without a server, an account or a key.** The default is a
   complete, runnable product on one device.
5. **Low bandwidth.** The target device is a mid-range Android on a metered
   3G connection.
6. **Every interaction works.** No dead buttons, no placeholder routes.
7. **Community ownership.** The data that improves the models comes from the
   people who speak them, with explicit consent.

## 4. Language support

### 4.1 The eleven languages

| Language | Native | Region | ISO | Translation | Voice |
| --- | --- | --- | --- | --- | --- |
| Kiswahili | Kiswahili | East Africa | `sw` | Full | Beta |
| Sheng | Sheng | Kenyan cities | — (register of `sw`) | Beta | Limited |
| Kikuyu | Gĩkũyũ | Central Kenya | `ki` | Beta | Limited |
| Luhya | Luhya | Western Kenya | `luy` | Limited | Limited |
| Dholuo | Dholuo | Nyanza | `luo` | Beta | Limited |
| Somali | Soomaali | Horn of Africa | `so` | Beta | Beta |
| Kamba | Kĩkamba | Eastern Kenya | `kam` | Limited | Limited |
| Kalenjin | Kalenjin | Rift Valley | `kln` | Limited | Limited |
| Gusii | Ekegusii | Nyanza | `ggc` | Limited | Limited |
| Meru | Kimeru | Eastern Kenya | `mer` | Limited | Limited |
| Maasai | Kimaasai | Kenya & N. Tanzania | `mas` | Limited | Planned |

English is also available as the pivot language of the pipeline.

**Coverage is a per-language property, not a global one.** Sheng is not
"limited Swahili" — it is an urban sociolect with its own vocabulary, and
Samiati models it as a register of Kiswahili rather than pretending it is a
separate ISO language.

### 4.2 The language registry contract

Every language record carries: stable id, display name, native name, ISO code
where one exists, region, countries, dialect notes, description, text
direction, script, translation coverage, voice coverage, status, cultural
motif, accent class, greeting, sample phrase and its English meaning.

**Ids are permanent.** They are persisted in the database and in preferences.

## 5. Functional requirements

### 5.1 Navigation and shell — FR-1

| ID | Requirement | Status |
| --- | --- | --- |
| FR-1.1 | A persistent sidebar with New chat, Search, Chat history, Discover, Changa, Communities, Profile, Settings. | Done |
| FR-1.2 | The sidebar collapses into a mobile drawer, reusing the same component. | Done |
| FR-1.3 | The sidebar shows Samiati branding, a new-conversation button, conversation search, recent chats, navigation icons and the user's profile. | Done |
| FR-1.4 | The sidebar is responsive and does not overflow on a 360px viewport. | Done |

### 5.2 Language selection — FR-2

| ID | Requirement | Status |
| --- | --- | --- |
| FR-2.1 | A searchable language dropdown with display names, native names and availability indicators. | Done |
| FR-2.2 | Favourite languages are pinned to the top of the list. | Done |
| FR-2.3 | Recently used languages are shown in their own group. | Done |
| FR-2.4 | The selected language is visibly indicated. | Done |
| FR-2.5 | The selector is reachable from onboarding, the chat header, conversation settings, the profile page and settings. | Done (onboarding, chat header, profile, settings) |
| FR-2.6 | Language selection persists according to the user's preferences. | Done |
| FR-2.7 | Search ignores diacritics, so "gikuyu" finds "Gĩkũyũ". | Done |

### 5.3 Chat — FR-3

| ID | Requirement | Status |
| --- | --- | --- |
| FR-3.1 | New conversations, persistent across reloads. | Done |
| FR-3.2 | Conversation titles, derived from the first user message, and renameable. | Done |
| FR-3.3 | Conversation search by title. | Done |
| FR-3.4 | Streaming AI responses. | Done |
| FR-3.5 | Markdown rendering with headings, lists, tables and links. | Done |
| FR-3.6 | Code blocks with a copy button. | Done |
| FR-3.7 | Copy a response. | Done |
| FR-3.8 | Regenerate a response. | Done |
| FR-3.9 | Edit a user message and resend. | Done |
| FR-3.10 | Retry a failed message. | Done |
| FR-3.11 | Delete a conversation. | Done |
| FR-3.12 | Feedback controls (up / down). | Done |
| FR-3.13 | Responsive layout; the composer stays reachable on a phone. | Done |
| FR-3.14 | Keyboard shortcuts: Enter sends, Shift+Enter adds a line. | Done |
| FR-3.15 | Loading, empty and error states. | Done |
| FR-3.16 | Network failure handling with a retry path. | Done |
| FR-3.17 | Stop generating mid-stream, keeping the partial reply. | Done |
| FR-3.18 | Branching conversations. | Planned (Phase 5) |

### 5.4 Discover — FR-4

| ID | Requirement | Status |
| --- | --- | --- |
| FR-4.1 | Sections: Trending, African news, Technology, Culture, History, Education, Community topics. | Done |
| FR-4.2 | Read summaries. | Done |
| FR-4.3 | Select content and discuss it with Samiati. | Done |
| FR-4.4 | Save content. | Done |
| FR-4.5 | Filter by topic and by language. | Done |
| FR-4.6 | No live scraping or expensive AI pipelines in the first phase. | Done — the content is clearly labelled as sample editorial content. |

### 5.5 Changa — FR-5

| ID | Requirement | Status |
| --- | --- | --- |
| FR-5.1 | Contribution dashboard. | Done |
| FR-5.2 | Translation, validation, correction, comparison and terminology tasks. | Done |
| FR-5.3 | Voice contribution tasks. | Planned (Phase 6) |
| FR-5.4 | Language communities. | Done |
| FR-5.5 | Contribution history. | Done |
| FR-5.6 | Recognition and impact statistics. | Done |
| FR-5.7 | Task feedback (review decisions and reviewer feedback). | Done |
| FR-5.8 | Moderation. | Modelled (`moderatorIds`), not implemented — Phase 4 |
| FR-5.9 | The submission → validation → review → acceptance → recognition → dataset-eligibility workflow. | Done, with the dataset-eligibility stage designed rather than implemented — Phase 6 |

### 5.6 Profile — FR-6

| ID | Requirement | Status |
| --- | --- | --- |
| FR-6.1 | Avatar and username. | Done |
| FR-6.2 | Preferred languages. | Done |
| FR-6.3 | Contribution statistics. | Done |
| FR-6.4 | Contribution heat map. | Done (labelled as sample data until Changa is live) |
| FR-6.5 | Communities. | Done |
| FR-6.6 | Recognition. | Done |
| FR-6.7 | Language impact. | Done |
| FR-6.8 | Recent activity. | Done |
| FR-6.9 | Account preferences. | Done |

### 5.7 Settings — FR-7

| ID | Requirement | Status |
| --- | --- | --- |
| FR-7.1 | Language preferences (default, favourites, recents). | Done |
| FR-7.2 | Voice preferences. | Present but disabled, with the reason stated — Phase 6 |
| FR-7.3 | Appearance (light / dark / system). | Done |
| FR-7.4 | Accessibility (reduce motion). | Done |
| FR-7.5 | Privacy (where data is stored, clear local data). | Done |
| FR-7.6 | Account. | Done |
| FR-7.7 | Data contribution consent. | Done — persisted to the user record |
| FR-7.8 | Translation transparency (show provenance badges). | Done |
| FR-7.9 | AI response preferences. | Done |

## 6. Non-functional requirements

| ID | Requirement | How it is met |
| --- | --- | --- |
| NFR-1 | Mobile-first. | Single-column layout below 640px; the composer is pinned. |
| NFR-2 | Bandwidth-conscious. | No analytics vendor, no chart library, local-first data, self-hosted fonts, ~103 kB shared JS. |
| NFR-3 | Keyboard accessible. | Full keyboard operation, visible focus rings, Radix focus management. |
| NFR-4 | Screen-reader friendly. | Labelled controls, live regions, semantic landmarks. |
| NFR-5 | Clear loading and empty states. | Skeletons, empty-state copy, inline status. |
| NFR-6 | Optimistic interactions. | The user message is persisted and shown before the reply starts. |
| NFR-7 | Context preserved across navigation. | Preferences live above the router. |
| NFR-8 | Type-safe. | TypeScript in strict mode; `tsc --noEmit` gates the build. |
| NFR-9 | Documented decisions. | `docs/` and `docs/decisions/`. |
| NFR-10 | No secrets in the browser. | Provider keys are read only in the route handler. |
| NFR-11 | Preserved data across migrations. | Additive-only migrations; language ids are immutable. |

## 7. Explicitly out of scope for the MVP

| Out of scope | Why | When |
| --- | --- | --- |
| Live African news ingestion | Needs a licensed feed and a summarisation pipeline. | Phase 5 |
| Voice input and output | Needs speech models and quality bars per language. | Phase 6 |
| Payment and subscriptions | The MVP has no paywall. | Phase 5 |
| Account recovery, email verification | Clerk handles these when configured. | — |
| Fine-tuning from Samiati data | Needs the dataset pipeline to exist. | Phase 6 |
| Community discussion threads | Needs moderation tooling. | Phase 5 |

## 8. Success measures

| Measure | Target |
| --- | --- |
| Time to first reply | Under 8 seconds for a 100-word answer, including translation. |
| Time to first useful output (stream starts) | Under 3 seconds. |
| Languages with at least "beta" translation | 11 of 11 by the end of Phase 3. |
| Changa contributions accepted per week per active community | 50+, with a quality score above 0.75. |
| Crash-free sessions | Above 99.5%. |
| First-load JS per route | Under 300 kB. |
