# Design System

Samiati's visual identity: a warm, calm, premium brown aesthetic that feels
African without being decorative.

---

## 1. Direction

| Pull | Resolution |
| --- | --- |
| "African-inspired" | The *materials* — sand, espresso, bronze, clay, the beadwork geometry of the logo — not the motifs. No tribal wallpaper, no print buttons. |
| "Futuristic" | Precision: generous spacing, crisp 1px borders, one shadow recipe, monospace for technical metadata. |
| "Warm" | The palette. Everything is a shade of brown, sand or bronze. |
| "Minimal" | Two typefaces, three radii, one shadow. |

---

## 2. Colour

All tokens are HSL triplets in `app/globals.css`, consumed through the
shadcn/ui convention (`hsl(var(--token))`).

### 2.1 The brand ramp

| Token | Light | Use |
| --- | --- | --- |
| `--sand-50` | `40 40% 97%` | Page background (light) |
| `--sand-100` | `38 36% 93%` | Sidebar background |
| `--sand-200` | `35 30% 87%` | Borders, dividers |
| `--sand-300` | `32 24% 79%` | Stronger borders, scrollbar thumbs |
| `--espresso-400` | `24 30% 48%` | Secondary text on light |
| `--espresso-500` | `23 35% 38%` | Body emphasis |
| `--espresso-600` | `22 40% 30%` | Primary in light mode |
| `--espresso-700` | `21 40% 24%` | Logo gradient start |
| `--espresso-800` | `20 38% 19%` | Logo gradient end |
| `--espresso-900` | `19 35% 13%` | Text in light mode |
| `--bronze-300` | `34 55% 68%` | Accent on dark backgrounds |
| `--bronze-400` | `32 52% 58%` | Primary in dark mode |
| `--bronze-500` | `30 48% 47%` | Warm accents |
| `--bronze-600` | `28 45% 38%` | Logo gradient end |
| `--clay-400` | `18 62% 60%` | Warm highlights |
| `--clay-500` | `15 58% 50%` | Heat-map level 2 |
| `--clay-600` | `13 52% 41%` | Destructive warm tint |

### 2.2 Semantic tokens

| Token | Light | Dark | Used by |
| --- | --- | --- | --- |
| `--background` | `40 38% 97%` | `22 22% 9%` | Page |
| `--foreground` | `22 28% 14%` | `38 25% 92%` | Body text |
| `--card` | `0 0% 100%` | `22 20% 12%` | Cards, panels |
| `--primary` | `22 42% 28%` | `34 52% 62%` | Primary buttons, accents |
| `--primary-foreground` | `40 44% 97%` | `20 32% 11%` | Text on primary |
| `--secondary` | `34 30% 91%` | `22 16% 17%` | Secondary surfaces |
| `--muted` | `36 24% 93%` | `22 16% 17%` | Muted surfaces |
| `--muted-foreground` | `25 12% 42%` | `32 12% 62%` | Secondary text |
| `--accent` | `33 36% 88%` | `24 18% 20%` | Hover states |
| `--destructive` | `0 62% 42%` | `0 55% 48%` | Errors, delete |
| `--border` | `32 20% 87%` | `24 14% 22%` | 1px borders |
| `--ring` | `24 44% 32%` | `34 50% 52%` | Focus rings |

Body text on the page background is at least 12:1 in both modes; muted text
is at least 4.5:1. Bronze replaces gold in dark mode precisely so that small
text stays above 4.5:1.

### 2.3 Language accents

Each language carries an `accentClass` in the registry — a text colour drawn
from the brand ramp, never a new hue. Eleven languages need eleven *tints* of
one palette, not eleven colours.

---

## 3. Typography

| Role | Face | Use |
| --- | --- | --- |
| Sans | Inter | Body, UI, everything |
| Display | Fraunces | Page titles, headings, the wordmark |
| Mono | JetBrains Mono | Model ids, code, technical metadata |

`next/font` self-hosts all three, so there is no render-blocking request to
a third party and no layout shift.

| Style | Size | Weight | Tracking |
| --- | --- | --- | --- |
| Display (page title) | 2.25–2.5rem | 600 | `-0.02em` |
| Heading | 1.25rem | 600 | `-0.01em` |
| Subheading | 1.125rem | 600 | normal |
| Body | 0.875rem | 400 | normal |
| Small | 0.8125rem | 400 | normal |
| Micro / label | 0.6875–0.75rem | 500 | `0.01em`, often uppercase |

Line height is 1.5 for body copy and 1.25 for display text. Long-form content
uses `text-pretty` / `text-balance`.

---

## 4. Spacing, radius and elevation

**Spacing.** A 4px base scale. 8px and 12px most often; 16px and 24px between
sections; 32px and 48px between page regions.

**Radius.**

| Token | Value | Used by |
| --- | --- | --- |
| `--radius` | `0.75rem` (12px) | The base radius |
| `rounded-md` | 10px | Inputs, buttons, selects |
| `rounded-sm` | 8px | Badges, small chips |
| `rounded-xl` | 12px | Cards |
| `rounded-2xl` | 16px | The composer, the welcome card |

Bubbles are asymmetric on purpose: the user's is `rounded-2xl rounded-tr-sm`,
the assistant's is square-ish. It tells you who is speaking without an
avatar.

**Elevation.** One shadow recipe, applied by the `.samiati-surface` utility:

```css
box-shadow:
  0 1px 2px 0 hsl(var(--espresso-900) / 0.04),
  0 8px 24px -12px hsl(var(--espresso-900) / 0.12);
```

Everything else uses a 1px border, not a shadow.

---

## 5. Components

27 shadcn/ui primitives, restyled onto the tokens above. None was
structurally modified.

| Samiati component | Purpose |
| --- | --- |
| `components/layout/samiati-logo.tsx` | The mark: three dots in a rounded triangle on an espresso-to-bronze gradient. Three dots = three languages, one conversation. |
| `components/layout/sidebar.tsx` | Navigation, new chat, search, language selector, conversation history with per-item actions. |
| `components/layout/app-shell.tsx` | Desktop sidebar / mobile drawer. One sidebar implementation, two presentations. |
| `components/language/language-selector.tsx` | The language selector — searchable, with favourites, recents and availability badges. |
| `components/chat/chat-view.tsx` | Conversation view, streaming lifecycle, message actions. |
| `components/chat/message-item.tsx` | A message bubble with copy / edit / regenerate / feedback and the provenance badge. |
| `components/chat/markdown.tsx` | Markdown with fenced code blocks and a copy button. `rehype-raw` is deliberately absent. |
| `components/chat/chat-input.tsx` | The composer: auto-sizing textarea, Enter to send, Stop while streaming. |

### 5.1 The language selector

The most important component in the product.

- A `cmdk` command palette with diacritic-insensitive search.
- **Favourites** and **Recently used** are separate groups above the full
  list, and are removed from "All languages" to avoid duplication.
- Every option shows: display name, native name, a **coverage badge**
  ("Full translation", "Beta translation", "Limited translation") and the
  region.
- A star toggles a favourite directly from the list.
- Three variants — `full` (sidebar), `compact` (chat header, mobile header)
  and `icon` (dense contexts).

The coverage badge is the honesty mechanism: a user can see, before choosing,
that Sheng is "Beta" and that Maasai voice support is "Planned".

---

## 6. Motion

| Purpose | Duration | Easing |
| --- | --- | --- |
| Hover / focus | 150–200ms | `ease-out` |
| Popover / dialog | 200ms | Radix's built-in |
| Page entry | 250ms | `animate-fade-up` |
| Streaming indicator | 1.4s loop | `ease-in-out` |

Motion explains a change; it never entertains. There is no page-transition
animation, no parallax, no scroll-jacking.

**Reduce motion.** The in-app setting adds `.reduce-motion` to the document
and the stylesheet collapses all durations to `0.01ms`. The OS-level
`prefers-reduced-motion` is honoured independently.

---

## 7. Accessibility

| Concern | Implementation |
| --- | --- |
| Focus visibility | A global `:focus-visible` ring in `app/globals.css`, plus Radix focus management in dialogs, menus and popovers. |
| Names | Every icon-only control has an `aria-label`. |
| Live regions | Streaming status uses `role="status" aria-live="polite"`. |
| Colour independence | Coverage badges carry a word as well as a dot. Active nav items carry `aria-current="page"`. |
| Touch targets | Primary controls are `h-10` to `h-11`. |
| Screen-reader text | `.sr-only` labels for the streaming indicator and the conversation language. |
| Dialogs | Radix `Dialog` traps focus, restores it on close, and labels itself. |

---

## 8. Dark mode

The dark theme is not an inversion. It is a **deep espresso**
(`22 22% 9%`), not black, because pure black next to warm brown text is
uncomfortable for long reading. Surfaces step *up* in lightness as they come
forward: background 9%, card 12%, muted 17%, accent 20%.

The primary colour flips from espresso (light) to bronze (dark) so a primary
button stays legible against its own foreground.

---

## 9. Responsive behaviour

| Breakpoint | Layout |
| --- | --- |
| `< 640px` | Single column. The sidebar becomes a drawer behind a menu button. A compact header carries the logo and the language selector. |
| `640–1024px` | Single column, wider gutters, the composer grows to `max-w-3xl`. |
| `>= 1024px` | Persistent 280px sidebar. The chat header shows the title, language selector and conversation actions. |

The composer is pinned to the bottom of the viewport on every size and the
message list scrolls independently. The composer never scrolls out of reach —
the single most important rule for a chat interface on a phone.

---

## 10. Voice

- **Direct.** "Pick a language and start talking." Not "We're thrilled to have
  you here!"
- **Honest.** Coverage levels are stated. Mock replies are labelled. The
  sample-content notice is on the Discover page, not buried.
- **Respectful without being deferential.** The user is treated as someone
  who knows their own language — which is why the contribution prompts say
  "the way you would actually say it, not the way a textbook would".
- **Never stereotyped.** The copy describes languages and regions, not
  "vibrant cultures" or "exotic".
