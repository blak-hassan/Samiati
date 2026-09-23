# End-to-End Journey Simulation — Implementation Plan
**Project**: Samiati · Worktree `cut-sparrow`
**Source**: `plans/end-to-end-journey-simulation-plan.md` (static simulation design + prioritized gap catalog)
**Goal**: Turn the static simulation document into a runnable Vitest + Playwright harness that walks Modules 1–4 against the existing Convex test backend and produces a structured gap report. P0–P3 fixes are **out of scope** for this plan (a separate plan will cover remediation if requested).

---

## 1. Scope and Non-Goals

**In scope**
- A new `tests/journey/` directory of Vitest integration tests that exercise Modules 1, 2, 3, 4 step-by-step against the Convex test backend (`convex-test` or `convex-test-helpers`), with mocked Clerk identity and mocked HuggingFace calls.
- A new `e2e/journey.spec.ts` Playwright spec that drives UI-only assertions (route existence, screen rendering, navigation) without requiring live Clerk/Convex/HF.
- A structured gap-report emitter (`tests/journey/report.ts`) that writes JSON to `tests/journey/artifacts/journey-report.json` and a Markdown summary to `tests/journey/artifacts/journey-report.md`, matching the Reporting Framework in §9 of the source plan.
- `package.json` scripts `test:journey` (Vitest) and `test:e2e:journey` (Playwright).

**Out of scope (deliberately deferred)**
- Any source-code remediation of the gaps listed in §3–§6 and §8 of the source plan. The harness's job is to surface them, not fix them.
- Live Clerk / HuggingFace / Paystack integration — all external services are stubbed.
- New Convex mutations, queries, routes, or schema changes.
- Implementation of the onboarding wizard, account deletion/GDPR export, notification preferences persistence, culturalBackground UI, etc.

---

## 2. Pre-Implementation: Reconcile Source Plan With Current Codebase

The source plan (dated 2026-08-30) and the worktree's current state diverge in several places. The harness must encode the **actual** current behavior, not the snapshot in the document. Key deltas to verify before writing tests:

| Source plan claim | Current code | Action |
|---|---|---|
| §4 / SAM-07, SAM-08 — AI quota `tier: "free"` hardcoded | `convex/lib/aiSecurity.ts:55-65` resolves tier via `internal.payments.billing.getUserPlanTier` | Update §4 expectations in harness; mark SAM-07/SAM-08 as **historical** (see plan §8 P0 note that already says this is resolved in spirit) |
| §5 / CHANGA-02 — Changa campaigns route missing | `src/app/dashboard/changa-campaigns/page.tsx` exists; `useNavigation.ts` maps `Screen.CHANGA_CAMPAIGNS` | Mark CHANGA-02 as historical (already done in source plan); harness should assert route resolves |
| §5 / CHANGA-10 — No offline queue | `src/lib/changaOfflineQueue.ts` + `requeueChangaSubmission` exist | Mark CHANGA-10 as historical |
| §5 / CHANGA-11 — Submission dialect/region mismatch unenforced | `convex/changa/submissions.ts` cross-checks dialectCode/regionCode | Mark CHANGA-11 as historical |
| §6 — `settings/billing` listed | `src/app/dashboard/settings/billing/page.tsx` exists | Add to route-coverage sweep |

These reconciliations are encoded directly in the harness's expected-output fixtures, not in a separate document.

---

## 3. Target Architecture

```
tests/journey/
├── harness.ts             # Shared factories: createTestCtx, withIdentity, withGuest, mockHf
├── factories/
│   ├── users.ts           # createUser({ role, isGuest, handle })
│   ├── posts.ts           # createPost, likePost, commentOnPost
│   ├── changa.ts          # seedTask, claimTask, submitText, attachAudio, voteOnSubmission
│   └── convexTestClient.ts
├── modules/
│   ├── module1.auth.ts
│   ├── module2.samiati.ts
│   ├── module3.changa.ts
│   └── module4.settings.ts
├── report.ts              # writeJson, writeMarkdown, summarizeGaps
├── gapCatalog.ts          # IDs + descriptions sourced 1:1 from source plan §3.2, §4.4, §5.5, §6.2
└── artifacts/             # gitignored; journey-report.json + journey-report.md

e2e/
├── journey.spec.ts        # Playwright route/screen coverage, plus demo-mode flows
└── helpers/
    └── demoMode.ts        # forces isDemoMode so tests don't need Clerk env
```

### 3.1 Identity & guest fixtures

- `withIdentity(ctx, { clerkId, emailVerified, role })` returns a Convex `users` row + sets `ctx.auth` token.
- `withGuest(ctx)` returns a `users` row with `role: 'guest'`, `isGuest: true`, `clerkId: 'guest_<ts>_<rand>'` exactly matching `storeGuestUser` semantics (`convex/users/mutations.ts:256-328`). Use the real mutation so handle-uniqueness and rate-limiting behavior is exercised.
- `withPlanTier(ctx, tier)` upserts a `subscriptions` row so `getUserPlanTier` returns the desired tier when the harness reaches `enforceAiQuotaAction`.

### 3.2 HuggingFace stubbing

- Patch the module loaded by `convex/lib/providers/huggingface.ts` via Vitest's `vi.mock`. The stub returns deterministic Swahili text for `chat`, deterministic translated text for `translate`, and exercises 403 / 503 branches via a `hfFailMode` option (`'ok' | '403' | '503'`).

### 3.3 Convex test backend

- Use `convex-test` (or the helper already present in repo if any) to spin up an in-memory backend per test file. Each test starts with `t.run()` to isolate state.

### 3.4 Gap report schema (`tests/journey/artifacts/journey-report.json`)

```jsonc
{
  "runId": "<uuid>",
  "timestamp": "2026-09-04T...",
  "summary": { "passed": 0, "failed": 0, "skipped": 0, "gapsOpen": 0, "gapsHistorical": 0 },
  "modules": [
    { "id": "module1", "name": "User Authentication & Onboarding", "steps": [/* per-step pass/fail with assertion + actual */] }
  ],
  "gaps": [
    {
      "id": "AUTH-01",
      "category": "UX gap",
      "severity": "Medium",
      "location": "src/app/dashboard/page.tsx:96-103",
      "impact": "Guest users have no profile management UI",
      "verified": true,
      "verifiedBy": "module1.auth > guest dashboard renders only GuestBanner+HomeSearchScreen",
      "suggestedFix": "...",
      "status": "open" | "historical"
    }
  ]
}
```

### 3.5 Gap catalog (`tests/journey/gapCatalog.ts`)

- One constant per gap ID from §3.2 (AUTH-01..06), §4.4 (SAM-01..08), §5.5 (CHANGA-01..12), §6.2 (SET-01..08). Status field starts as `'open'`; the harness flips to `'historical'` only when the corresponding assertion **passes** against current code (e.g. SAM-07/08 will flip to historical because `enforceAiQuotaAction` reads the real tier).

---

## 4. Module Walkthroughs as Tests

For each module, write one Vitest `describe` block whose `it` cases mirror the steps in §3.1, §4.1–4.3, §5.1–5.4, §6.1 of the source plan. Each step is a test; each test has three phases: **act** (call the real mutation/query), **assert** (compare to expected response), **record** (append to the in-memory report).

### 4.1 Module 1 — Authentication & Onboarding (`modules/module1.auth.ts`)

Mirrors plan steps 1.1–1.10. Notable tests:

- `1.2 store creates user with role=member, isGuest=false` — calls real `users.store`; asserts `users.getByClerkId` returns the inserted doc.
- `1.3 duplicate handle gets suffixed` — seeds a user with handle `kababa`, calls `store` again with same handle, asserts `finalHandle` matches `/^kababa(.{0,18})_[a-z0-9]+$/`.
- `1.6 AuthGuard renders children in demo mode` — UI assertion, deferred to Playwright `journey.spec.ts` (not exercisable in Vitest).
- `1.7 storeGuestUser rate-limit boundary` — calls `storeGuestUser` 201 times within an hour; asserts the 201st throws the rate-limit message.
- `1.8 / 1.9 / 1.10 guest denial paths` — call `chat.sendMessage`, `posts.create`, `users.updateProfile` with a guest ctx; assert exact error strings from the plan.

### 4.2 Module 2 — Samiati AI (`modules/module2.samiati.ts`)

- `2a.2 chat.sendMessage returns HF reply` — stubbed HF returns `'Habari nzuri!'`; assert the action returns that string and that the `aiRouter` route is logged via `captureMessage` if exercised.
- `2a.3 message >5000 chars throws` — assert exact error string from `convex/chat.ts:37-40`.
- `2a.4 free-tier 6th message rejected` — using `withIdentity` + no subscription → `withPlanTier('free')`, fire 5 successful chat calls then assert 6th throws the quota message including "free plan" + retry minutes.
- `2a.4b learner-tier 6th message accepted` — same setup but `withPlanTier('learner')`; assert 6th call passes (this is the SAM-07/SAM-08 regression sentinel).
- `2a.5 thumbs-up toggle off` — call `feedback.submit` twice with `type:'up'`; assert the second call deletes the first record.
- `2b.1 / 2b.2 translate returns translated text` — `hfFailMode='ok'`.
- `2b.3 translate 403` — `hfFailMode='403'`; assert exact error string.
- `2b.4 translate 503` — `hfFailMode='503'`; assert the "loading" message.
- `2c.1 like increments stats.likes` — seeds post with `stats.likes=0`, calls `like`, asserts post now has `stats.likes=1` and a `notifications` doc exists for the author.
- `2c.2 unlike floors at 0` — like then unlike then unlike again; assert `stats.likes` is `0`, not `-1`.
- `2c.3 self-like does not notify` — assert no notifications row created when `authorId === user._id`.

### 4.3 Module 3 — Changa (`modules/module3.changa.ts`)

- `3a.3 claimTask creates active claim, expires in 20 minutes` — call `claimTask`, then query `changaTaskClaims.get`; assert `status === 'active'`, `expiresAt` is within 20m ± 1s.
- `3a.3 11th concurrent claim rejected` — claim 10 different tasks, assert 11th throws the max-concurrent message.
- `3a.4 startClaimedSubmission requires allowTraining` — seed `changaConsentPolicies` with version `'v1'`; call `startClaimedSubmission` with `allowTraining: false`; assert throws.
- `3a.5 submit velocity 51/hr rejected` — call `submitSubmission` 50 times successfully, 51st throws.
- `3a.6 audio MIME whitelist` — assert `attachSubmissionAsset` rejects `image/png` and accepts `audio/webm`.
- `3a.6 audio >25MB rejected` — assert exact error string.
- `3a.8 vote tally → validated on 2 accepts` — seed submission, call `submitValidationVote` twice with `verdict:'accept'` from two distinct users; assert `changaSubmissions.get` shows `status === 'validated'`.
- `3a.8 disagreement → moderator assignment` — same setup, one accept + one reject; assert `changaValidationAssignments` row created with `roleRequired:'moderator'`.
- `3b.3 proposal approval creates active campaign` — call `submitCampaignProposal` then `reviewCampaignProposal` with `decision:'approved'`; assert a `changaCampaigns` row exists with `status:'active'`.

### 4.4 Module 4 — Settings (`modules/module4.settings.ts`)

- `4.3 invalid avatar URL throws` — call `users.updateProfile` with `avatarUrl:'javascript:alert(1)'`; assert exact error from `convex/users/mutations.ts:65-69`.
- `4.4 avatar >2048 chars truncated` — send 3000-char URL; assert stored length is 2048.
- `4.5 privacy flags round-trip` — patch all four flags, `users.get` returns them.
- `4.6 / 4.8 / 4.9 / 4.10 / 4.11 / 4.12 / 4.13 route existence` — these are **Playwright** assertions, not Vitest, because the screens are React components.

### 4.5 Edge-case sentinel tests

For each non-historical gap in `gapCatalog.ts`, add a `it` whose name is the gap ID and whose body **asserts the bug is still present** (e.g. SAM-01: "chat history persists only in localStorage" → assert no `conversations/messages` row created by `dashboard.handleSaveChat` flow). These tests pass-by-intent; failing them means someone silently fixed a gap and we should re-classify it.

---

## 5. Playwright Journey Spec (`e2e/journey.spec.ts`)

Single file, four `test.describe` blocks mirroring Modules 1–4. Runs against `next dev` with `NEXT_PUBLIC_DEMO_MODE=true` so Clerk/HF/Convex aren't required. Assertions are intentionally shallow:

- Module 1: `/sign-up`, `/sign-in`, `/forgot-password`, `/dashboard` (guest) all return 200 and render the strings in the plan.
- Module 2: `/dashboard` renders the chat area, sidebar, "New chat" button.
- Module 3: `/dashboard/changa-activity`, `/dashboard/changa-campaigns`, `/dashboard/contributions`, `/dashboard/validate` return 200; `Screen.CHANGA_CAMPAIGNS` in `useNavigation.ts` maps to a real route.
- Module 4: `/dashboard/settings/account`, `/notifications`, `/privacy`, `/languages`, `/data`, `/blocked`, `/muted`, `/help`, `/billing` all return 200; the account page shows the demo user's name.

This file is **not** an integration test; it's a route-coverage sweep tied to the static analysis in §7.3 of the source plan.

---

## 6. Reporting & CI Integration

### 6.1 Local

- `pnpm test:journey` runs `vitest run tests/journey/` and writes `tests/journey/artifacts/journey-report.{json,md}`.
- The Markdown report lists: per-module pass/fail counts, then a table of all gaps with `status`, `verified`, and a 1-line proof.

### 6.2 CI (proposed, not implemented in this plan unless requested)

- A new GitHub Actions job `journey` that runs `pnpm test:journey` on PRs and uploads the artifacts.

---

## 7. Validation Plan

After implementation, the harness is correct iff:

1. `pnpm test:journey` exits 0 in the current worktree **without any source-code changes**. (Proves the harness encodes current behavior.)
2. Every step in §3.1, §4.1–4.3, §5.1–5.4, §6.1 of the source plan has a corresponding `it` block — verifiable by `rg "^\\s*it\\(" tests/journey/modules` matching the step IDs in the plan.
3. `gapCatalog.ts` contains all 28 gap IDs from §3.2, §4.4, §5.5, §6.2; cross-check with `rg "^\\s*\\\"(AUTH|SAM|CHANGA|SET)-[0-9]+\\\"" tests/journey/gapCatalog.ts | wc -l` returning 28.
4. The Markdown report includes both `open` and `historical` gaps (SAM-07/08, CHANGA-02/10/11 must surface as historical).
5. `pnpm test:e2e:journey` exits 0 against `next dev` in demo mode.

If (1) fails, the harness has a bug. If (1) passes but the report shows historical gaps that the source plan still lists as open, the source plan needs a follow-up edit to mark them historical — that edit is **in scope** here (a single-line update to §8 of the source plan is part of "implementation" deliverable).

---

## 8. Open Decisions (small, answer before coding starts)

| # | Question | Recommended default |
|---|---|---|
| Q1 | Convex test framework: `convex-test` (official) vs. existing in-repo helper? | `convex-test` if not already pinned; otherwise use the in-repo helper. Verify in `package.json` and `convex/_generated/`. |
| Q2 | Should historical gaps still appear in the report? | Yes, as `status: "historical"` with `verifiedBy` proof — gives reviewers confidence the prior fixes stuck. |
| Q3 | Should `tests/journey/artifacts/` be committed? | No. Add to `.gitignore`. CI uploads as build artifacts. |
| Q4 | Demo-mode Playwright run — do we need a `webServer` block? | Yes, reuse the existing `playwright.config.ts` `webServer` if present; otherwise add `pnpm --filter . start &` to the spec's `webServer` config. |

---

## 9. Out-of-Scope Reminders

- **P0 chat persistence** (SAM-01): not fixed here. The harness will assert SAM-01 is still open.
- **Handle collision race** (AUTH-02): not fixed. Harness asserts it.
- **Like race** (SAM-05): not fixed. Harness asserts it.
- **Settings backends missing** (SET-01), **profile visibility not enforced** (SET-03), **no account deletion** (SET-06): all surfaced, not fixed.
- **Two competing AI backends** (SAM-02): the harness only exercises `chat.ts`; `sunflower.ts` is left to a separate consolidation plan.

---

## 10. Task List for the Implementation Agent

1. Verify Q1 by reading `package.json` deps + `convex/_generated/`. Decide between `convex-test` and in-repo helper. If neither is installed, install `convex-test`.
2. Create `tests/journey/` skeleton: `harness.ts`, `report.ts`, `gapCatalog.ts`, `factories/`, `modules/`, `artifacts/.gitkeep`.
3. Author `gapCatalog.ts` with all 28 IDs from the source plan; copy `category`, `severity`, `location`, `impact`, `suggestedFix` verbatim.
5. Implement `harness.ts`: `withIdentity`, `withGuest`, `withPlanTier`, `mockHf(mode)`, `createTestCtx()`.
6. Implement `factories/{users,posts,changa}.ts`.
7. Implement `modules/module1.auth.ts` (steps 1.1–1.10).
8. Implement `modules/module2.samiati.ts` (steps 2a.1–2c.6).
9. Implement `modules/module3.changa.ts` (steps 3a.1–3d.4).
10. Implement `modules/module4.settings.ts` (steps 4.1–4.13, settings 4.6/4.8–4.13 route existence deferred to Playwright).
11. Implement `report.ts` with `writeJson`, `writeMarkdown`, called from a `afterAll` hook in each module file.
12. Add `"test:journey": "vitest run tests/journey/"` to `package.json` scripts.
13. Implement `e2e/journey.spec.ts` with route-coverage sweeps for all four modules.
14. Add `"test:e2e:journey": "playwright test e2e/journey.spec.ts"` to `package.json`.
15. Add `tests/journey/artifacts/` to `.gitignore`.
16. Run `pnpm test:journey` and `pnpm test:e2e:journey`; confirm exit 0 and inspect the generated Markdown report.
17. Apply the §8 reconciliation edits to `plans/end-to-end-journey-simulation-plan.md` so SAM-07/08, CHANGA-02/10/11 are explicitly marked historical (one-line edits each).

Validation gate for step 17 acceptance: `pnpm test:journey` exits 0 and `tests/journey/artifacts/journey-report.md` contains a row for every gap ID with the correct `status`.

---

*End of plan.*