# Samiati Settings — Modernize Plan

## Context

- Entry: `src/app/dashboard/settings/page.tsx` → `src/components/screens/SettingsScreen.tsx`.
- Sub-pages: `account/`, `notifications/`, `privacy/`, `muted/`, `blocked/`, `data/`, `help/`, `languages/`. Each renders its own `SettingsXScreen` and re-uses `src/components/settings/SettingsPageHeader.tsx`.
- Today's home screen is a single scrolling column: profile card → premium banner → one tall card with five rows (Account, Notifications, Privacy, Dark Mode, Help) → Log out.
- The user finds the layout "old and outdated" and wants a leading-AI-app feel (ChatGPT, Claude, Notion AI, Linear, Arc): persistent two-pane master-detail, grouped nav, search, section icons, and quick toggles.
- Brand constraints (from `CLAUDE.md` / spec language): language preservation, community contribution ("Changa"), privacy-respecting, no vanity metrics, real counts only.

## Goal

A settings surface that feels modern, fast, and complete, while staying on-brand and reusing what already works. Keep mobile-first; the new shell collapses cleanly to a single column on small screens.

## Diagnosis of what's outdated

1. **No persistent nav.** Every section is a full route push; back-stack thrash on exploration.
2. **No grouping.** Five items stacked flat — no visual hierarchy by domain (Account / Communication / Privacy & Safety / Appearance / Help).
3. **No search.** Help pages and data controls are several taps deep.
4. **Premium banner dominates the page.** In leading AI apps the upsell is contextual and quiet, not the second thing you see.
5. **No "active sessions / devices" or "recent security events" affordance** — a common modern settings primitive that fits Samiati's privacy posture.
6. **Account row hides everything under a single label.** Account has 5+ distinct actions (profile, email, password, 2FA, export, delete); it deserves an index page of its own.
7. **Log Out is a tinted destructive button mid-page.** Leading apps put Sign Out in an overflow / "More" group at the bottom with reduced weight, with a delete-account path clearly separate.
8. **Header is bare.** No breadcrumb, no save indicator, no search.

## Recommendations (ordered, actionable)

Each item: **What**, **Why** (brand/leading-app rationale), **Files**, **Acceptance**.

### 1. Introduce a two-pane `SettingsShell`
- **What**: A new layout component `src/components/settings/SettingsShell.tsx` that renders a sticky left rail (`hidden md:flex`, ~240px) with grouped nav and a right pane for the active section. On mobile it renders only the pane with the existing `SettingsPageHeader` and a "Menu" button that opens the rail as a Sheet/Drawer. Reuse `useNavigation`/`Screen` enum so the active state highlights.
- **Why**: Master-detail is the dominant modern settings pattern; it scales, supports search, and is keyboard friendly.
- **Files**: New `SettingsShell.tsx`; new `src/app/dashboard/settings/layout.tsx` to wrap every `/dashboard/settings/*` route; refactor each sub-page's outer `<div>` to use the shell. Pure presentational refactor — no routing changes.
- **Acceptance**: On ≥md screens, navigating Account → Notifications → Privacy does not unmount the rail; on sm screens the rail is reachable via a Menu button.

### 2. Group nav into 4 buckets
- **What**: Group links under "Account", "Communication", "Privacy & Safety", "Help & About". Each group is a small uppercase eyebrow label + 1–5 row links with leading icon.
- **Why**: Visual hierarchy; matches ChatGPT/Claude/Linear information architecture.
- **Files**: `SettingsShell.tsx` (new); `SettingsScreen.tsx` (becomes the Account section in the shell) or split into `SettingsHomeScreen.tsx`.
- **Acceptance**: 4 group labels render; links per group match the existing routes (no new screens required for v1).

### 3. Add a search box in the rail
- **What**: A simple client-side fuzzy search (uses `fuse.js`, already a dep) over the group/label strings of every nav row. Selecting a result navigates to the section.
- **Why**: Every modern AI settings has search; trivial to add with the existing dep.
- **Files**: `SettingsShell.tsx`.
- **Acceptance**: Typing "notif" highlights Notifications; Enter navigates; Esc clears.

### 4. Quiet the premium banner
- **What**: Replace the full-width gradient card with a small inline row: left side plan name + status, right side a "Manage" link. Keep the `Zap` icon, drop the glow.
- **Why**: Leading AI apps don't push upsell above core controls; this also improves first-paint and respects the dark/light palette better.
- **Files**: `SettingsScreen.tsx` (Account section) or new `PlanRow.tsx`.
- **Acceptance**: Plan info visible without dominating viewport; "Manage" navigates to `/pricing`.

### 5. Add an "Account" index page
- **What**: New route `src/app/dashboard/settings/account/page.tsx` already exists — promote it to a real index that lists: Edit profile, Email, Password, Two-factor, Export data, Delete account. Each is a row with a leading icon and a right chevron, grouped under a "Security" and "Data" eyebrow.
- **Why**: Account is the most-tapped section in real settings apps; an index matches modern IA.
- **Files**: `src/components/screens/SettingsAccountScreen.tsx` (restructure the top into a row list, keep existing destructive dialogs at the bottom of the appropriate group).
- **Acceptance**: Account screen shows at least 6 rows; existing Export/Delete dialogs remain reachable.

### 6. Inline "Active sessions" entry
- **What**: Add a "Where you're signed in" row on the Account index, showing current device + a "Manage" link to a sub-page.
- **Why**: Standard modern primitive; fits Samiati's privacy posture. We don't need a full device manager v1 — a stub list reading `convex/users` or local storage is enough.
- **Files**: `SettingsAccountScreen.tsx`; new optional `SettingsSessionsScreen.tsx` (can be a placeholder list for v1).
- **Acceptance**: Row visible; tapping opens a page that shows "This device" at minimum, no crashes.

### 7. Section save indicator + auto-save pattern
- **What**: When a sub-section mutates server state (e.g., Notifications, Privacy), show a small "Saved · just now" pill in the top-right of the header that fades after 2s. Sub-pages already toast on save; this just makes it persistent while in view.
- **Why**: Reassurance without nagging; Linear/Notion pattern.
- **Files**: Extend `SettingsPageHeader.tsx` with optional `status?: "saving" | "saved"` and a slot.
- **Acceptance**: Toggling a switch shows the pill for ~2s.

### 8. Regroup Privacy & Safety
- **What**: Privacy route already exists but is buried. Move it under a "Privacy & Safety" group with rows: Profile visibility, Voice data, Cultural data, Blocked users, Muted words, Data export, Delete account (the last two are also in Account — that's fine; Linear/Notion duplicate these). Add a small lock icon badge for items that affect others (Blocked, Muted).
- **Why**: The four privacy toggles are real, distinct controls; grouping makes their purpose obvious.
- **Files**: `SettingsShell.tsx`; `src/components/screens/SettingsPrivacyScreen.tsx` (rearrange into labeled sections).
- **Acceptance**: Privacy & Safety group is visible; rows route correctly.

### 9. Dark mode as a top-bar pill on the rail
- **What**: Move the Dark Mode switch out of the main list and into a compact pill in the rail footer (Sun/Moon icon toggle). Keeps it one click away without taking a list row.
- **Why**: Leading AI apps treat appearance as a global, not a row.
- **Files**: `SettingsShell.tsx` (footer); remove the row from `SettingsScreen.tsx`/Account section.
- **Acceptance**: Dark mode toggle in rail footer; theme persists.

### 10. Footer card with version + legal
- **What**: Small footer under the rail showing "Samiati v{version} · Terms · Privacy". Use `package.json` version at build time.
- **Why**: Standard modern pattern; reassures the user they're on the latest app.
- **Files**: `SettingsShell.tsx`.
- **Acceptance**: Footer renders; version string is current.

### 11. Keyboard navigation in the rail
- **What**: Arrow up/down moves focus through links; `/` focuses the search box; `Esc` clears search and returns focus to the rail.
- **Why**: Power users expect it; near-zero cost once search exists.
- **Files**: `SettingsShell.tsx`.
- **Acceptance**: All three shortcuts work with the rail focused.

### 12. Light visual polish (no new tokens)
- **What**: Replace `bg-muted/20 + border-border/50` rectangles with a card list pattern: each row sits on a single `bg-card` surface with a 1px divider, rounded-2xl container, consistent `h-14` row height. Use the existing `Card` primitive. Replace `opacity-60` subtitle with `text-muted-foreground text-xs font-medium` for legibility.
- **Why**: The current "muted/20" background looks like a placeholder; the card pattern reads as intentional.
- **Files**: All settings screens; new shared `SettingsRow` component to enforce consistency.
- **Acceptance**: All settings rows match a single visual rhythm.

### 13. Accessibility pass
- **What**: Ensure every row is a `<button>` (or `<a>`) with a real `aria-label`; toggles use the existing `aria-label` pattern; focus rings are visible on both panes.
- **Why**: Required for parity with leading apps; minor wins.
- **Files**: New `SettingsRow.tsx`; touch up sub-screens.
- **Acceptance**: Tab order is logical in both panes; focus ring is visible.

## Out of scope (flag for product)

- New routes beyond what's listed. No new tables.
- Full device manager. Stub is fine.
- Plan/payments flow changes.
- Internationalization of the new labels (reuse existing i18n if present, else English only).

## Constraints

- No new dependencies — `fuse.js` is already installed.
- No schema changes; pure UI/IA refactor.
- Mobile-first: shell must collapse to a single pane + drawer below `md`.
- Brand alignment: every label uses Samiati vocabulary (Changa, language, verified, contribution) — no generic SaaS-speak ("workspace", "org", "team").

## Validation

- `npm run lint` and `npx tsc --noEmit` clean.
- `npx vitest run` — no new failures (existing 5 csp.test.ts failures are pre-existing and out of scope).
- Manual: navigate every row on a desktop and on a mobile viewport; toggle dark mode from the rail; search; arrow-key nav; reload preserves state.

## Open questions

1. Do you want the optional stub "Active sessions" sub-page in this pass, or defer it?
2. Should the Account index and Privacy index each have a brief 1-sentence description at the top ("These settings apply to your Samiati account."), or stay headerless like Claude/Linear?