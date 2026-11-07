# 0004 — One language registry, one source of truth

- **Status:** Accepted
- **Date:** 2026-11-07
- **Context:** The brief requires a "centralized language registry rather
  than hardcoding language options throughout the application", with a stable
  id, display name, native name, ISO code, region, translation availability,
  voice availability, text direction, language-specific UI configuration and
  a future cultural visual representation.

## Decision

`lib/languages/` is the only place language knowledge lives.

| File | Responsibility |
| --- | --- |
| `types.ts` | `SamiatiLanguage`, `CapabilityLevel`, `TextDirection`, `CulturalMotif` |
| `registry.ts` | The language records themselves, plus `getLanguage`, `getLanguageOrDefault`, `isKnownLanguage`, `DEFAULT_LANGUAGE_ID` |
| `capability.ts` | Display descriptors for translation/voice coverage levels |
| `starters.ts` | Editorial starter prompts per language (kept separate because it is content, not metadata) |
| `index.ts` | Search, scoring and ordering helpers |

Language ids are **stable and permanent**: they are persisted in the database
and in user preferences. `kikuyu` will never be renamed. Display names may
change; ids may not.

## Why

The language list is the product. Every surface — the selector, the composer
placeholder, the conversation record, the contribution task, the community,
the Discover filter — reads from the registry. If availability were hardcoded
at each site, the app would eventually claim that Sheng is fully supported in
one place and merely "beta" in another, which is exactly the kind of
dishonesty that destroys trust in a translation tool.

The registry also separates **structural metadata** (id, script, direction,
coverage) from **editorial content** (starter prompts), because the two have
different review cycles: metadata changes when a model is added, editorial
content changes when a community reviews it.

## Coverage honesty

Each language declares `translation` and `voice` coverage as one of `full`,
`beta`, `limited`, `planned` or `none`. The selector renders this as a badge
on every option. Samiati never implies that all eleven languages have equal
support, and it never implies that a dialect has the same coverage as its
standard form — Sheng is modelled as a *register of Kiswahili*, not as a
separate ISO language.

## Consequences

- Adding a language is one registry entry plus optional starter prompts.
- The registry is covered by `tests/languages.test.ts`, which asserts the
  eleven required languages are present, that ids are unique and
  well-formed, that every record carries the metadata the UI depends on, and
  that search is diacritic-insensitive.
- The registry is a public, versioned contract. Changes to an id are
  breaking changes and require a migration.

## References

- [`docs/architecture.md`](../architecture.md)
- [`docs/product-requirements.md`](../product-requirements.md)
