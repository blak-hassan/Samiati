# Samiati

**AI in the languages of Africa.**

Samiati is an African-language-first AI application. Instead of choosing a
model, you choose a **language** — and Samiati answers in it.

Built as an independent product inspired by (and audited against)
[T3 Chat](https://t3.chat), [t3-cloneathon](https://github.com/T3-Content/t3-cloneathon)
and [thom-chat](https://github.com/TGlide/thom-chat).

---

## What makes it different

| | A typical AI chat app | Samiati |
| --- | --- | --- |
| Primary control | A model picker | A **language** picker |
| Eleven African languages | Uneven or absent | First-class, with honest coverage badges |
| Translation | Hidden or absent | A first-class, transparent pipeline step |
| Contributing data | Not possible | **Changa** — contribute translations that improve the models |
| Running it | Needs an account and keys | Works fully with **no keys, no account, no server** |

## Supported languages

Kiswahili · Sheng · Kikuyu · Luhya · Dholuo · Somali · Kamba · Kalenjin ·
Gusii · Meru · Maasai · English

Each language declares how well translation and voice are supported, and the
selector shows that before you choose. Samiati never pretends that Sheng and
Maasai have the same coverage as Kiswahili.

---

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. That's it — no API keys, no account, no
database. Samiati runs in **local mode**: conversations and contributions are
stored in your browser and never leave the device.

The assistant will tell you plainly that it is running a placeholder until
you connect a model.

### Connecting a model

```bash
cp .env.example .env.local
# add your keys to .env.local
npm run dev
```

| Variable | Effect |
| --- | --- |
| `SAMIATI_REASONING_API_KEY` (or `OPENAI_API_KEY`) | Turns on the real reasoning model. |
| `SAMIATI_REASONING_BASE_URL` | Any OpenAI-compatible endpoint — OpenRouter, Groq, Together, vLLM, Ollama. |
| `SAMIATI_REASONING_MODEL` | Defaults to `gpt-4o-mini`. |
| `HUGGINGFACE_API_KEY` | Turns on the real translation model (NLLB-200). |
| `NEXT_PUBLIC_CONVEX_URL` | Switches persistence from local storage to Convex. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Turns on accounts. |

No code change is needed to switch any of these.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (type errors fail the build) |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `eslint` |
| `npm test` | `vitest` — 38 unit tests |
| `npm run test:watch` | Vitest in watch mode |

---

## What is built

- **Chat** — streaming replies, markdown, code blocks, copy, regenerate,
  edit-and-resend, retry, feedback, stop generation, conversation history and
  search.
- **Language selector** — searchable, diacritic-insensitive, with favourites,
  recently used, and a coverage badge per language.
- **Changa** — a contribution platform: task queue, submission, review,
  contribution history, recognition and impact statistics.
- **Discover** — African news, culture, history and education, filterable by
  topic and language, openable in a conversation.
- **Communities** — language-scoped spaces with real membership.
- **Profile** — languages, contribution statistics, activity heat map,
  recognition.
- **Settings** — language, appearance, accessibility, privacy, data consent
  and translation transparency.
- **Onboarding** — first-run language selection.

Discover and Changa currently show **clearly-labelled sample content**. The
submission, review, membership and save flows are real and persist.

---

## Documentation

| Document | What it covers |
| --- | --- |
| [`docs/repository-audit.md`](docs/repository-audit.md) | What was actually found in the reference repositories |
| [`docs/fork-vs-build.md`](docs/fork-vs-build.md) | Why Samiati is a new repository, not a fork |
| [`docs/architecture.md`](docs/architecture.md) | How the system is put together |
| [`docs/product-requirements.md`](docs/product-requirements.md) | Scope, with per-requirement status |
| [`docs/sitemap.md`](docs/sitemap.md) | Every route and the navigation model |
| [`docs/design-system.md`](docs/design-system.md) | Colour, type, spacing, motion, accessibility |
| [`docs/database-schema.md`](docs/database-schema.md) | The domain model and the Convex schema |
| [`docs/ai-pipeline.md`](docs/ai-pipeline.md) | Translate → reason → translate, and how it fails |
| [`docs/changa-architecture.md`](docs/changa-architecture.md) | The contribution platform and the dataset pipeline |
| [`docs/implementation-roadmap.md`](docs/implementation-roadmap.md) | Phase-by-phase status |
| [`docs/decisions/`](docs/decisions/) | Architecture decision records |

---

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v3 ·
shadcn/ui (Radix) · Convex · Clerk · lucide-react · Vitest

## Licence

MIT — see [`LICENSE`](LICENSE).

## Acknowledgements

- **shadcn/ui** — MIT. The component primitives.
- **[t3-cloneathon](https://github.com/T3-Content/t3-cloneathon)** — MIT,
  © Theo Browne. The scaffolding and the 27 shadcn/ui primitives that were
  copied into `components/ui`.
- **[thom-chat](https://github.com/TGlide/thom-chat)** — MIT, © Thomas G.
  Lopes. Studied for streaming, conversation management and message-action
  behaviour. No source code was copied.
- **[T3 Chat](https://t3.chat)** — the product this was inspired by. No
  proprietary code was used.
