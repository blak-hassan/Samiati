# Samiati design system

## Direction

Editorial Afro-Futurism: warm ink, generous reading space, confident sans-serif type and expressive serif headings. Language selection is the signature interaction. Conversation content remains quiet. Cultural identity comes from language and community participation, not unverified symbols or stereotypes.

## Semantic tokens

| Semantic role | Dark | Light |
| --- | --- | --- |
| background | #17120F | #F5EDE3 |
| card / surface | #30231D | #FFFDF9 |
| elevated / secondary | #3E2E25 | #EADDD0 |
| foreground | #F5EDE3 | #17120F |
| muted foreground | #C8B7AA | #6C5749 |
| primary action | #C48B64 | #704C39 |
| primary foreground | #17120F | #FFFDF9 |
| decorative elevated brown | #704C39 | #704C39 |
| AI accent | #A78BFA | #6944AC |
| border | #574237 | #C8B5A4 |
| focus ring | #A78BFA | #6944AC |
| success | #9CC9AA | #286341 |
| warning | #E7BC79 | #79501B |
| destructive | #FFAAA2 | #AD3029 |

Implement as CSS variables and Tailwind semantic aliases. Retain legacy aliases for existing screens. Appearance accent preferences continue using the existing settings store; use correct foreground pairings. Borders that identify controls need stronger contrast than decorative dividers. Opacity must not reduce essential text contrast.

## Typography and layout

Manrope for interface/navigation/body; Instrument Serif for editorial headings. System sans/Georgia fallback, extended glyph fallback, `font-display: swap`. Both fonts are SIL OFL 1.1: [Manrope license](https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/OFL.txt), [Instrument Serif license](https://raw.githubusercontent.com/google/fonts/main/ofl/instrumentserif/OFL.txt). Preserve copyright/license files if self-hosted. Legacy Material Symbols remains until all dependent screens migrate.

- Body: 1rem, 1.6 line height; helper text at least 0.75rem. Respect existing text-size setting.
- Heading scale uses `clamp`, from 2rem section headings to approximately 6rem public hero. Serif is expressive, not used for chat messages or form labels.
- Spacing: 4/8/12/16/24/32/48/64/96px. Reading width uses existing `--app-content-width`; public content max 1200px.
- Radius: 10px fields/buttons, 16–24px cards/composer, pill badges only when useful.
- Mobile-first; 44px primary touch controls, 320px minimum viewport, safe-area padding, 100dvh chat, no fixed-width text content. `overflow-wrap:anywhere` on user content; do not uppercase language text.

## Shared components and behavior

Retain Radix primitives for dialogs/drawers/popovers/dropdowns/tabs/tooltips. Build shared brand, page intro, theme toggle and product navigation. Reuse existing feedback, source, recording, task and profile components with semantic tokens.

Buttons expose default/hover/active/focus/disabled states; async actions expose progress, errors and retry. Inputs have visible or screen-reader labels. Dialogs have titles and bounded scrolling. Icon-only buttons have accessible names. Empty states explain the next action; demonstration content is labeled at its point of use. Unsupported controls explain the limitation rather than simulating successful work.

Transitions: 150–250ms, only opacity/color/transform where useful. Respect both system `prefers-reduced-motion` and persisted reduce-motion preference. Keyboard focus is visibly outlined in either theme. Toast/status text uses live regions without interrupting reading. Never put a provider/model selector ahead of the language selector.
