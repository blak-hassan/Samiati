# Samiati QA / user-simulation

Free, open-source, local-first QA system for the Samiati app:
(a) deterministic browser tests, (b) AI persona simulation, (c)
Kenyan-language quality evaluation, (d) local load testing.

All QA code lives under `/qa`. App source is not modified except the
dev-only mock AI hook (Phase 2). Everything runs locally; no paid tools,
no production targets.

## Prerequisites

- Node.js (repo uses v24.11.1) + npm
- Playwright browsers installed (already present in this checkout)
- `npm install` run at repo root

No API keys are required for default runs: the app starts in demo mode
(mock Clerk/Convex) and QA uses mock AI by default.

## Environment

Copy `qa/.env.qa.example` to `qa/.env.qa.local` (git-ignored) and set
values locally. Names only are committed; never values.

## Scripts (run from repo root)

| Script | Purpose |
|--------|---------|
| `npm run qa:smoke` | Phase 1 stage 1: home page smoke test |
| `npm run qa:mock-ai` | Phase 2: mock AI scenario + production-disable tests |
| `npm run qa:e2e` | Full deterministic Playwright suite |
| `npm run qa:personas` | Phase 3: AI persona simulation |
| `npm run qa:eval` | Phase 4: Kenyan-language quality evaluation |
| `npm run qa:load` | Phase 6: k6 load test (localhost only) |
| `npm run qa:report` | Phase 5: generate timestamped reports |
| `npm run qa:ci` | smoke + e2e + eval (CI-style, mock AI) |

## Commands

```
# Stage 1 (implemented): home smoke test
npm run qa:smoke

# Phase 2: mock AI scenarios + production-disable guard
npm run qa:mock-ai

# Full e2e suite (includes mock AI + real-provider stub)
npm run qa:e2e

# With real provider (opt-in, capped)
QA_REAL_PROVIDER=1 npm run qa:e2e
```


## Layout

```
qa/
  playwright.config.ts   # QA Playwright project (localhost:3000, npm run dev)
  env/guard.ts           # server-side NODE_ENV + QA_MOCK_AI gate
  .env.qa.example        # env var names only
  README.md              # this file
  e2e/
    page-objects/        # BasePage, HomePage, ...
    smoke/home.spec.ts   # Phase 1 stage 1
    language.spec.ts
    chat.spec.ts
    states.spec.ts
    auth.spec.ts
    profile.spec.ts
    discover.spec.ts
    changa.spec.ts
    voice.spec.ts
    a11y.spec.ts
    responsive.spec.ts
    mock-ai-production.spec.ts
    mock-ai-scenarios.spec.ts
    real-provider/            # Phase 2: real-provider opt-in (off by default)
  mock-ai/                    # Phase 2: dev-only mock AI server + scenarios + guard
    server.ts                 # standalone HTTP mock AI server (localhost)
    provider.ts               # mock Convex ChatProvider (dev-only hook)
  personas/              # persona JSON + runner + JSONL out/
  datasets/              # schema.json, cases.jsonl, reviewer/
  eval/                  # deterministic checks, chrF, run
  load/                  # k6 + concurrent Playwright UI load
  reports/               # git-ignored, timestamped
  scripts/               # scrub-secrets, gen-report
```

## Free-tool requirements

- Playwright Test + Chromium (local) — browser tests, axe-core a11y
- vitest — deterministic unit checks
- k6 (or autocannon fallback) — load testing, localhost only
- Ollama (optional) — vision-capable LLM for personas; text-model fallback
- sacrebleu (Node port) — chrF/chrF++ metric (verified cases only)

## Security

- Mock AI is server-side gated: `NODE_ENV !== "production" && QA_MOCK_AI === "1"`.
  It cannot be enabled by query string, header, cookie, or client code in
  production. A test asserts the mock is disabled under `NODE_ENV=production`.
- Reports are scrubbed for API keys/tokens/cookies/emails before being
  written; the scrub step fails the run if secrets are detected.
- Datasets and reports are git-ignored/local-only.
