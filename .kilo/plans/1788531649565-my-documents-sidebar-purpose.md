# Plan: Embed "My Documents" inside the My Posts (My Changa) tab

## Goal
Make **My Documents** feel like a *kind* of post in the user's "My Posts" view, not a separate destination. The Changa surface's `My Changa` tab (user-facing label: "My Posts") currently shows only contribution posts; it should also include the user's imported data corpora, merged into a single chronological feed.

## Design decisions (resolved with user)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Where to add the documents | Inside the existing `My Changa` / "My Posts" tab in `ContributionsScreen.tsx`, no new screen or route. |
| 2 | Visual placement | Interleaved in the same list as posts (not a separate section). |
| 3 | Sort order | Newest first by `createdAt` DESC, tiebreak by `updatedAt` DESC. |
| 4 | Document card style | Larger variant of `ContributionCard`: same surface, orange cover band on the left, kind icon, title, status pill, uploaded-at. |
| 5 | Status filter | Reuse existing `All / Live / Under Review / Needs Revision / Declined` chips. Document statuses (`uploading`, `parsing`, `ready`, `in_review`, `completed`) map onto the same buckets. |
| 6 | Data layer | `useQuery` for both `api.contributions.listMine` and `api.changa.documents.listUserDocuments`, merge client-side. No new Convex function. |
| 7 | Empty state | Combined empty state with two CTAs: "Contribute now" (start a task) and "Import data corpus" (open `Screen.DOCUMENT_UPLOAD`). |
| 8 | Scope | Tab-only. No changes to Sidebar, Challenges footer, Moderation tab, or any other screen. |

## User flow

1. User opens sidebar → taps **Changa** → lands on `Screen.CHANGA` → "My Posts" tab.
2. Above the contribution list they see the **streak / cultural impact / language diversity** cards (unchanged) and the **status filter chips** (unchanged).
3. The list below the chips now contains a **single, time-sorted feed** of both:
   - **Contribution posts** (existing `ContributionCard`).
   - **Documents** (new larger `DocumentFeedCard` — same look-and-feel, with a left orange band + kind icon).
4. The status filter chips apply uniformly — e.g. picking "Under Review" hides both live contributions and `ready` documents, showing only `in_review` ones and posts under review.
5. Empty state: when the user has no posts *and* no documents, the existing skeleton/empty area shows **two CTAs**:
   - "Contribute now" → existing primary task flow.
   - "Import data corpus" → `Screen.DOCUMENT_UPLOAD`.
6. Document card click → opens the same document detail the full `/dashboard/my-documents` screen uses (no new screen; reuse existing navigation).
7. Unchanged: sidebar still has **My Documents** as a standalone entry, Challenges footer still has its own "My Documents" button, post-upload still deep-links to `/dashboard/my-documents`. This task does not remove any of them.

## Affected files

| File | Change |
|------|--------|
| `src/components/screens/ContributionsScreen.tsx` | Add `useQuery(api.changa.documents.listUserDocuments)` alongside existing contributions query. Add a memoized merged+sorted feed. Add a new `DocumentFeedCard` render branch inside the existing list. Update the empty state to dual CTA. |
| `src/components/changa/MyDocumentsScreen.tsx` | **No code change.** Reuse its `STATUS_COLORS` and `KIND_ICONS` constants — either re-import them or extract them to a shared module first. |

No new files. No new Screen enum values. No new routes. No sidebar changes. No Convex changes.

## Implementation steps (ordered)

1. **Extract shared document tokens.** If `MyDocumentsScreen.tsx`'s `STATUS_COLORS` (lines 12–18) and `KIND_ICONS` (lines 20–27) are not already exported, move them to a small module such as `src/components/changa/documentTokens.ts` so both screens reference the same source. Skip if already shared.
2. **Add document query in `ContributionsScreen.tsx`.** Import the Convex `api` and the `useQuery` of `api.changa.documents.listUserDocuments` (limit 50, same as `MyDocumentsScreen.tsx:30`). Add the destructured `documents` next to the existing `contributions` query result.
3. **Build merged feed.** Add a `useMemo` that produces `feedItems: Array<{ kind: 'contribution' | 'document'; createdAt: number; updatedAt: number; data: ... }>`. Sort by `createdAt` DESC then `updatedAt` DESC. Slice to the same length currently used for posts (look at the existing `slice` or `limit` in `ContributionsScreen.tsx` ~ line 717-850).
4. **Render with a discriminator.** Replace the existing `contributions.map(...)` block with `feedItems.map(item => item.kind === 'contribution' ? <ContributionCard .../> : <DocumentFeedCard .../>)`.
5. **Add `DocumentFeedCard`** as a new local component in `ContributionsScreen.tsx` (or split to `src/components/changa/DocumentFeedCard.tsx` if it grows). Visual spec:
   - Wrapper: `rounded-2xl bg-white dark:bg-surface-dark border border-stone-200 dark:border-white/5 p-4 flex gap-3` (same surface as `ContributionCard`).
   - Left band: 4px-wide vertical strip `bg-[#cf6317]` (`rounded-l-2xl -my-4 ml-[-16px] w-1`).
   - Icon tile: `w-12 h-12 rounded-xl bg-[#cf6317]/10 flex items-center justify-center` containing the Material Symbol from `KIND_ICONS`.
   - Title (truncate, `font-bold text-stone-900 dark:text-white`), status pill (reuse `STATUS_COLORS` with the same `text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full` pattern from `MyDocumentsScreen.tsx:118`), uploaded-at (`text-xs text-muted-foreground`).
   - Optional: a small `View` chevron on the right (`IconRenderer name="chevron_right" size={20}`).
   - Click handler: navigate to document detail. **Implementation choice (open question — see below):** the existing `MyDocumentsScreen` is a *list* screen, not a detail screen; there is no in-app `DOCUMENT_DETAIL` route today. For this tab, click should either (a) navigate to `/dashboard/my-documents` (the list) so the user can see context, or (b) deep-link to a future detail screen once one exists. Default to (a) for this PR.
6. **Apply status filter to documents.** In the existing filter logic (around line 807 of `ContributionsScreen.tsx` where chips map to status), accept a generic `FeedItem` and apply the same predicate. Map document statuses to the chip buckets:
   - `Live` ← `ready`, `completed`
   - `Under Review` ← `in_review`, `parsing`
   - `Needs Revision` ← (none today — leave bucket empty for docs)
   - `Declined` ← (none today — leave bucket empty for docs)
   - `uploading` is shown in `All` only (transient).
7. **Update empty state.** In the existing branch (around line 717+), if `feedItems.length === 0`, render a card with two stacked CTAs:
   - "Contribute now" → existing primary contribution entry point.
   - "Import data corpus" → `Screen.DOCUMENT_UPLOAD`.
   Use the same `rounded-2xl bg-white dark:bg-surface-dark` surface; both buttons reuse the orange button style (`bg-[#cf6317] hover:bg-[#b05210] text-white font-bold py-3 px-6 rounded-xl`).
8. **Loading state.** If either query is `undefined`, keep the existing skeleton; do not block on documents separately.

## Visual hierarchy & spacing (UI/UX)

- **Hierarchy**: feed items are siblings — same vertical rhythm (`space-y-3`), same card surface. The document card earns visual weight by being slightly taller and using the orange left band; posts remain compact.
- **Spacing**: keep `p-4 pb-24 space-y-4` on the tab body, `max-w-3xl mx-auto w-full` on the list, `space-y-3` between cards. The orange band on documents is the only new visual element inside cards.
- **Typography**: title `font-bold`, status pill `text-[10px] font-bold uppercase tracking-wider`, uploaded-at `text-xs text-muted-foreground`. Matches `MyDocumentsScreen.tsx:115-127` exactly.
- **Color**: orange `#cf6317` for the document band, kind-icon tile, and empty-state CTAs. No new color tokens introduced.
- **Dark mode**: every utility uses the `dark:` variant already established in `MyDocumentsScreen.tsx:102-127`.

## Technical architecture

```
ContributionsScreen.tsx
├── useQuery(api.contributions.listMine)            // existing
├── useQuery(api.changa.documents.listUserDocuments) // NEW
├── useMemo → feedItems: FeedItem[]                 // NEW
│      sort: createdAt DESC, updatedAt DESC
│      filter: by activeChip status
└── render
       ├── existing streak/impact/language cards (unchanged)
       ├── existing status filter chips (now applied to feed)
       ├── feedItems.map
       │      ├── ContributionCard (unchanged)
       │      └── DocumentFeedCard (NEW)
       └── empty state (NEW: dual CTA)
```

No changes to `useNavigation.ts`, `src/types.ts`, `convex/`, `src/app/`, or `AppSidebar.tsx`. No new icons needed (reuse Material Symbols already imported).

## Integration with other sections (decisions)

- **Sidebar**: untouched. The "My Documents" entry remains. Users can reach the full library directly; the tab gives a lightweight in-context view.
- **Challenges / Missions footer**: untouched. The "My Documents" button at `ChallengesScreen.tsx:266-273` stays. A future PR can consider removing duplicates, but out of scope here.
- **Moderation tab**: untouched. The moderator role still surfaces via `AppSidebar.tsx:249-256` and the in-tab `Moderation` panel in `ContributionsScreen.tsx:854-867`. No document review metrics added (out of scope; would require new Convex aggregations).
- **Post-upload flow**: untouched. `DocumentUploadScreen.tsx:101` still deep-links to `/dashboard/my-documents`.

## Failure modes & edge cases

- **Documents query returns `undefined`** → render skeleton (same as `MyDocumentsScreen.tsx:42-47`); do not flash empty state.
- **Document `createdAt` is missing/zero** → fall back to `updatedAt` or `_creationTime` (Convex system field). Decide on the field name in implementation; do not block on this.
- **Document statuses that don't map to any chip** (e.g. `uploading`) → still appear under `All`; hidden under all other chips. Verify no status is silently dropped.
- **Empty filter result** → show the existing "no results" hint, not the combined empty state (which is reserved for the truly empty user).
- **Very long document title** → `truncate` (Tailwind class) to one line; do not expand the card.

## Validation

1. **Lint + typecheck**: `npm run lint` and `npm run typecheck` (verify the exact script names against `package.json` before running).
2. **Build**: `npm run build` to ensure no new TS errors.
3. **Manual smoke** (Chrome + mobile breakpoint):
   - With no posts and no documents → combined empty state with two CTAs.
   - With only posts → identical to current behavior.
   - With only documents → only document cards visible, sorted DESC.
   - With both → interleaved, sorted DESC.
   - Toggle each status chip → both kinds filtered consistently.
   - Click a document card → lands on `/dashboard/my-documents`.
   - Dark mode → no contrast regressions on the orange band or status pills.
4. **Regression check**:
   - Sidebar "My Documents" still works.
   - Challenges footer "My Documents" still works.
   - Post-upload deep-link to `/dashboard/my-documents` still works.
   - Moderator tab still works.

## Out of scope

- Removing duplicate "My Documents" entry points.
- A new `DOCUMENT_DETAIL` screen or in-app preview of document contents.
- Moderator-side document review metrics.
- i18n of any of the new copy (matches current convention; the existing labels are inline English literals).
- Bulk actions on the merged feed (select multiple, archive, etc.).
- Animations / transitions on feed reorder.

## Open questions (to resolve in implementation PR, not in this plan)

1. **Click target** for `DocumentFeedCard` — `navigate(Screen.MY_DOCUMENTS)` (default) vs. a future in-place detail. Default is `/dashboard/my-documents` until a detail screen exists.
2. **Where to place the shared `STATUS_COLORS` / `KIND_ICONS`** — extract to `src/components/changa/documentTokens.ts` (recommended) or re-export from `MyDocumentsScreen.tsx`. Pick whichever minimizes churn.
3. **Document `createdAt` field** — confirm the Convex schema for `changa.documents` exposes a stable `createdAt` (in ms, not a Convex `v.number()` ID) and is set on insert. If not, use `_creationTime`.
