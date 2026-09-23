# Changa End-to-End Bridge Plan

## Goal

Connect Posts, Challenges, and Moderation in the Samiati web app into one coherent, end-to-end workflow in **both universes** (legacy social model + new changa* dataset model), wire XP/badges end-to-end, surface a CTA on every post, eliminate the broken-link list, and make the Changa home actually render at `/dashboard/changa`.

Strategic direction confirmed with the user:
- **Bridge both universes** — keep legacy posts/challenges visible, but every UI action resolves into a real Convex mutation and surfaces a matching changaCampaign/changaTask where one exists.
- Moderation: **self-apply, admin approves**.
- Custom challenge: **full custom field builder** (JSON config + renderer).
- Post-thread CTA: **smart banner under the header**.
- Gamification: **wire XP + badges end-to-end**.

## Non-Goals

- Replacing the legacy social post/reply/like UI.
- Building a leaderboard UI.
- Multi-language i18n of the new strings.
- Migrating historical legacy `contributions` rows into `changaSubmissions`.

---

## Current State (verified against code)

Two parallel schemas in `convex/schema.ts`:

- **Legacy**: `users` (with `role` + `moderatorStatus`), `posts`, `contributions`, `challenges`, `challengeEntries`, `reports`, `moderationActions`.
- **New**: `changaTaskTemplates`, `changaTasks`, `changaTaskClaims`, `changaSubmissions`, `changaSubmissionAssets`, `changaProcessingRuns`, `changaDocuments`, `changaDocumentEntries`, `changaConsentPolicies`, `changaConsentRecords`, `changaValidationAssignments`, `changaValidationVotes`, `changaDatasetReleases`, `changaCuratedExamples`, `changaUserStats`, `changaRoleGrants`, `changaDecisions`, `changaEvaluationSets`, `changaEvaluationItems`, `changaReleaseMembers`, `changaCampaigns`, `changaCampaignProposals`, `changaInvites`.

Working end-to-end: `/dashboard/changa-activity`, `/dashboard/changa-campaigns`, `/dashboard/add-contribution?taskId=…` (`TaskContributionScreen`), `/dashboard/validate`, `/dashboard/curation`, `/dashboard/analytics`, `/dashboard/moderation-application`.

Confirmed broken / stubbed (full inventory in §10):

1. `Screen.CHANGA` renders `<ContributionsScreen>`, not `<ChangaHome>` (`src/app/dashboard/[slug]/page.tsx:149-159`).
2. `/dashboard/contributions` redirects into the wrong screen.
3. Campaign/task context is dropped on every navigation boundary (5 broken links — see §10).
4. `SubmitEntryScreen` and `ChallengeDetailsScreen` are mock-only.
5. `ModerationDashboardScreen` has two competing action paths; the Convex path is shadowed.
6. XP is calculated but never awarded; `XPProgressBar` is dead code in the new flow; no badges written.
7. Language-scoped changaRoleGrants ladder has `grantChangaRole` with no UI, no auto-promotion.
8. PostThreadScreen reply/like/menu actions are toast/no-op stubs.
9. No real custom challenge creator — `CUSTOM` → `lexicon_entry`.
10. `ChangaCampaigns.tsx:71` hardcodes `languageCode: "sheng"`.

---

## Decisions Locked With User

| Decision | Choice |
| --- | --- |
| Direction | Bridge both universes |
| Moderator path | Self-apply, admin approves |
| Custom challenge | Full custom field builder (JSON config + renderer) |
| Post-thread CTA | Smart banner under header |
| Gamification | XP + badges end-to-end |

---

## Affected Boundaries

- **Frontend**: `src/app/dashboard/[slug]/page.tsx`, `src/app/dashboard/contributions/page.tsx`, `src/components/screens/PostThreadScreen.tsx`, `src/components/screens/ChallengesScreen.tsx`, `src/components/screens/ChallengeDetailsScreen.tsx`, `src/components/screens/SubmitEntryScreen.tsx`, `src/components/screens/ModerationDashboardScreen.tsx`, `src/components/screens/AddChallengeScreen.tsx`, `src/components/changa/ChangaHome.tsx`, `src/components/changa/ChangaCampaigns.tsx`, `src/components/changa/ContributeFab.tsx`, `src/components/changa/AttachToChallengeChip.tsx`, `src/components/changa/XPProgressBar.tsx`, `src/app/dashboard/moderation-application/page.tsx`, new `src/app/dashboard/admin/moderators/page.tsx`, new `src/app/dashboard/admin/badges/page.tsx`, new `src/components/admin/ModeratorApprovalQueue.tsx`, new `src/components/admin/BadgeCatalog.tsx`, new `src/components/changa/PostThreadChangaBanner.tsx`, new `src/components/changa/CustomChallengeBuilder.tsx`, new `src/components/changa/CustomChallengeRenderer.tsx`.
- **Hooks / lib**: `src/hooks/useAppUser.ts`, `src/hooks/useNavigation.ts`, `src/lib/changaModeration.ts`, `src/services/xpService.ts`, `src/lib/changaTelemetry.ts`.
- **Convex**: `convex/schema.ts`, `convex/moderation.ts`, `convex/changa/tasks.ts`, `convex/changa/submissions.ts`, `convex/changa/campaigns.ts`, `convex/changa/reputation.ts`, `convex/changa/validation.ts`, new `convex/changa/xp.ts`, new `convex/admin/moderators.ts`, new `convex/changa/badges.ts`, new `convex/changa/customTasks.ts`.
- **Types**: `src/types.ts`.
- **E2E**: `e2e/changa.spec.ts`.

---

## Ordered Task List

### Phase 0 — Foundations (do first; everything else depends on this)

1. **Fix the `/dashboard/changa` slug bug** in `src/app/dashboard/[slug]/page.tsx:149-159` so `Screen.CHANGA` renders `<ChangaHome>` instead of `<ContributionsScreen>`. Remove the `/dashboard/contributions/page.tsx` redirect (or make it go through ChangaHome). Update `e2e/changa.spec.ts` if the assertions need adjusting.
2. **Add an explicit `legacyChallengeId` ↔ `changaCampaignId` mapping** in `convex/changa/campaigns.ts` (new query `getCampaignByLegacyChallengeId`). Mirror in the other direction on `challenges` (`legacyChallengeToCampaignMap` table or a `changaCampaignId: v.optional(v.id("changaCampaigns"))` column on `challenges`). This is the bridge the rest of the plan relies on.
3. **Standardize navigation parameter shapes** in `src/hooks/useNavigation.ts`. Define a `ChangaNavParams` type union covering `{ taskId, campaignId, challengeId, legacyChallengeId }`. Replace every `navigate(Screen.ADD_CONTRIBUTION, { task })` and `navigate(Screen.CHALLENGE_DETAILS, { campaignId })` with the typed shape. Update `src/app/dashboard/add-contribution/page.tsx` and `src/app/dashboard/challenge-details/page.tsx` to read every accepted param (back-compat).

### Phase 1 — Posts ↔ Challenges ↔ Moderation wiring

4. **Post-thread CTA banner** — new `src/components/changa/PostThreadChangaBanner.tsx`. Reads the post's `languageTag` and queries `getCampaignByLanguageAndPost`. Renders two buttons:
   - "Join matching campaign" — visible to everyone if a campaign exists with `languageCode === post.languageTag`; navigates to `Screen.CHALLENGE_DETAILS` with `{ legacyChallengeId, campaignId }`.
   - "Create campaign from this post" — visible only if `isAdmin(profile) || isModerator(profile)`; navigates to `Screen.ADD_CHALLENGE` with `{ seedPostId, languageCode, title: post.title ?? post.content.slice(0, 60) }`.
   Insert just under the post header in `src/components/screens/PostThreadScreen.tsx` (between header and body). Empty state when no languageTag: render a single muted "Suggest a changa for this post" tile for everyone.

5. **Fix `ChallengesScreen.tsx` ↔ detail page** — `src/components/screens/ChallengesScreen.tsx:236` and the campaign rail items must forward `{ taskId, campaignId, legacyChallengeId }`. Add a query `getCampaignDetailsByLegacyId` that hydrates `CampaignItem` + a `changaTasks[]` list, so the campaign tile can deep-link into a real `changaTask` rather than the stub.
6. **Replace `SubmitEntryScreen` mock** (`src/components/screens/SubmitEntryScreen.tsx:67-93,98`) — call `api.changa.submissions.submitSubmission` instead of `useAppUser().saveContribution`. On success, navigate to `Screen.CHALLENGE_DETAILS` with the same `legacyChallengeId`.
7. **Replace `ChallengeDetailsScreen` stub** (`src/components/screens/ChallengeDetailsScreen.tsx:19-33,144-153`) — drive it from a real `getChallengeDetails({ legacyChallengeId, campaignId })` query that returns the legacy `Challenge` row joined with the matching `changaCampaign` + recent `changaSubmissions` (limit 10) + the user's own `challengeEntries`. Wire the discussion tab and quick poll to real Convex mutations (new `addChallengeComment`, `voteChallengePoll`).
8. **Fix `ContributeFab` deep-link** (`src/components/changa/ContributeFab.tsx:162`) — change `Screen.CHALLENGE_DETAILS` to `Screen.CHALLENGE_DETAILS` with both `{ campaignId, legacyChallengeId }`.
9. **Fix `AttachToChallengeChip`** (`src/components/changa/AttachToChallengeChip.tsx` caller at `ChangaHome.tsx:312-314`) — switch to `{ campaignId, legacyChallengeId }`. Update `add-contribution/page.tsx:33` to honor `campaignId` and pick a `changaTask` for that campaign (preferring the same `taskType` as the campaign).
10. **Fix `ChangaCampaigns.tsx:317`** — replace `navigate(Screen.CHANGA)` with `navigate(Screen.ADD_CONTRIBUTION, { campaignId, legacyChallengeId })`.
11. **Fix `src/app/dashboard/challenges/page.tsx:76,84`** — pass `{ taskId }` and `{ legacyChallengeId }` respectively, not whole objects.
12. **Replace `window.location.href` reloads** in `src/components/screens/ChallengesScreen.tsx:276,284,292` with `useRouter().push(...)` for the Validate / Curate / Analytics tiles.

### Phase 2 — Moderation (apply, approve, role ladder, dashboard)

13. **Admin-only Moderator Approval Queue** — new `src/app/dashboard/admin/moderators/page.tsx` calling a new `convex/admin/moderators.listPendingApplications` query and `approveModeratorApplication` mutation (admin-only via `isAdmin`). UI: list each pending application with their requested languages and validation history; approve button grants `users.role = 'moderator'` AND a `changaRoleGrants` entry per requested language with `role: 'language_moderator'`. Record telemetry `moderator_approved`.
14. **Extend `ModeratorApplicationScreen`** (`src/components/screens/ModeratorApplicationScreen.tsx`) — add a "Languages I can moderate" multi-select. Persist as `users.moderatorStatus.requestedLanguages: string[]`. This list drives the auto-changaRoleGrants in step 13.
15. **Trust-score auto-promotion** — in `convex/changa/reputation.ts`, add an internal hook `maybeAutoPromote(userId, languageCode)` called at the end of `recordValidationStats`. Promote to `trusted_contributor` at trustScore ≥ 50, to `community_reviewer` at ≥ 120, to `language_moderator` at ≥ 250 (only when `users.role !== 'admin'` to avoid double-grants). Log via telemetry.
16. **Resolve the `ModerationDashboardScreen` shadow path** (`src/components/screens/ModerationDashboardScreen.tsx:170-194`) — remove the `useAppUser().{reviewContribution,voteOnModerationItem}` calls. Use the `onApprove`/`onCritique`/`onReport`/`onVote` props the page already wires to `api.changa.validation.{submitValidationVote,markUnderReview,flagSubmission}`. Add new mutation `convex/changa/validation.markUnderReview` if it doesn't exist. Keep the toast XP feedback but route it through `awardValidationXP` (see Phase 3).
18. **New `convex/admin/moderators.ts`** with `listPendingApplications`, `approveModeratorApplication`, `revokeModeratorApplication` (admin-only via shared `requireAdmin` helper in `convex/lib/auth.ts`).

### Phase 3 — Gamification (XP + badges end-to-end)

19. **New `convex/changa/xp.ts`** with `awardContributionXP({ submissionId })`, `awardValidationXP({ voteId })`, `grantBadge({ userId, badgeId })`. All updates both `users.{xp, level, badges}` (legacy mirror) and `changaUserStats.{xp, level, badges}` so legacy UI keeps working.
20. **Wire `TaskContributionScreen.submitSubmission` success** to call `awardContributionXP` server-side (one transaction). Compute XP using `xpService.calculateXP(item, { hasAudio, streakDays, rareLanguage })`. Apply `rareLanguageMultiplier` from `xpService` line 67-70.
21. **Wire `ValidationRunner.submitValidationVote` success** to call `awardValidationXP` (small fixed bonus from `VALIDATION_BONUSES`). Call `recordValidationStats` which already exists, then chain into `maybeAutoPromote`.
22. **Surface `XPProgressBar`** in `ChangaHome.tsx` (under the recommended task card), `MyChangaActivity.tsx` (in the header), `ValidationRunner.tsx` (top-right), and `ModerationDashboardScreen.tsx` (next to the action buttons). Remove the dead `xpService.calculateXP` call inside the toast; it now reflects real state.
23. **Badge catalog** — new `convex/changa/badges.ts` with `seedBadges` (id, title, description, icon, criterion) and admin UI `src/app/dashboard/admin/badges/page.tsx`. First seed set: First Contribution, 10 Contributions, Audio Contributor, Rare Language Champion, Streak-7, Streak-30, Validator, Language Master. Award server-side via `grantBadge` after each `awardContributionXP`/`awardValidationXP`.
24. **Streak update on contribution submit** — extend `recordValidationStats` into a shared `updateStreak(userId)` helper and call it from `awardContributionXP` so contributions also drive streaks.
25. **Telemetry**: add `xp_awarded`, `badge_unlocked`, `level_up`, `auto_promoted` events to `src/lib/changaTelemetry.ts`.

### Phase 4 — Custom Challenge Builder

26. **Schema**: add `changaCustomTaskTemplates` table in `convex/schema.ts` — fields: `creatorId`, `title`, `description`, `taskType` (constrained to existing types), `inputSchema` (array of `ChallengeInputField`: `id`, `label`, `kind: 'text'|'audio'|'image'|'choice'|'number'`, `required`, `choices?`, `maxLength?`), `successCriteria` (free text rubric stored for reviewer reference), `campaignId` (FK to changaCampaigns). Mirror `customConfig` into `changaCampaigns.customConfig` so the campaign surface stays single-source-of-truth.
27. **Builder UI**: new `src/components/changa/CustomChallengeBuilder.tsx`. Multi-step form (Basics → Inputs → Success criteria → Review). Pre-fills from post context if invoked from Phase 1 step 4. Validates that at least one input field is present.
28. **Renderer**: new `src/components/changa/CustomChallengeRenderer.tsx`. Renders the `inputSchema` inside `TaskContributionScreen` as a dynamic form (text inputs, audio recorders, image uploaders, single-choice radios). Submits as a normal `changaSubmissions` row with `customResponses: Record<string, string>`.
29. **Convex**: new `convex/changa/customTasks.ts` with `createCustomTemplate`, `getCustomTemplate`, `submitCustomSubmission`. The latter extends `submitSubmission` to accept `customResponses`.
30. **Update `AddChallengeScreen`**: when user picks `ChallengeType = CUSTOM`, route into the builder instead of the legacy metadata form. The legacy flow remains for non-CUSTOM types.

### Phase 5 — UX polish

31. **Sticky-top CTA on `ChallengeDetailsScreen`** — promote the existing sticky-bottom "Contribute to this mission" bar to a sticky-top bar. Hide the decorative `ProjectHero` and replace with a real CTA card that links to `TaskContributionScreen`.
32. **Telemetry events in `changaTelemetry.ts`** — add `cta_banner_clicked`, `custom_challenge_created`, `custom_challenge_submitted`, `moderator_application_submitted`, `moderator_approved`, `language_scoped_role_granted`.
33. **Remove dead code**: `XPProgressBar` is now live; remove the duplicated `[slug]/page.tsx` routes for `changa-activity` and `changa-campaigns` (keep the dedicated pages and delete the `[slug]` cases).
34. **Replace `useAppUser().saveContribution` and the `MockProviders` `moderationItems` writes** with no-op stubs (or remove the methods entirely once call sites are gone).
35. **Remove `languageCode: "sheng"` hardcode** in `ChangaCampaigns.tsx:71` — read from the active language picker state.
36. **Admin nav** — add `/dashboard/admin/moderators` and `/dashboard/admin/badges` to the dashboard nav, visible only when `profile?.role === 'admin'`.

---

## Data Flow

### Contribution flow (canonical, end-to-end)

```
User opens /dashboard/changa
  → ChangaHome loads recommended task + active campaigns
    → Click recommended task  ─► AddContributionScreen?taskId=…
       → TaskContributionScreen
         → claimTask
         → startClaimedSubmission
         → attachSubmissionAsset (audio)
         → submitSubmission
           → awardContributionXP (txn)
             → updateStreak
             → grantBadge (if criterion met)
               → maybeAutoPromote
                 → level_up / badge_unlocked telemetry
```

### Moderation flow

```
Signed-in user → /dashboard/moderation-application
  → pick languages + write motivation
  → convex/moderation.applyForModerator
    → telemetry: moderator_application_submitted
Admin → /dashboard/admin/moderators
  → approveModeratorApplication
    → users.role = 'moderator' (legacy)
    → changaRoleGrants[].role = 'language_moderator' (per requested language)
    → telemetry: moderator_approved, language_scoped_role_granted
New moderator → /dashboard/validate
  → submitValidationVote
    → awardValidationXP (txn)
      → recordValidationStats
        → maybeAutoPromote (may grant higher changa role)
```

### Post → Challenge flow

```
User taps post → PostThreadScreen
  → PostThreadChangaBanner (under header)
    → if campaign matches languageTag: "Join matching campaign"
       → Screen.CHALLENGE_DETAILS { campaignId, legacyChallengeId }
    → if user is admin/moderator: "Create campaign from this post"
       → Screen.ADD_CHALLENGE { seedPostId, languageCode, title }
         → if ChallengeType = CUSTOM: CustomChallengeBuilder
         → else: AddChallengeScreen metadata form
```

### Custom challenge flow

```
User finishes CustomChallengeBuilder
  → createCustomTemplate + updateCampaign.customConfig
  → Campaign goes live
  → Other users click the campaign
    → ChallengeDetailsScreen shows custom inputs preview
    → Click "Contribute" → TaskContributionScreen renders CustomChallengeRenderer
      → submitCustomSubmission { customResponses }
        → awardContributionXP, grantBadge, telemetry
```

---

## Failure Modes & Mitigations

| Failure | Mitigation |
| --- | --- |
| Convex generated bindings drift out of sync | Pin `@convex-dev/cli` version; add `convex:dev` lint step that fails when `convex/_generated/` is stale; remove the manual casts noted in `ChangaHome.tsx:80-93` once stable. |
| Admin role escalation bug | All admin mutations route through `convex/lib/auth.ts:requireAdmin(ctx)` which throws on non-admin. Add a unit test for each. |
| XP double-awarding on retry | `awardContributionXP` checks `changaSubmissions._id` already in `changaUserStats.processedSubmissionIds` set before writing. |
| Streak resets on server time skew | Use UTC date math; server `Date.now()` only. |
| Custom builder allows unsafe input kinds | Validate at submit with the same `inputSchema` validator; reject unknown field ids. |
| Moderator approval grants to a user who already has a higher role | `grantChangaRole` (existing) revokes prior active grant for the same scope before insert. |
| Browser offline + retry double-submit | Already covered by `changaOfflineQueue` text-only path. Add idempotency key to `submitSubmission`. |
| Admin UI exposed to non-admins via direct URL | `requireAdmin` guard in the page-level Convex query; client redirect on missing role. |

---

## Rollout / Migration

1. **Feature flags**: add `CHANGA_BRIDGE_V2` env flag (read in `useAppUser`) that toggles between the bridged flow and the existing flows. Default ON for internal testers, OFF for production until validated.
2. **Migrate legacy `challenges.changaCampaignId`**: backfill any existing `challenges` rows with a matching `changaCampaigns` row by language tag; if none exists, create a stub campaign and link it.
3. **Admin promotion**: hand-promote the existing admin users so `users.moderatorStatus.isActive = true` and the approval-queue UI is empty on first load.
4. **E2E**: extend `e2e/changa.spec.ts` with:
   - `/dashboard/changa` H1 is "Changa" (currently failing — this fixes it).
   - Tapping a recommended task → `/dashboard/add-contribution?taskId=…` (currently broken).
   - PostThread → banner visible → admin can create campaign from post.
   - Admin approves a moderator application → role granted.
   - Submitting a custom challenge → XPProgressBar increments.
5. **Staged release**: ship Phase 0 + Phase 1 behind the flag for one week, then Phase 2-3, then Phase 4 (custom builder), then Phase 5 polish.

---

## Validation Plan

- **Unit**: add tests in `convex/changa/__tests__/` covering `awardContributionXP`, `grantBadge`, `maybeAutoPromote`, `approveModeratorApplication`, `createCustomTemplate`, `submitCustomSubmission`, the `requireAdmin` guard, and the XP/streak math in `xpService.ts`.
- **Integration / E2E**: extend `e2e/changa.spec.ts` with the flows above. Run `npm run e2e`.
- **Manual smoke checklist**:
  - `/dashboard/changa` shows `ChangaHome`.
  - Click recommended task → real `TaskContributionScreen` opens with the right taskId.
  - Open a post → banner appears → click "Join matching campaign" → real detail page with submissions.
  - Admin: approve a moderator application → user appears on `/dashboard/validate` with validation queue populated.
  - Submit a custom challenge → XP increases by the calculated amount; streak bar updates.
  - `/dashboard/contributions` (if kept) no longer redirects into a wrong screen.
- **Lint/typecheck**: `npm run lint`, `npm run typecheck`, `npx convex dev --once` to regenerate and confirm no stale-binding warnings remain in the four flagged files (`ChangaHome.tsx`, `ChangaCampaigns.tsx`, `analytics/page.tsx`, `moderation-dashboard/page.tsx`).

---

## Open Questions (for the implementation agent, not blockers)

- Should we deprecate `/dashboard/contributions` entirely or keep it as an alias?
- Where in the nav tree do admin pages live (Settings → Admin, or a top-level Admin tab)?
- Should `changaCustomTaskTemplates` be visible to all users, or only to language-scoped moderators?

---

## Plan Path

`C:\Users\pc\Documents\samiati-1.0\.kilo\worktrees\cut-sparrow\.kilo\plans\1788539383933-changa-bridge-plan.md`