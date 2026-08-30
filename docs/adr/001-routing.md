# ADR-001: Explicit Route Mapping in useNavigation

## Status

Accepted

## Context

The `Screen` enum in `src/types.ts` defines all application screens. The `useNavigation` hook maps these enum values to URL paths. An earlier implementation used a fallback in the `default` case of the switch statement:

```ts
default:
    go(`/dashboard/${screen.toLowerCase().replace(/_/g, '-')}${queryString}`);
```

This produced invalid URLs for nested routes. For example:
- `SETTINGS_BLOCKED` → `/dashboard/settings-blocked` (incorrect)
- Expected: `/dashboard/settings/blocked`

## Decision

Replace the fallback with explicit `case` statements for every `Screen` enum value. Unknown screens log a warning instead of generating a malformed URL.

## Consequences

- **Positive**: Eliminates 404s from malformed Screen paths. Route mapping is now explicit and auditable.
- **Negative**: Slightly more verbose switch statement. Requires developers to add a case when introducing new screens.
- **Mitigation**: The comment in `useNavigation.ts` explicitly warns future contributors to add cases rather than relying on the fallback.
