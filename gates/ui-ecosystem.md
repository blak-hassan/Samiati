# Gates: ecosystem

Scope: Discover, Changa, profile/milestones, settings presentation, and proposed pricing. Existing payment and backend implementations retained.

- [x] G1: Discover/Changa/profile/settings share tokens/navigation and retain live integration workflows.
  CHECK: npx tsc --noEmit
  EVIDENCE: TypeScript exited 0 after integration (exec sessions 89126 and 98446). ProductNav/ChangaShell/SettingsShell shared; Changa claim/draft/consent/audio upload/validation handlers retained. Settings store and account mirror unchanged by this leaf. Profile metrics and contribution breakdown use existing getDashboard output.
- [x] G2: Discover provenance and mock/live states truthful; configurable proposed pricing introduces no payment changes.
  EVIDENCE: DiscoverScreen uses actual getFeed/getSavedTopics/saveTopic; DiscoverCard labels AI summaries and publisher homepage links, catches share/save failures, and preserves Ask navigation. Missing service wrappers render ServiceUnavailable before Convex hooks. src/lib/pricing.ts exports PROPOSED_PLANS; /pricing explicitly labels proposals and contains no checkout CTA or invented usage allowances. AllAchievementsScreen now derives milestones from real aggregates/local history instead of fixed XP/dates.
- [x] G3: Accessible controls/responsive layout verified with appropriate checks; no fabricated counts or recordings.
  CHECK: npx vitest run tests/settings.test.ts tests/changa.test.ts
  EXPECT: Tests  54 passed
  EVIDENCE: 2 test files passed, 54 tests passed (exec 71911b). Static review: responsive grids, min-width constraints, safe-area mobile navigation, 44px primary controls, labeled save/share/filter/proposal controls, live errors/status, Radix reading dialog, main-content landmarks. RecentActivityCalendar labels its bounded real timeline sample. No browser/visual verification claimed: parent reports preview snapshots unavailable. Real authenticated/provider/audio workflows need configured deployment verification.

## Improvement passes

1. Implemented shared ecosystem layouts, truthful feed/save/read/share, live contribution presentation, profile, settings, proposed pricing.
2. Re-read data ownership and capability claims: removed cosmetic refresh/personalization copy, unsupported upsell promises, unverified language emoji; preserved task consent and uploads.
3. Defect pass: repaired no-provider crashes in owned components/profile route; fixed sharing errors; replaced fake achievements; corrected total label to include drafts; protected publisher links from non-domain URLs; bounded activity calendar clearly labeled.
4. Polish pass: language variety wording, mobile targets/wrapping, semantic status colors, readable helper text, source provenance, and per-file formatting. Final read found no additional defect within leaf scope.

## Remaining verification limits

- No successful browser snapshot; representative-width visual QA remains unverified.
- No authenticated Convex, physical microphone, or payment operation was exercised.
- Existing privacy storage/backend changes are owned and verified by root, not this leaf.
