# Design Tokens

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

### Neutrals

| Token | Light | Dark |
|-------|-------|------|
| `--color-background` | `#FAF9F6` | `#2b1e19` |
| `--color-surface` | `#ffffff` | `#42342b` |
| `--color-text-main` | `#2b1e19` | `#FAFAF9` |
| `--color-text-muted` | `#57534E` | `#A8A29E` |
| `--color-sand-beige` | `#E7E5E4` | — |
| `--color-input-bg` | `#E7E5E4` | `#584639` |

### Semantic Tokens

| Token | Value |
|-------|-------|
| `--color-success` | `var(--color-rasta-green)` |
| `--color-error` | `var(--color-rasta-red)` |
| `--color-warning` | `var(--color-rasta-gold)` |

## Typography

Three text families plus one icon family loaded in a single request:

| Family | Weights | Usage |
|--------|---------|-------|
| `Outfit` | 400, 500, 600, 700, 800 | Display / headings |
| `Be Vietnam Pro` | 400, 500, 600, 700 | Body text |
| `Lexend` | 400, 500, 600, 700 | Accents |
| `Material Symbols Outlined` | 100–700 | Icons |

## Spacing & Layout

- Border radius: `0.625rem` (10px) base
- Sidebar width: `260px` desktop, `280–300px` mobile sheet
- Card padding: `p-5` / `p-6` / `p-8`
- Max content width: `max-w-xl` for forms, `max-w-4xl` for settings

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

Full CSS variable-driven dark theme. Toggle via `.dark` class on `<html>`.

- Transition: `transition-colors duration-300` on body
- All colors have dark variants
- Skeleton shimmer adjusted for dark backgrounds
