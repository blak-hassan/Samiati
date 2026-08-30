# Contributing to Samiati

Thank you for your interest in contributing to Samiati! This guide will help you get started.

## Prerequisites

- Node.js 18+
- npm or pnpm
- A Convex deployment (for production features)
- Clerk account (for authentication)

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in your values:
   ```bash
   cp .env.example .env.local
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```

## Demo Mode

When `NEXT_PUBLIC_CONVEX_URL` or `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is missing, the app runs in demo mode using mock providers. This is useful for UI development without a backend.

## Development Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npm test             # Vitest unit tests
npm run test:e2e     # Playwright E2E tests
```

## Code Style

- Follow existing patterns in the codebase
- Use `shadcn/ui` components when possible
- Ensure accessibility: add `aria-label` to icon buttons, `role="alert"` to errors, `aria-live` to dynamic regions
- Add `htmlFor` ↔ `id` pairing on all `<Label>` / input pairs

## Accessibility

- Run `npm run test:e2e` which includes a11y scans via `@axe-core/playwright`
- Test keyboard navigation (Tab, Enter, Escape)
- Verify color contrast meets WCAG AA (4.5:1 for normal text)

## Commit Messages

Follow conventional commits:
- `feat: add Changa empty state for new contributors`
- `fix: route SETTINGS_BLOCKED to nested path`
- `docs: update architecture overview`
- `test: add E2E test for Changa flow`

## Pull Request Checklist

- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] New screens have explicit routes in `useNavigation.ts`
- [ ] Accessibility reviewed (keyboard nav, screen reader, contrast)
- [ ] Documentation updated if behavior changed

## Questions?

Open an issue or reach out to the maintainers.
