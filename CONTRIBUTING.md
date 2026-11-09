# Contributing to Samiati

Thanks for helping build an AI that speaks the languages of Africa. This
document covers how to get set up and what we expect from a change.

## Getting set up

```bash
git clone <your-fork-url> samiati
cd samiati
npm install
npm run dev
```

Node **22.18 or newer** is required: the CLI scripts run TypeScript directly,
and Node has to be able to execute it without a loader.

You do **not** need API keys, an account or a Convex deployment. Samiati runs
in local mode by default.

Before opening a pull request:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

All four must pass. Type errors fail the build — that is deliberate.

`npm run typecheck` covers both halves of the project: the app
(`tsc --noEmit`) and the Convex backend
(`npm run typecheck:convex`). The backend check needs the generated
`convex/_generated` types, which `scripts/generate-convex-types.mjs` writes
from the installed `convex` package — `npx convex codegen` needs a
deployment, so it cannot run in CI or on a fresh clone. The generated files
are git-ignored; the script regenerates them from the schema whenever they
are needed.

Two bugs got through because the backend was never typechecked: an import
path that pointed outside the repository, and a field the schema did not
have. The backend is now part of the typecheck, and of CI.

## Continuous integration

Every push and pull request runs `.github/workflows/ci.yml`, which does
exactly the four checks above and then the end-to-end suite against the
production build:

```bash
npx playwright install --with-deps chromium
npm run test:e2e
```

The end-to-end tests need a build first, so the workflow builds before it runs
them. A pull request is not mergeable until the whole pipeline is green.

## Deploying a schema change

`convex/schema.ts` and `lib/data/types.ts` have to stay in step, and a schema
change is a deployment, not just a commit:

```bash
npx convex dev        # pushes the schema to the development deployment
npx convex deploy     # pushes it to production
```

Two rules keep the deploy safe:

- **New columns are optional.** Adding a required field to a table that already
  has rows makes Convex reject the existing documents. Add it as
  `v.optional(...)` and backfill separately if it is needed.
- **New tables are additive.** The Phase 4–6 tables (`qualityReports`,
  `moderationActions`, `threads`, `threadPosts`, `datasetVersions`) need no
  backfill: they simply start empty.

The local backend does not need a migration. It merges any collection it does
not recognise into the stored state on read, so a browser that saved data
before a schema change keeps it.

## How to think about this codebase

**The language registry is the spine.** `lib/languages/registry.ts` is the
only place a language's id, name, coverage or region is defined. If you find
yourself hardcoding a language name somewhere else, stop and use the
registry.

**Language ids are permanent.** They are stored in the database and in user
preferences. Renaming one is a breaking change that needs a data migration.

**Never fake intelligence.** If you add a provider, it must report
`isMock: true` if it is a placeholder, and the UI must label it. A
placeholder that looks like a model is a bug, not a shortcut.

**No dead buttons.** Every control either does something real or says plainly
that the feature is not available yet. A disabled control with a visible
reason is fine; a button that does nothing is not.

**Keep secrets on the server.** Provider keys belong in environment
variables read by route handlers. If a client component can see a key, it is
a security bug.

**Never expose provider SDKs to the UI.** The frontend talks to
`/api/chat`; the route handler talks to providers. New providers implement
`lib/ai/types.ts`.

## Working on a feature

1. **Look for an existing pattern.** The codebase is small on purpose.
2. **Write the data shape first.** Domain types live in `lib/data/types.ts`
   and must be mirrored in `convex/schema.ts`.
3. **Keep the store contract honest.** New domain entities need a
   `SamiatiStore` method, implemented in both `LocalStore` and `ConvexStore`.
4. **Add tests.** Pure logic — the registry, the pipeline, the store — gets
   unit tests in `tests/`.
5. **Document the decision.** If a choice was not obvious, add a record in
   `docs/decisions/`.

## Style

- TypeScript, strict mode. No `any` without a comment explaining why.
- Tailwind classes over inline styles.
- `cn()` from `lib/utils.ts` for conditional classes.
- Comments explain *why*, not *what*. The code already says what.
- Keep components focused. If a component needs a second responsibility,
  split it.

## Adding a language

1. Add an entry to `lib/languages/registry.ts` with a stable id.
2. Add starter prompts to `lib/languages/starters.ts`.
3. Add the language's FLORES code to `lib/ai/providers/huggingface.ts` if it
   is not already mapped.
4. Run `npm test` — the registry tests will check the metadata is complete.

## Adding a provider

1. Implement the interface in `lib/ai/types.ts`.
2. Create `lib/ai/providers/<name>.ts`.
3. Select it in `resolveAiRuntime()` in `lib/ai/index.ts` based on an
   environment variable.
4. Document the cost in `docs/ai-pipeline.md`.

## Contributing to the languages themselves

Samiati's models are only as good as the data. If you speak one of the
supported languages, the most valuable contribution is in **Changa** —
translating, validating and correcting text so the model learns how the
language is actually used, not how a textbook says it is used.

## Reporting a problem

Open an issue with what you did, what you expected and what happened. If it
involves a translation, please say which language and which direction.

## Code of conduct

Be respectful. This project serves people whose languages are often
described as "low-resource" or "minority" — do not describe the people, or
their languages, that way.
