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
