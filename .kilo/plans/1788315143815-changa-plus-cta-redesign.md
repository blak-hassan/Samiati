# Changa `+` CTA redesign — UX/UI strategy

## Goal

Make the `+` the unmistakable, frictionless entry point for contributing to Changa while accommodating **bulk upload**, **URL/link submission**, and **Challenge-linked** work — without ever forcing a multi-step flow when a user wants to do one quick thing.

This plan is a UX/UI design strategy. It does **not** introduce schema changes; it specifies screens, components, copy contracts, telemetry, and the smallest set of routing/wiring edits needed to land it.

## Recommended pattern — Speed-Dial Bottom Sheet anchored by a single FAB

Choose **one** component for the `+` across the app:

- **Floating Action Button (FAB)** anchored bottom-right on mobile, bottom-left-of-content on desktop, sitting above the bottom navigation and any scroll-to-bottom affordance.
- Tapping the FAB opens a **Bottom Sheet (mobile) / Centered Modal (desktop)** acting as a **Speed Dial**. The sheet lists three primary destinations plus optional shortcuts. It is **not** a wizard; selecting a tile routes directly to that flow.

Reject the alternatives:

- A nested multi-option modal opened directly from the FAB is acceptable only when language/contribution type ambiguity is high. For Changa the three flows are clear, so a flat speed dial is faster.
- A redesigned top-nav element loses the always-available affordance; the `+` must remain accessible from any screen in the Changa surface and the global app shell.
- A pure modal (no FAB) hides discoverability and breaks thumb reach on mobile.

## Placement rules (visibility without disruption)

- **Position:** `fixed inset-x-0 bottom-4 z-40` (mobile, centered), `fixed bottom-6 right-6 z-40` (desktop). Keep ≥ 56×56 px tap target with 12 px margin from edges and from the bottom nav.
- **Hide on:** full-screen media recorder while recording, the `DocumentUploadScreen` step wizards (avoid double-CTA confusion), and during an active upload session (replace with progress pill, not a competing CTA).
- **Show on:** `ChangaHome`, `ChangaCampaigns`, `ChallengeDetailsScreen`, `ChallengesScreen`, `ContributionsScreen`, `HomeSearchScreen`, and any deep link that is not already inside an active wizard.
- **Iconography:** filled `PlusCircle` in primary brand color (existing `--cf6317` / amber-700 family in this repo) with a subtle drop shadow + 2 px inner highlight. Hover/long-press shows a 200 ms scale to 1.05. Disabled state is greyed with a tooltip "Sign in to contribute".
- **Redundancy:** mirror the same three actions as compact buttons in `ChangaHome` and in the `ChangaCampaigns` empty state, so first-time users see them in context as well as via the FAB.

## Speed Dial contents

Three tiles, ordered by frequency and decreasing friction:

1. **Answer a quick task** (most frequent, lowest friction)
   - Subtitle: "15-second prompt for your language."
   - Routes to existing `TaskContributionScreen` with `taskId` from `recommendedTask` in `ChangaHome.tsx:113`. If none available, routes to `ChangaCampaigns` filtered by user's selected language.
2. **Add a link** (single-action, no wizard)
   - Subtitle: "Paste a URL — we'll record and fetch."
   - Opens a **single-field modal**: URL input + language dropdown (defaults to last selected) + optional title. Submit creates a `changaDocument` with `kind = website_link`, `totalEntries = 0`, `sourceUrl` set. No step-1/2/3 navigation. Mirror this on `DocumentUploadScreen` as a deep-link entry point so the user can still opt into the full wizard later.
3. **Import a document** (bulk paste/file)
   - Subtitle: "Paste text, upload .txt/.csv, or drop a file."
   - Routes to existing `DocumentUploadScreen` (`Screen.DOCUMENT_UPLOAD`).
4. **Attach to a Challenge** (contextual, conditional)
   - Subtitle: "Contribute to an active campaign."
   - Only visible when at least one active campaign exists for the user's selected language; otherwise it surfaces under "More options" as a link to `ChangaCampaigns`. Routes to the campaign detail with a contribution CTA pre-scoped.

Speed dial ordering rationale: the common case (one quick task) is one tap; the second tap (single link) is also one tap with one form field; the heavier wizard is third; challenge linking is contextual and never mandatory.

## Non-linear flow guarantees (Requirement 3)

The user can complete **any single action in ≤ 2 taps from the FAB**:

- "Just a single link" → FAB → "Add a link" → submit. No challenge picker, no category grid, no review step beyond consent.
- "Just a quick task" → FAB → "Answer a quick task" → existing task runner.
- "Just upload one file" → FAB → "Import a document" → step 2 of `DocumentUploadScreen` (skip step 1 because `kind` and `title` can be auto-derived; offer "Advanced" to expand).
- "Just contribute to a challenge" → from `ChangaCampaigns` or any campaign card → existing "Contribute to this campaign" button (`ChangaCampaigns.tsx:307`). The FAB's "Attach to a Challenge" tile is a shortcut, never a gate.

**No flow forces a challenge link.** Challenge association is opt-in metadata on the submission, not a required screen. The submission APIs already accept an optional `campaignId`/`taskId`; keep challenge association as a single optional dropdown in the task runner and in the link modal.

## Linking to Challenges (Requirement 2c) without coercion

Use a **suggestion chip** that appears only when relevant:

- After the user picks a language, query `convex/changa/campaigns.listActiveCampaigns` (already used in `ChangaHome.tsx:82`) for that language.
- If 1–3 campaigns match and the user's content kind aligns (e.g., user is uploading a dictionary and an active "Coastal vocabulary" campaign exists), show a non-blocking chip: "Looks like a fit for [Campaign name] — attach? [Attach] [Not now]".
- If no campaigns match, do not show the chip. Never auto-attach. Never require selection.

In the task runner (existing `TaskContributionScreen`), the challenge badge is already prominent (`SessionCategoryBadge.tsx`); if the user arrived there from a campaign, show "Contributing to [Campaign] · +XP" at the head of the runner.

## Interaction design specifics

- **Open animation:** 200 ms slide-up with `ease-out`. Backdrop scrim is `bg-black/40` with 150 ms fade.
- **Close:** swipe-down on the sheet handle, tap backdrop, hardware back, or Escape. Body scroll-lock while open.
- **Long-press FAB:** show a compact tooltip "Contribute" for first-time users; dismiss after one open.
- **Keyboard:** Tab cycles tiles, Enter activates, focus trap inside sheet, focus returns to FAB on close.
- **Reduced motion:** replace slide with 100 ms opacity fade; respect `prefers-reduced-motion`.
- **Guest mode:** FAB stays visible; tapping opens a sheet that replaces tiles with a single CTA "Sign in to contribute" routing to `Screen.SIGN_IN`. Mirrors the current `GuestBanner` and `AuthGuard` behaviour.
- **Offline:** sheet opens in read-only mode with a banner "You're offline — contributions will queue when you reconnect", reusing the `changaOfflineQueue` module already in the repo.

## Visual hierarchy (Requirement 1)

Three-layer hierarchy so the `+` reads as primary without dominating:

1. **Primary CTA layer:** the FAB. Single brand color, elevated shadow, single icon. Color contrast ratio ≥ 4.5:1 against the surface per WCAG AA.
2. **Speed dial tiles:** secondary buttons (white surface, 1 px border, label + 1-line subtitle, leading icon). Visually grouped under a small "Contribute" header.
3. **In-screen CTAs** (existing "Start task", "Start Import", "Contribute to this campaign"): retain current styling. They become entry points into the same flows, not competitors.

The FAB is the **only persistent colored element** on the screen; ensure other buttons on the page use `outline` or `ghost` variants by default. This keeps the FAB visually unambiguous.

## Language selection (Requirement 5a)

Language is the single most repeated decision; design it so the user **rarely re-picks it**.

- **Default:** the language selected in `ChangaHome.tsx:71` (`selectedLanguage`) is the default everywhere a language is requested. Persist across sessions via `useSettings`.
- **Where to surface a picker:**
  - Inside the "Add a link" modal (compact dropdown).
  - Inside the task runner (already there; keep the existing `LanguageSelector`).
  - Inside `DocumentUploadScreen` step 1 (already there).
- **Where NOT to surface a picker:** on the speed dial itself, on the FAB, on the home screen header (already exposed).
- **Multi-language uploads:** allow selecting multiple languages per document. The `languageCodes: string[]` field already exists on `changaDocuments` in the schema. Default to the currently selected language; expose "Add another language" as a chip inside step 1.
- **Unknown language fallback:** if the user is unsure, add "Not sure — let Samiati detect" as a dropdown option. Server runs LID and tags the document with the detected `languageCode` plus a `languageConfidence` field already used by the auto-checks pipeline.

## Data type / contribution type selection (Requirement 5b)

Constrain the user-facing taxonomy to the six kinds already defined in `DocumentUploadScreen.tsx:19` (`dictionary`, `novel`, `song_collection`, `website_link`, `transcript`, `other`). Reuse them as the only options across all three flows.

Selection rules:

- **Quick task:** no kind selection. The task contract supplies `taskType` (`lexicon_entry`, `phrase_translation`, `sentence_translation`, `transcription`, `audio_reading`); the user only provides the answer.
- **Add a link:** kind is inferred from URL pattern or defaults to `website_link`. No kind picker in this single-field modal.
- **Import a document:** show all six kinds as icon cards. Default-selected based on uploaded file extension (`.txt/.csv` → `dictionary` or `other`; `.pdf/.docx` → `novel`; `.mp3/.wav` → `transcript`).
- **Other:** show a one-line description input ("What is this?") and route to `other` kind.

Upload rules (what to allow):

- **Allowed file types:** `.txt`, `.csv`, `.json`, `.tsv`, `.pdf`, `.docx`, `.zip`, `.mp3`, `.wav`, `.m4a`. Reject others with a clear inline error.
- **Size limits:** text files 10 MB; audio 25 MB per clip; ZIP 50 MB. Match existing `useChunkedUpload` behaviour.
- **Bulk text paste:** unlimited line count, but the existing parser in `DocumentUploadScreen.tsx:45` splits on blank lines and CSV pipes. Display live entry count.

## Component / file map (proposed)

New components:

- `src/components/changa/ContributeFab.tsx` — the FAB + speed dial. Owns open state, focus trap, backdrop, telemetry.
- `src/components/changa/ContributeSpeedDial.tsx` — the bottom sheet body. Receives `{ onSelect, campaigns, recentActions, isGuest, isOnline }`.
- `src/components/changa/QuickLinkModal.tsx` — single-field URL submission modal.
- `src/components/changa/AttachToChallengeChip.tsx` — non-blocking suggestion chip.
- `src/hooks/useContributeShortcuts.ts` — keyboard shortcuts (e.g., `c` to open the FAB), respecting form-focus.

Edits:

- `src/components/shared/AppSidebar.tsx` — keep the existing primary "Kaanze" action; do **not** reuse it for contribution. Add a small `ContributeFab` mount point below the sidebar so desktop users also see the FAB.
- `src/app/dashboard/changa/page.tsx` and similar routes — render `<ContributeFab />` at the layout level so it appears on every Changa sub-screen except inside wizards.
- `src/components/changa/ChangaHome.tsx` — remove the existing `Start task` button's monopoly; keep it, but mark it visually secondary.
- `src/components/changa/DocumentUploadScreen.tsx` — add a deep-link entry mode (`?mode=quick-link`) so the FAB's "Add a link" can reuse the wizard's submit path without forcing the 3-step UI.
- `src/types.ts` — no new screens required if we route via existing `Screen.DOCUMENT_UPLOAD`, `Screen.ADD_CONTRIBUTION`, `Screen.CHANGA_CAMPAIGNS`, and `Screen.CHALLENGE_DETAILS`.

## Copy (English baseline; localized via existing i18n)

- FAB tooltip / first-open tooltip: "Contribute".
- Speed dial header: "Contribute to Changa".
- Tile 1: "Answer a quick task" — "15-second prompt for your language."
- Tile 2: "Add a link" — "Paste a URL — we'll record and fetch."
- Tile 3: "Import a document" — "Paste text or upload a file."
- Tile 4 (conditional): "Join a campaign" — "Help a specific goal."
- Quick link modal: "Paste a link", "Language", "Title (optional)", "Attach to a campaign (optional)", "Submit".
- Suggestion chip: "Looks like a fit for [Campaign] — attach?" / "Attach" / "Not now".
- Empty FAB for guests: "Sign in to contribute".

All copy keys live alongside the existing `t("title")`, `t("invite")`, `t("myActivity")` keys in `ChangaHome.tsx:180–197`; extend the i18n catalog accordingly.

## Telemetry (use existing `changaTelemetry` module)

Emit one event per: open, tile_click (`tile: answer_task | add_link | import_document | join_campaign`), quick_link_submit, fab_hidden (route excluded), guest_redirect, suggestion_chip_shown, suggestion_chip_attach, suggestion_chip_dismiss. Required to validate the redesign and to satisfy the funnel-instrumentation work already called out in the strategic Changa plan (`changa-strategic-implementation-plan.md`, Phase 1 §5).

## Accessibility

- FAB is a real `<button>` with `aria-label="Contribute"`, `aria-haspopup="dialog"`, `aria-expanded`.
- Speed dial is a `<dialog>` or `role="dialog"` with labelledby header.
- Tiles are `<button>`s with the same hit-target; full row clickable.
- Focus order: FAB → tile 1 → tile 2 → tile 3 → tile 4 → close.
- Live region announces "Contribute menu opened" / "Closed" to screen readers.
- Color is never the only signal — icons + labels always present.

## Failure modes / edge cases

- **Network down:** sheet opens in read-only mode; tile clicks show an inline error and queue the intent in `changaOfflineQueue`.
- **Guest + tile click:** redirect to sign-in, preserve return-to intent in `useNavigation`.
- **Active upload in progress:** FAB morphs into a non-interactive progress indicator; on completion, returns to default.
- **No recommended task available:** tile 1 routes to `ChangaCampaigns` filtered by language; copy adapts to "Browse open tasks".
- **No active campaign for language:** tile 4 hidden; "More options" expands to show "Browse all campaigns".
- **User already inside a wizard:** FAB hidden (see placement rules) so it does not double as a CTA inside the wizard.

## Validation plan

1. Prototype in Storybook (or a `/changa` route with a feature flag) and dogfood with internal users.
2. Run usability tests on low-end Android (Moto E-class) and a 3G throttle to confirm the FAB does not jank the main scroll.
3. Measure: time-to-first-contribution from app open; tile-click distribution; quick-link submission rate vs. 3-step wizard; suggestion-chip attach rate; guest conversion delta.
4. A/B test: FAB+SpeedDial (this plan) vs. the current single `+` that routes to `DocumentUploadScreen` step 1. Success criterion: ≥ 20% lift in completed contributions per session with no drop in accept rate.

## Out of scope

- New Convex schema changes (the `changaDocuments` table already supports the needed fields).
- Paid-expert marketplace UI.
- Generic open-ended "submit anything" flows (explicitly rejected in the strategic plan).

## Open decisions for the user

1. Should the "Answer a quick task" tile bypass the speed dial when a `recommendedTask` exists, going straight to the runner? Recommended: yes, but only on `ChangaHome`; on other surfaces the speed dial stays so the user can still pick a different flow.
2. Should the FAB be **always visible** on the global app shell, or **scoped to the Changa surface only**? Recommended: Changa-scoped to keep the global shell focused on conversation; a smaller "Contribute" button can live in the global header if cross-surface discoverability becomes a problem later.
3. Should the speed dial close after a single action ("single-tap to act"), or stay open to allow combining uploads? Recommended: close after each action; combining should happen inside `DocumentUploadScreen` for power users.

## Implementation order (smallest end-to-end slice first)

1. Build `ContributeFab` + `ContributeSpeedDial` with Tile 2 (quick link) only — the smallest non-linear flow that proves the pattern.
2. Wire it into `ChangaHome` and the Changa dashboard layout.
3. Add Tile 1 (quick task) reusing the existing `TaskContributionScreen`.
4. Add Tile 3 (import document) routing to existing `DocumentUploadScreen`.
5. Add Tile 4 (join a campaign) gated on `campaigns.length > 0`.
6. Add `AttachToChallengeChip` to the quick-link modal and the task runner.
7. Telemetry + A/B test.

Each step is independently shippable behind a feature flag.