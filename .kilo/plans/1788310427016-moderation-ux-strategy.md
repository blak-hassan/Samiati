# Moderation UX Strategy: Restrict, Repurpose, and Streamline

## 1. Analysis of the Current Moderation Structure

### 1.1 What moderation actually is in this codebase
The moderation subsystem is a **content‑quality control surface** that decides whether a Changa contribution (Story, Word, Proverb, Song, Phrases, Translation) is promoted into the curated language corpus that powers Samiati's AI chat and storytelling experiences. It is **not** a community/social moderation system for user‑generated posts in the social feed — those use a separate Report flow (`Screen.REPORT_MODAL`, `ReportModal`).

Concrete building blocks (paths from the worktree):

- **Domain core**
  - `src/lib/changaModeration.ts` — maps between `ModerationStatus` (`pending | approved | needs_revision | rejected`) and `ContributionStatus` (`Draft | Live | Under Review | Needs Revision | Declined`), normalizes contribution items, and converts `ContributionItem → ValidationItem`.
  - `src/types.ts:293` (`ModerationStatus`), `:395` (`ValidationItem`), `:441` (`LanguageHealth`), `:453` (`ModeratorRoleDetails`), `:470` (`UserRole`).
- **UI surface (moderators + authors‑tracking‑their‑own‑work)**
  - `src/components/screens/ModerationDashboardScreen.tsx` — the hub: stats banner (Pending / Validated / Approved), `LanguageHealthWidget`, fuzzy search, status/type/sort filters, and a list of `ValidationCard`s.
  - `src/components/moderation/ValidationCard.tsx` — per‑item review surface with Approve / Critique / Report actions; the action bar is gated on `isUserModerator` per language.
  - `src/components/moderation/LanguageHealthWidget.tsx` — per‑language health strip with a "Moderator / Contributor" role badge and a pulsing pending‑count badge.
  - `src/components/moderation/CritiqueModal.tsx` and `ReportModal.tsx` — feedback and reject flows.
- **Routing / embedding points**
  - `Screen.MODERATION_DASHBOARD` reachable at `src/app/dashboard/moderation-dashboard/page.tsx` and via the dynamic `[slug]` router at `src/app/dashboard/[slug]/page.tsx:182`.
  - Embedded inside Changa as a third tab in `src/components/screens/ContributionsScreen.tsx:685, 803` ("My Posts | Challenges | Moderation"), and additionally rendered once inside `ContributionsScreen.tsx:822` with `isEmbedded`.
  - Sidebar entry in `src/components/shared/AppSidebar.tsx:241` is the only place that **already** gates visibility on `user.role === 'moderator' || 'admin'`.

### 1.2 Fundamental purpose
The moderation interface exists to (a) give language moderators a fast, batch‑oriented way to validate, critique, or reject Changa contributions so that only quality data flows into training/curation, and (b) let any contributor see the *progress* of their own submissions. It is the bridge between crowdsourced raw input and the curated output that the rest of Samiati (chat, search, learn) consumes.

### 1.3 Primary target audience
- **Tier 1 (power users, by design):** `UserRole = 'moderator' | 'admin'` users with `ModeratorRoleDetails` covering specific language codes. They are the only users for whom Approve / Critique / Report buttons must be enabled.
- **Tier 2 (read‑only, by side effect):** any contributor who has authored at least one item. `ModerationDashboardScreen.tsx:90‑95` explicitly keeps an item visible when `item.author.id === currentUserId` even if the user is not a moderator. For these users the dashboard is a personal review‑status tracker, not an action surface.

### 1.4 Current visibility is inconsistent — this is the bug to fix
There is a real contradiction in the present code:

- `AppSidebar.tsx:241` correctly hides the Moderation link for non‑moderators.
- `ContributionsScreen.tsx:685, 803` renders the "Moderation" tab **unconditionally** for any user who lands on the Contributions screen — there is no `user.role` guard. Every contributor can navigate to a "Validation Hub" with stats, health widgets, and a card list that visually presents the same shape as the moderator's queue.
- `ValidationCard.tsx:285, 293, 302` disables Approve / Critique / Report when `!isUserModerator`, but the surrounding chrome (status pill, history panel, language/health widget) is identical for everyone, which is what creates the "why am I here?" feeling.

This is the single source of the UX problem the user is asking about: non‑moderators are reaching a moderation‑shaped surface with no moderation affordances, and that surface leaks into a third tab on the page they use most.

---

## 2. UX Implications of Visibility for Non‑Moderators

### 2.1 What non‑moderators actually need
Non‑moderator contributors need three thin affordances, already partially present:
1. **"What happened to my submission?"** — a read‑only status pill + latest moderator note.
2. **"Why was it rejected / what do I need to change?"** — the critique text the moderator wrote.
3. **"How is my language doing?"** — a personal version of the language health widget, without moderator‑only counts.

They do **not** need: a "Validation Hub" header, AI‑training‑data framing, other people's pending queue, or Approve / Critique / Report buttons (which exist but are disabled, signaling a wrong surface).

### 2.2 Cost of leaving it visible
- **Trust damage:** disabled action buttons imply the user "isn't trusted yet" rather than "isn't a moderator" — a UX anti‑pattern that reads as gatekeeping.
- **Interface clutter:** every non‑moderator contributes surface weight (badge, status pill, full filter menu, health widget) to a screen whose primary action they can't perform.
- **Fatigue:** the validation‑runner visual language (pulsing pending counts, dense stats banner, color‑coded status pills) is tuned for batch triage. Exposing it to a casual contributor pushes them into an admin‑shaped mental model on every visit.
- **Privacy / scope creep:** even with `isUserModerator` filtering, the `basicFilteredItems` filter at `ModerationDashboardScreen.tsx:90‑95` only filters *displayed* items — other contributors' items could leak in through search/filter paths if role gating is wrong.

### 2.3 Cost of fully hiding it
- Contributors lose visibility into their own submission status.
- The "My Posts" tab would have to absorb a small status surface, which is fine but requires a follow‑up design.

### 2.4 Decision (recommended)
**Restrict the moderator surface to moderators; expose a slim "My Submission Status" surface to non‑moderators.** This is the same separation Tier‑1/Tier‑2 already implied in the data model — the UI just hasn't caught up.

---

## 3. Design Strategy

### 3.1 Audience separation (single source of truth)
- **Moderators (`role` in `{'moderator','admin'}`):** see the existing `ModerationDashboardScreen` exactly as today, plus refinements in §3.3.
- **Contributors (everyone else with submissions):** see a new lightweight "My Submissions" panel that lives on the "My Posts" tab and *not* in the Changa top‑level navigation. No filters, no stats banner, no AI‑training framing.

### 3.2 Visibility rules (the contract)
1. `AppSidebar.tsx:241` continues to gate `Moderation` to moderators only. **Keep as is.**
2. `ContributionsScreen.tsx:685` removes `"Moderation"` from the tab list **unless** `user.role` is moderator or admin. For moderators, the tab keeps its current "Dashboard / History" sub‑tabs.
3. The non‑moderator status surface is rendered inside `MyChangaActivity` (or as a small section under the existing post list), not in a third tab. See §3.4.
4. `LanguageHealthWidget` is split into two visual modes selected by `viewerIsModerator`:
   - **Moderator mode:** red pulsing pending badge, validated/target ratio, role badge "Moderator". Unchanged.
   - **Contributor mode:** health bar and validated/target ratio only; no pending‑queue badge, no role badge ("Moderator" text removed at `LanguageHealthWidget.tsx:67`), no "Show All" filter.

### 3.3 Optimizing the moderator workflow (fatigue mitigation)
Treat the moderator dashboard as a **triage workstation**, not a feed. Concrete moves:

1. **Replace the three‑column stats banner with a single triage queue header.** Keep the counts, but collapse them into one compact row with a pill toggle "Pending (n) / Approved / Needs Revision / Rejected" instead of three large cards. This removes ~110 px of vertical chrome that every moderator scrolls past on every refresh (`ModerationDashboardScreen.tsx:182‑220`).
2. **Default filter = `pending` + `newest`.** Pre‑apply `selectedStatus='pending'` and `sortBy='newest'` on mount so the moderator lands in their actionable backlog, not an unfiltered mix. Today's empty state assumes the user *will* filter; the default should already be filtered.
3. **Keyboard‑first actions.** Add hotkeys on `ValidationCard`:
   - `A` → Approve (only when moderator for that language and not already reviewed).
   - `C` → open Critique modal, `Enter` submits.
   - `R` → open Report modal.
   - `J/K` → next/previous card.
   `ValidationCard.tsx:282‑309` already isolates the action bar — extend it with a small `useHotkeys` hook (project already uses hotkeys pattern? — verify before implementing). Display a one‑time hint chip on first visit.
4. **Compact card mode for moderators.** When the moderator is on the queue tab, render `ValidationCard` in a `density="compact"` variant: collapse the review history into a count + last moderator avatar, hide translation/meaning behind a single "Show details" toggle, and let the action bar persist sticky at the bottom of the viewport. This addresses fatigue directly — moderators stop scrolling to act.
5. **Sticky filter row.** Promote the search + filter row (`ModerationDashboardScreen.tsx:232‑331`) to a `sticky top-[headerHeight]` so it doesn't re‑appear on every scroll. Current row is inline and scrolls away.
6. **Inline counts on filter chips.** Show `pending (12)`, `needs_revision (3)` etc. directly in the Filter menu (`ModerationDashboardScreen.tsx:262‑276`) so moderators can route without opening the menu.
7. **"You have reviewed this" affordance** at `ValidationCard.tsx:274‑280` is good — keep it, but also surface a one‑line "Reviewed by you · 2h ago" badge so the moderator can see their own history at a glance without opening the card.
8. **Toast fatigue cap.** The current toast (`ModerationDashboardScreen.tsx:404‑417`) is bottom‑centered and blocking. Replace with a non‑blocking top‑right stack with auto‑dismiss after 2 s and a max of 3 visible — moderators who approve 30 items in a sitting otherwise get repeated full‑width banners.
9. **Refresh button (`handleRefresh`, line 150‑158)** is a 1.5 s `setTimeout` fake. Replace with a real Convex query refetch once `useAppUser` exposes a `refetch()`; until then, hide the button on mobile and rely on pull‑to‑refresh (the screen already scrolls). This removes a non‑functional control.

### 3.4 Recommended UI presentation methods (anti‑clutter)
- **Hide, don't disable, for non‑moderators.** Replace `disabled={!isUserModerator}` on Approve/Critique/Report (`ValidationCard.tsx:285, 293, 302`) with conditional render of a single `ReadOnlyActions` component that shows: status pill + "Last moderator note" + a link to the author's previous reviews. This is the single biggest fatigue reducer for non‑moderators.
- **One moderator path, one contributor path.** No shared "Validation Hub" header for non‑moderators. The word "Validation" only appears in moderator chrome.
- **De‑emphasize health widget for non‑moderators.** Move it from a horizontal scroll strip into a single inline row inside "My Submissions" — `Language name · 73% · 124/170`. This kills ~120 px of vertical space and the `no-scrollbar` horizontal scroll affordance (`LanguageHealthWidget.tsx:51`).
- **Reduce color tokens on contributor chrome.** Drop the rasta‑green/red/gold validation palette from contributor‑facing status pills; use neutral `muted` + a small icon (✓ / ✎ / ⏳). Validation colors should be reserved for surfaces where a moderator decision is being made.
- **Inline empty states over modal empty states.** The current empty state (`ModerationDashboardScreen.tsx:363‑384`) uses a 20 px‑padded centered card — fine for the moderator. For the contributor's "My Submissions" surface, replace with a single‑line "No pending submissions — nice work." Reduces layout shift and avoids a "broken page" feel.
- **Disclosure over display.** Review history should default to *collapsed* on contributor cards and *expanded by 1 line* on moderator cards (just the latest review). History expansion stays opt‑in (`ValidationCard.tsx:225‑231`).

### 3.5 Concrete code changes (ordered, minimal)

1. **`src/components/moderation/ValidationCard.tsx`**
   - Add `viewer: 'moderator' | 'contributor'` prop (derive from `isUserModerator` + `isAuthor` upstream).
   - When `viewer === 'contributor'`: render `<ReadOnlyActions>` instead of the action bar; hide moderator‑only counts (the green check count at line 162‑167 stays but with a tooltip).
   - Add `density?: 'comfortable' | 'compact'` prop. `compact` collapses the review history preview and hides translation/meaning behind a "Show details" disclosure.
   - Wire `A`/`C`/`R`/`J`/`K` hotkeys when `viewer === 'moderator'`.

2. **`src/components/moderation/LanguageHealthWidget.tsx`**
   - Add `viewerMode: 'moderator' | 'contributor'` prop. In contributor mode: remove pending badge, remove "Moderator / Contributor" text, simplify the card to a single line.

3. **`src/components/screens/ModerationDashboardScreen.tsx`**
   - Apply the default filter/sort from §3.3 #2.
   - Replace stats banner with a single compact triage row.
   - Make the search/filter row sticky.
   - Replace the toast with a non‑blocking stack.
   - Pass `viewer` and `density` through to children based on whether the current user is a moderator for any visible language.

4. **`src/components/screens/ContributionsScreen.tsx`**
   - At line 685, gate the "Moderation" tab on `user.role === 'moderator' || user.role === 'admin'`.
   - For non‑moderators, add a small `<MySubmissionStatus />` section near the top of the "My Posts" tab content (around line 703‑705) — a list of their own items with status pill + latest moderator note, no stats, no filters.

5. **`src/components/changa/MyChangaActivity.tsx`** *(only if a dedicated component is preferred)*
   - Optionally extract the contributor status surface into its own component to keep `ContributionsScreen.tsx` from growing further.

6. **`src/components/shared/AppSidebar.tsx:241`** — no change (already correct).

7. **`src/hooks/useAppUser.ts`** — expose `refetchModerationItems()` to replace the fake `handleRefresh`. Optional but recommended.

### 3.6 Out of scope (explicit)
- Changing the `UserRole` enum or the data model.
- Adding a public "report content" flow (already exists via `ReportModal`).
- Designing a senior‑moderator queue, queue assignment, or SLA dashboards (future work — out of scope for this UX pass).
- Any change to the disabled‑state copy for the disabled Report button at `ValidationCard.tsx:301‑308` — leaving for a future accessibility audit.

---

## 4. Validation Plan

For each of the seven change groups above, the implementing agent must verify:

1. **Visibility gate (`ContributionsScreen.tsx:685`)**
   - As a contributor (`role: 'member'`), the "Moderation" tab is **not** rendered.
   - As a moderator (`role: 'moderator'`), the "Moderation" tab **is** rendered.
   - Sidebar `Moderation` link remains hidden for non‑moderators.

2. **Read‑only contributor surface**
   - Contributor viewing their own item sees `<ReadOnlyActions>`, **not** the disabled Approve/Critique/Report buttons.
   - No occurrence of `disabled={!isUserModerator}` reaches the DOM for non‑moderator viewers (grep check).

3. **Moderator efficiency**
   - Default mount shows `status='pending'`, `sortBy='newest'`, queue density = `compact`.
   - Hotkeys `A`/`C`/`R`/`J`/`K` fire only when the dashboard has focus and the user is a moderator for the focused item's language.
   - Toast stack caps at 3 visible; older toasts collapse to a count.

4. **No‑fatigue visuals**
   - Health widget on contributor surface is a single line, no horizontal scroll, no rasta pending badge.
   - Review history defaults collapsed for contributors.

5. **Regression checks**
   - `npm run lint`, `npm run typecheck` (project scripts per `package.json`).
   - Existing moderation E2E in `e2e/` — if a moderator flow exists, it should still pass.
   - Manual: contributor with 0 submissions sees the "no pending submissions" inline empty state, not the centered modal‑style one.

---

## 5. Risks

- **Sidebar / tab inconsistency:** if the gate in `ContributionsScreen.tsx:685` is added but the embedded render at line 822 (`isEmbedded`) is not removed, contributors can still land on the dashboard via deep links. Fix: add a role check at the top of `ModerationDashboardScreen.tsx` that returns a `<NotAuthorized />` view when the user is not a moderator AND `isEmbedded === true`.
- **Hotkey collisions:** `A/C/R` may collide with text inputs. The hotkey handler must skip when `event.target` is an input/textarea/contenteditable.
- **Toast stack regression:** if multiple moderation actions happen within 200 ms, a stack‑capped toast can lose information. Mitigation: the bottom toast for `Approved! Author earned +N XP` should always show at least once per action; collapse only duplicates.
- **Local‑only fake refresh:** replacing `handleRefresh` requires `useAppUser` to actually expose a refetch — verify before swapping; otherwise keep the button but rename it to "Reload queue" and disable while in flight.

---

## 6. Open Decisions (resolved with recommended answers)

| Decision | Recommendation | Why |
|---|---|---|
| Should non‑moderators see the dashboard at all? | **No** — replace with a read‑only "My Submissions" surface in the "My Posts" tab. | Avoids the disabled‑button anti‑pattern; respects the existing data model. |
| Default moderator filter on mount? | `pending` + `newest` | Maximizes throughput; matches the actionable backlog. |
| Card density default for moderators? | `compact` for the queue tab; `comfortable` for the history tab. | Reduces scroll fatigue without losing detail. |
| Should the embedded render at `ContributionsScreen.tsx:822` stay for moderators? | Yes, only for moderators — add a role guard at the top of the embedded render. | The "My Posts → Moderation" tab already routes here. |
| Should the language health widget stay a horizontal scroll strip for moderators? | Yes for moderators (it scales to many languages); collapse to a single line for contributors. | Preserves power, reduces clutter. |