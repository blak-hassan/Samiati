# Samiati delegate coordination

Started: 2026-11-09. Coordinator: the parent T3 Code conversation.

## Scope and operating rules

The user authorized coordinating the existing app and adding assignments later. This board records the reusable delegate roles, initial audits, verified findings and follow-up work. An audit finding becomes an implementation assignment after the coordinator checks the evidence and reserves the relevant files. New product features remain queued until their behavior is defined.

- Preserve existing modified and untracked work. The starting branch is `main`, commit `3bf4f2b`; the current app also depends on extensive uncommitted changes.
- Initial delegates inspect the current checkout without changing application files. A new worktree would omit these uncommitted changes. Before implementation fan-out, the coordinator must prepare a reviewed baseline containing the intended application files; do not blindly stage datasets, notebooks, caches or credentials.
- Normally activate two implementation delegates at a time. Independent review can use the remaining worker slot when work is ready.
- Editing delegates use T3-managed worktree isolation after the baseline is prepared. Read-only audits can share this checkout.
- Each assignment has one owner, explicit files, dependencies, acceptance criteria, validation and a final evidence report. Delegates do not spawn further delegates.
- Read `AGENTS.md` and the relevant installed Next.js guide under `node_modules/next/dist/docs/` before writing code. Preserve existing routes, persistence keys and service contracts.
- The coordinator reserves shared schema/types, generated APIs, root layout/styles, providers, proxy, language catalogue, shared preference stores, dependency manifests and build/CI configuration. Cross-domain changes require an agreed handoff.
- Source isolation does not isolate Convex or provider accounts. Coordinate schema generation and shared service writes. Initial audits do not deploy, submit contributions, charge payments, call paid AI services or alter real account data.
- Review finished diffs, integrate one branch at a time and rerun relevant integrated checks. HTTP success, mocked tests and static inspection must not be reported as proof of live browser/service behavior.

## Reusable roles

| Role | Primary responsibility | Typical ownership |
| --- | --- | --- |
| Lead | Backlog, priorities, dependencies, shared contracts, review and integration | This board, task briefs and shared files explicitly reserved above |
| Public & Onboarding | Landing, public language exploration, onboarding, waitlist and SEO | Public routes/components and waitlist domain code |
| Chat & Languages | Chat, language choice, history and translation/search integration | Chat/search components, conversation services and domain-specific AI functions |
| Discover | Feed, categories, cards, saved reading and Ask Samiati entry | Discover screens/components and `convex/discover/*` |
| Changa & Feedback | Campaigns, claims, drafts, consent, uploads, validation and correction promotion | Changa/feedback components and domain backend functions |
| Account & Settings | Identity flows, profile, preferences, privacy, data and billing | Account/settings screens and corresponding backend domains; coordinate shared providers |
| QA & Review | Reproduction, user journey checks, accessibility, regressions and independent diff review | Evidence and test plans; fixes assigned to the owning feature delegate |

These are reusable roles, not continuously running agents. Domain delegates own relevant tests as part of each implementation.

## Important handoffs

- Public/onboarding -> account preferences -> chat: one language/theme preference contract and existing persistence.
- Discover -> chat: preserve the existing question/deep-link contract.
- Chat feedback -> Changa -> profile: agree authorization, consent, submission identity and status transitions.
- Public pricing -> billing -> AI quotas: display, purchase behavior and enforced entitlements must agree; draft prices are not live offers.

## Task board

Flow: Queued -> Ready -> Working -> Review -> Done. A blocked item names its dependency.

| ID | Owner | Assignment | Status | Dependencies / evidence |
| --- | --- | --- | --- | --- |
| ORCH-001 | Lead | Create roster, shared ownership and briefs | Done | This file and `plans/orchestration/*` |
| BASE-001 | Lead | Record fresh tests, lint, format, typecheck and build baseline | Done | Fresh results below; pre-existing limitations recorded |
| QA-001 | QA & Review | Read-only review of actual user journeys and browser test readiness | Done | Five source-confirmed UI defects; preview navigate/snapshot timeouts; `plans/orchestration/reports/QA-001.md` |
| UI-FIX-001 | Lead / feature owners | Correct feedback promotion, review advancement, Recent history, guest handoff and invalid checkout plan | Working | REVIEW-001 requests stable active review identity and all explicit sign-in drafts; parent correcting; earlier 116-test/build evidence predates these corrections |
| SEC-001 | Account & Settings / backend review | Read-only authorization, ownership and consent audit | Done | Five confirmed source findings; `plans/orchestration/reports/SEC-001.md`; deployed behavior untested |
| SNAP-001 | Lead | Prepare reviewed local application checkpoint for worktrees | Done | Commit `f5d971b6cdbafe8ac2d5ec168880056e75ef8c86`, branch `work/samiati-orchestration-20261109`; main preserved; no datasets, notebooks, caches or credential files staged |
| SEC-FIX-001 | Account & Settings | Protect billing/usage access and prevent handle collisions | Review | Independently accepted and cherry-picked as `0867013069df9b8abf7b24cb0dd2ff99149eb7ab`; integrated tests pending |
| SEC-FIX-002 | Changa & Feedback | Enforce submission provenance/consent and revoke future release eligibility | Working | REVIEW-002 requests actual worker eligibility and curation-prefix fixes; parent correcting candidate in its existing worktree before integration |
| REVIEW-002 | QA & Review | Review completed Changa consent and revocation candidate | Done | Two objections; `plans/orchestration/reports/REVIEW-002.md`; acceptance held |
| SEC-DESIGN-003 | Upload design | Specify a trusted recording upload ownership contract | Working | Read-only design; implementation waits for SEC-FIX-002 integration; run below |
| SEC-FIX-003 | Changa upload owner | Bind stored recordings to authenticated uploader/submission | Queued | SEC-FIX-002; trusted upload design and schema/API coordination before implementation |
| TOOL-001 | Lead / tooling | Keep full lint from scanning nested agent worktrees and bundled skill scripts | Queued | Full lint reached `.kilo/worktrees/*` and `.github/skills/*`; review ignore boundaries before changing config |
| STYLE-001 | Assigned when scheduled | Address existing formatting drift in small batches | Queued | Format check reports 222 files; avoid mixing broad formatting into feature work |
| FIX-001 | Assigned after audit | Small verified defect fixes | Queued | Findings reviewed; intended code baseline prepared; exact file ownership assigned |
| REVIEW-001 | QA & Review | Independent review of UI-FIX-001 and SEC-FIX-001 | Done | Account accepted; two UI objections; `plans/orchestration/reports/REVIEW-001.md` |
| INT-001 | Lead | Integrate sequentially and rerun affected checks | Queued | Independent review complete |

## Baseline

Fresh checks completed on 2026-11-09 against the current checkout:

| Command | Result | Evidence |
| --- | --- | --- |
| `npm test -- --reporter=dot` | PASS: 10 files / 102 tests | `plans/orchestration/baseline/tests.log` |
| `npx tsc --noEmit --pretty false` | PASS, exit 0 | `plans/orchestration/baseline/typecheck.log` |
| `npm run build` | PASS, exit 0 | `plans/orchestration/baseline/build.log` |
| `npm run lint` | Stopped: scans nested agent worktrees and bundled skill scripts | `plans/orchestration/baseline/lint.log`; TOOL-001 |
| `npx eslint src convex tests --no-warn-ignored` | PASS: 0 errors, 192 existing warnings | `plans/orchestration/baseline/lint-app.log`; this is application-scoped, not the full lint command |
| `npm run format:check` | FAIL: 222 files with existing style differences | `plans/orchestration/baseline/format.log`; STYLE-001 |

Logs use the existing ignored `.log` extension. The coordinator also starts the completed production build on `http://127.0.0.1:3100` for read-only QA, with no runtime build/deploy commands assigned to delegates. Browser/service behavior remains unverified until observed.

## Delegate runs

- QA-001: <t3-thread://v2/e200690b-4a5a-4db7-94de-4bd2418dc7e3/thread:delegated-task:command%3Amcp%3Aa57b702e-d0c4-429a-9714-b91c49c1e125%3Adelegate-task%3Asamiati-orchestration-20261109-qa-001-v1>
  - Task ID: `node:delegated-task:command%3Amcp%3Aa57b702e-d0c4-429a-9714-b91c49c1e125%3Adelegate-task%3Asamiati-orchestration-20261109-qa-001-v1`
  - State at launch: running; completion notification resumes the coordinator.
- SEC-001: <t3-thread://v2/e200690b-4a5a-4db7-94de-4bd2418dc7e3/thread:delegated-task:command%3Amcp%3Aa57b702e-d0c4-429a-9714-b91c49c1e125%3Adelegate-task%3Asamiati-orchestration-20261109-sec-001-v1>
  - Task ID: `node:delegated-task:command%3Amcp%3Aa57b702e-d0c4-429a-9714-b91c49c1e125%3Adelegate-task%3Asamiati-orchestration-20261109-sec-001-v1`
  - State at launch: running; completion notification resumes the coordinator.

The local production server from unified exec session `9789` was stopped after QA-001 finished so the next build cannot race its output directory. QA-001 closed its own browser tab. Baseline commands are complete; UI-FIX-001 now contains explicit application changes recorded in `plans/orchestration/reports/UI-FIX-001.md`.

- SEC-FIX-001: <t3-thread://v2/e200690b-4a5a-4db7-94de-4bd2418dc7e3/thread:delegated-task:command%3Amcp%3Aa57b702e-d0c4-429a-9714-b91c49c1e125%3Adelegate-task%3Asamiati-orchestration-20261109-sec-fix-001-v1>
  - Task ID: `node:delegated-task:command%3Amcp%3Aa57b702e-d0c4-429a-9714-b91c49c1e125%3Adelegate-task%3Asamiati-orchestration-20261109-sec-fix-001-v1`
  - State at launch: running; isolated worktree from local checkpoint `f5d971b`.
- SEC-FIX-002: <t3-thread://v2/e200690b-4a5a-4db7-94de-4bd2418dc7e3/thread:delegated-task:command%3Amcp%3Aa57b702e-d0c4-429a-9714-b91c49c1e125%3Adelegate-task%3Asamiati-orchestration-20261109-sec-fix-002-v1>
  - Task ID: `node:delegated-task:command%3Amcp%3Aa57b702e-d0c4-429a-9714-b91c49c1e125%3Adelegate-task%3Asamiati-orchestration-20261109-sec-fix-002-v1`
  - State at launch: running; isolated worktree from local checkpoint `f5d971b`.

The SEC-001 audit is complete. Parent source review confirmed the initial security assignments; no fix is integrated or deployed yet. SEC-FIX-003 remains queued behind the shared Changa submission changes. Untracked training data, notebooks, caches, earlier gates and unrelated scripts remain in the original checkout.

- REVIEW-001: <t3-thread://v2/e200690b-4a5a-4db7-94de-4bd2418dc7e3/thread:delegated-task:command%3Amcp%3Aa57b702e-d0c4-429a-9714-b91c49c1e125%3Adelegate-task%3Asamiati-orchestration-20261109-review-001-v1>
  - Task ID: `node:delegated-task:command%3Amcp%3Aa57b702e-d0c4-429a-9714-b91c49c1e125%3Adelegate-task%3Asamiati-orchestration-20261109-review-001-v1`
  - State at launch: running, read-only review of completed UI and account candidates. No browser/service correctness claim.

UI-FIX-001 is committed locally at `c90adad812e49cb65f28cc910ea50c977118a576` with 116 tests, typecheck and production build passing. SEC-FIX-001 awaits independent acceptance and cherry-pick. Changa consent work remains in its separate worktree.

- REVIEW-002: <t3-thread://v2/e200690b-4a5a-4db7-94de-4bd2418dc7e3/thread:delegated-task:command%3Amcp%3Aa57b702e-d0c4-429a-9714-b91c49c1e125%3Adelegate-task%3Asamiati-orchestration-20261109-review-002-v1>
  - Task ID: `node:delegated-task:command%3Amcp%3Aa57b702e-d0c4-429a-9714-b91c49c1e125%3Adelegate-task%3Asamiati-orchestration-20261109-review-002-v1`
  - State at launch: running, read-only; no application writes.
- SEC-DESIGN-003: <t3-thread://v2/e200690b-4a5a-4db7-94de-4bd2418dc7e3/thread:delegated-task:command%3Amcp%3Aa57b702e-d0c4-429a-9714-b91c49c1e125%3Adelegate-task%3Asamiati-orchestration-20261109-sec-design-003-v1>
  - Task ID: `node:delegated-task:command%3Amcp%3Aa57b702e-d0c4-429a-9714-b91c49c1e125%3Adelegate-task%3Asamiati-orchestration-20261109-sec-design-003-v1`
  - State at launch: running, read-only; no application writes.

SEC-FIX-002 completed with 53 new handler tests (155 total on its baseline), typecheck and targeted lint passing. Both security candidates remain unintegrated pending independent review. Upload ownership design proceeds read-only while reviews run; no historical data migration or external release is authorized by these tasks.

## Adding an assignment

```text
Assignment:
User outcome:
Primary delegate:
Allowed files / feature area:
Dependencies / shared contracts:
Acceptance criteria:
Required checks:
```

The coordinator assigns an ID, checks overlap and dependencies, and moves the item to Ready. Implementation finishes with changed files, acceptance evidence, checks actually run and limitations. External releases remain separate from local review and integration.
