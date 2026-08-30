# Discover Page — Refined UX & Layout Implementation Plan

## Context Gathered
- No existing "Saved Topics" screen for Discover items (needs new screen or reuse pattern)
- PostFeed uses virtualized list; Discover uses plain map
- No bottom nav or FAB in the app — sticky headers are the standard pattern
- Toast pattern: `useState<string | null>` + fixed bottom-center pill, 2–3s timeout
- `copyToClipboard` utility exists at `src/lib/utils.ts`
- Other screens use `navigator.share` → clipboard fallback → toast; DiscoverCard is the only one missing fallback

---

## Implementation Tasks (ordered)

### Task 1: Fix Data Consistency Issues

**1a. Unify time window in `getCategoryCounts`**
- File: `convex/discover/feed.ts:65-96`
- Change cutoff from 24h to 30 days to match `getFeed` (line 17)
- This makes tab badge counts meaningful relative to feed content

**1b. Fix `for_you` double-counting**
- File: `convex/discover/feed.ts:75-92`
- Remove `for_you` from the counts object, or compute it as items matching user interests (requires user preference data — defer to later)
- Short-term: remove `for_you` from counts; tab shows count only for specific categories

**1c. Add pagination support**
- File: `convex/discover/feed.ts:9-34`
- Add `cursor` arg support using `_id` or `newestPublishedAt` as cursor
- Return `{ clusters, nextCursor }` instead of raw array
- Frontend: replace `limit: 20` with cursor-based loading

### Task 2: Wire Up Dead Code & Missing Feedback

**2a. Add save state feedback**
- File: `src/components/discover/DiscoverCard.tsx`
- Add `isSaved` state prop or derive from cluster data
- After `handleSave`, show filled bookmark icon (`BookmarkCheck` or filled variant)
- Show toast: "Topic saved" / "Removed from saved"
- Use existing toast pattern from `PostThreadScreen.tsx`

**2b. Add dismiss button and client-side filtering**
- File: `src/components/discover/DiscoverCard.tsx`
- Add `X` icon button in card header (next to bookmark/share)
- Wire to `onDismiss` prop
- In `DiscoverScreen.tsx`, maintain `dismissedIds: Set<string>` state
- Filter feed items: `feed.filter(t => !dismissedIds.has(t._id))`
- Show toast: "Topic dismissed"

**2c. Fix share fallback**
- File: `src/components/discover/DiscoverCard.tsx:95-103`
- Import `copyToClipboard` from `@/lib/utils`
- On desktop (no `navigator.share`), copy `window.location.href` to clipboard
- Show toast: "Link copied to clipboard"

**2d. Make refresh actually refetch**
- File: `src/components/screens/DiscoverScreen.tsx:78-82`
- Convex queries auto-refetch on mutation, but for manual refresh use `useRefresh` or invalidate queries
- Or: call a no-op mutation to trigger reactivity; show toast "Feed refreshed"

### Task 3: Improve Card Layout & Visual Hierarchy

**3a. Reduce card height**
- File: `src/components/discover/DiscoverCard.tsx`
- Change `p-4` → `p-3`
- Change summary `line-clamp-3` → `line-clamp-2`
- Move CTA button from full-width bottom to inline with actions row (or remove per-card CTA)

**3b. Remove per-card CTA repetition**
- Option A: Remove "Explore with Samiati" button from individual cards; keep only icon actions (bookmark/share)
- Option B: Show CTA only on first visible card, then hide after scroll
- Recommended: Option A — cleaner scan, less noise. Users can tap card body to explore.

**3c. Render image thumbnails**
- File: `src/components/discover/DiscoverCard.tsx`
- If `cluster.imageUrl` exists, show small thumbnail (w-16 h-16 rounded-lg) in header or left side
- Requires backend to populate `imageUrl` during enrichment (verify in `convex/discover/enrich.ts`)

**3d. Consolidate trending indicators**
- Keep card-level badge (`TrendingUp` destructive badge) — it's visible while scrolling
- Remove "Trending Now" section header from `DiscoverScreen.tsx`
- Trending items will still appear in feed with their badge

**3e. Improve "Why trending" prominence**
- File: `src/components/discover/DiscoverCard.tsx:203-208`
- Change `text-[10px]` → `text-xs`
- Remove `border-t border-border/50` separator; use `text-muted-foreground` directly

**3f. Show country badge consistently**
- File: `src/components/discover/DiscoverCard.tsx:127-131`
- Remove `cluster.country !== "KE"` condition; always show country badge
- Or: show "Kenya" badge for KE, other countries show their name

### Task 4: Optimize Screen Layout

**4a. Reduce sticky header height**
- File: `src/components/screens/DiscoverScreen.tsx:89-155`
- Change header `h-14` → `h-12`
- Reduce tab padding: `px-2.5 py-1` instead of `px-3 py-1.5`
- Consider moving category tabs below header (non-sticky) to save vertical space

**4b. Add "Load More" button**
- File: `src/components/screens/DiscoverScreen.tsx`
- After feed list, add button: "Load more topics"
- On click, fetch next page via cursor
- Show loading spinner while fetching

**4c. Consistent loading/empty spacing**
- File: `src/components/screens/DiscoverScreen.tsx:159-170`
- Align loading/empty state padding with feed (`p-4`) instead of `py-20`

### Task 5: Align Visual Design

**5a. Use app theme colors for category badges**
- File: `src/components/discover/DiscoverCard.tsx:43-53`
- Replace arbitrary Tailwind colors with app's `--color-rasta-*` or `--active-accent` variants
- Example: `kenya` → `bg-rasta-green/10 text-rasta-green`, `africa` → `bg-rasta-gold/10 text-rasta-gold`

**5b. Match card border accent for trending**
- File: `src/components/discover/DiscoverCard.tsx:111-116`
- Trending cards already use `border-primary/20` — ensure this contrasts well in dark mode

---

## Open Questions

1. **"For You" tab behavior**: Should trending items be injected into `for_you` feed, or should `for_you` be a separate personalized view? Current: trending (top 3) + feed items = duplicate content.
   - Recommendation: Remove dedicated "Trending Now" section. Let trending items surface naturally in `for_you` feed via their `trendScore` sort order and card badge.

2. **Dismiss behavior**: Should dismissed topics reappear later, or stay hidden permanently?
   - Recommendation: Stay hidden for current session. Add "Show dismissed" toggle in settings later if needed.

3. **Image thumbnails**: Does the enrichment pipeline (`convex/discover/enrich.ts`) currently populate `imageUrl`?
   - Need to verify before rendering thumbnails in frontend.

4. **Saved topics screen**: Should there be a dedicated screen to view saved Discover topics?
   - Recommendation: Defer to separate feature. Current save just tracks engagement; no UI to view saved items.

---

## Validation Steps

1. **Manual**: Navigate to `/dashboard/discover`, verify all 7 tabs load with correct counts
2. **Manual**: Scroll feed, verify cards are compact (~120-150px), CTA not repeated
3. **Manual**: Tap bookmark icon, verify filled icon + toast appears
4. **Manual**: Tap share on desktop, verify clipboard fallback + toast
5. **Manual**: Tap dismiss (X), verify card removed + toast
6. **Manual**: Tap "Load More", verify next page loads via cursor
7. **Manual**: Verify tab counts match visible feed items (same 30-day window)
8. **Performance**: Monitor Convex query time as dataset grows; verify indexes help or add composite index

---

## Files to Modify

| File | Changes |
|------|---------|
| `convex/discover/feed.ts` | Unify time windows, fix `for_you` count, add cursor pagination |
| `src/components/screens/DiscoverScreen.tsx` | Remove trending section, add Load More, fix refresh, consistent spacing |
| `src/components/discover/DiscoverCard.tsx` | Add dismiss button, save feedback, share fallback, reduce height, render image, remove per-card CTA |
| `src/lib/utils.ts` | Already has `copyToClipboard` — no changes needed |
