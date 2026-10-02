# Design Tokens

Source of truth for the palette is `src/app/globals.css`. This document
describes what is **actually implemented** there, and calls out where two
parallel token sets coexist so the drift is visible rather than implied.

## Color Palette

Samiati uses a warm, heritage-inspired palette with rasta accents.

### Heritage Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-rasta-red` | `#C8102E` | Destructive actions, errors |
| `--color-rasta-gold` | `#FFD700` | Accents, highlights, XP |
| `--color-rasta-green` | `#009B3A` | Success states, positive actions |
| `--color-brown-primary` | `#8B4513` | Primary brand color |
| `--color-brown-hover` | `#6B3410` | Primary hover state |
| `--color-brand-accent` | `#cf6317` | Active/selected highlights (Changa, contributions) |
| `--color-brand-accent-hover` | `#b05210` | Hover state for the brand accent |

`--active-accent` / `--active-accent-hover` alias the brown pair, and
`--primary`, `--ring`, `--sidebar-primary` and `--sidebar-ring` all resolve to
`--active-accent`. Re-pointing `--active-accent` re-themes the whole app.

### Neutrals

The theme-aware layer is declared in `:root` / `.dark` and surfaced to Tailwind
through `@theme inline`, so every utility follows the `.dark` class:

| Token | Light | Dark | Notes |
|-------|-------|------|-------|
| `--background` | `#FAF9F6` | `#2b1e19` | Body + page surface |
| `--foreground` | `#2b1e19` | `#FAFAF9` | Default text |
| `--card` | `#ffffff` | `#42342b` | Raised surfaces |
| `--popover` | `#ffffff` | `#42342b` | Overlays |
| `--muted` | `#E7E5E4` | `#584639` | Subtle fills |
| `--muted-foreground` | `#5E5852` | `#C8B9B0` | Secondary text |
| `--secondary` / `--accent` | `#E7E5E4` | `#584639` | Interactive fills |
| `--border` | `#E7E5E4` | `#584639` | Dividers, outlines |
| `--input` | `#E7E5E4` | `#42342b` | Field background |

### Legacy fixed tokens (do not add new usages)

Declared in the plain `@theme` block, so these are **static values** that do not
respond to the theme switch. They exist because the pre-Next markup was ported
verbatim; each has a theme-aware equivalent.

| Legacy token | Value | Theme-aware replacement |
|--------------|-------|-------------------------|
| `--color-background-light` | `#FAF9F6` | `bg-background` |
| `--color-background-dark` | `#2b1e19` | `bg-background` |
| `--color-surface-dark` | `#42342b` | `bg-card` |
| `--color-surface-light` | `#ffffff` | `bg-card` |
| `--color-text-main` | `#FAFAF9` | `text-foreground` |
| `--color-text-muted` | `#A8A29E` | `text-muted-foreground` |
| `--color-sand-beige` | `#E7E5E4` | `bg-muted` |
| `--color-deep-brown` | `#2b1e19` | `bg-background` (dark) |
| `--color-warm-dark-brown` | `#42342b` | `bg-card` (dark) |
| `--color-input-bg-heritage` | `#584639` | `bg-input` (dark) |
| `--color-primary-heritage` | `var(--active-accent)` | `bg-primary` |
| `--color-primary-hover-heritage` | `var(--active-accent-hover)` | `hover:bg-primary/90` |

Caveats when migrating:

- `text-text-main` and `text-text-muted` are **dark-mode-only** in practice
  (used as `dark:text-…`, or on the deliberately dark-only detail screens that
  set `bg-background-dark`). Swapping them for the theme-aware equivalents on a
  screen that hard-codes a dark background will invert its contrast.
- The dark-only detail screens (`ProverbDetailScreen`, `StoryDetailScreen`,
  `WordDetailScreen`) set `bg-background-dark` + `text-text-main` with **no**
  `dark:` prefix, so they render dark in both themes. They are the main reason
  `--color-text-main` cannot simply be aliased to `--foreground`.

### Semantic Tokens

| Token | Value |
|-------|-------|
| `--color-success` | `var(--color-rasta-green)` |
| `--color-error` | `var(--color-rasta-red)` |
| `--color-warning` | `var(--color-rasta-gold)` |
| `--destructive` | `var(--color-rasta-red)` (both themes) |
| `--gold` | `#B45309` light / `#FFD700` dark |

`--gold` exists because `#FFD700` only reaches ~1.3:1 on the light background —
light mode substitutes a darker amber so `text-gold` stays WCAG AA. Use
`text-gold` / `border-gold`, never the raw rasta gold, for text.

## Typography

Three text families plus one icon family loaded in a single request:

| Family | Weights | Usage |
|--------|---------|-------|
| `Outfit` | 400, 500, 600, 700, 800 | Display / headings |
| `Be Vietnam Pro` | 400, 500, 600, 700 | Body text |
| `Lexend` | 400, 500, 600, 700 | Accents |
| `Material Symbols Outlined` | 100–700 | Icons |

## Spacing & Layout

- Border radius: `--radius: 0.625rem` (10px) base, with `--radius-sm` …
  `--radius-4xl` derived from it. **Prefer the derived scale** (`rounded-lg`,
  `rounded-xl`) over arbitrary values — the codebase currently drifts from
  `rounded-md` up to `rounded-[32px]`.
- Sidebar width: `260px` desktop (`AppSidebar` persistent column), `280px`
  mobile sheet (`sm:300px`).
- Card padding: `p-5` / `p-6` / `p-8`.
- Max content width: `max-w-xl` for forms, `max-w-4xl` for settings and the
  search column.
- Touch targets: minimum 44×44 CSS px (WCAG 2.5.8). Note `Button size="icon"`
  is `size-9` (36px) — pass an explicit size class for icon-only controls on
  touch surfaces.

### Mobile

- Full-height screens use `h-[100dvh]` / `min-h-screen` (never `h-screen`
  alone) so the browser chrome doesn't clip the layout.
- Bottom navigation: `BottomTabBar` (`lg:hidden`) renders in normal flow after
  the scroll area and pads itself with `pb-[env(safe-area-inset-bottom)]`.
- Page backgrounds must be `bg-background` so they follow the theme; a
  `min-h-screen bg-<stone|amber|…>` combination is flagged by
  `scripts/check-mobile-first.mjs`.

## Animation Principles

- **Purposeful**: Animations provide feedback (button press, state change)
- **Brief**: Most transitions ≤ 300ms
- **Respectful**: `prefers-reduced-motion` disables all animations
- **Delightful**: Staggered entry for lists, skeleton shimmer for loading

### Key Animations

| Class | Duration | Usage |
|-------|----------|-------|
| `animate-fade-in-up` | 0.4s | List item entry |
| `animate-toast-slide` | 0.35s | Toast notifications |
| `animate-breathe-pulse` | 2s infinite | Recording indicator |
| `skeleton-shimmer` | 1.8s infinite | Loading skeletons |

## Dark Mode

CSS variable-driven dark theme. Toggle via the `.dark` class on `<html>`,
applied by the inline bootstrap script in `src/app/layout.tsx` before paint.

- Transition: `transition-colors duration-300` on body
- All theme-aware colors have dark variants (see the Neutrals table)
- Skeleton shimmer adjusted for dark backgrounds
- The legacy fixed tokens above do **not** adapt — this is the main source of
  "dark mode looks wrong here" bugs

## Guardrails

`scripts/check-mobile-first.mjs` asserts the viewport contract and warns on
desktop-first media queries, desktop-sized fixed widths, hard-coded hex colors
in class names, and full-screen backgrounds that bypass `bg-background`.
