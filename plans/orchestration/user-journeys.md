# QA-001: user journey audit

Owner: QA & Review. Mode: read-only inspection of the current working checkout. Do not modify files, create commits, start delegates or overwrite existing reports.

Read `AGENTS.md`, `SAMIATI_ORCHESTRATION.md`, `SAMIATI_PAGE_ARCHITECTURE.md` and the limits in `SAMIATI_UI_TESTING.md`.

Inspect all six product areas: public/onboarding, chat/history/languages, Discover, Changa/feedback, account/settings and billing presentation. Trace the real route/component/service connections. Prioritize broken transitions, misleading success states, guest/auth differences, persistence loss, inaccessible controls and cross-feature handoffs. Do not invent a defect because a feature is not implemented.

The user authorized browser QA as part of this orchestration. The coordinator has prepared a production build at `http://127.0.0.1:3100`. Use T3 `preview_status` first, then inspect that app with supported T3 preview tools. If the app or browser is unavailable, report the exact prerequisite/error and perform the source review; do not start servers, run builds or alter the runtime for this audit. Follow preview ownership/fallback rules and close tabs you open. Do not enter real credentials, submit forms, trigger uploads/payment/paid AI actions or alter account data.

Return a concise audit with:

1. Coverage of each area, distinguishing browser observations, source findings and unverified services.
2. At most five actionable confirmed defects, each with severity, exact file/line, trigger, expected/actual behavior, owner and smallest reasonable fix.
3. A prioritized browser acceptance checklist with prerequisites for blocked journeys.
4. Independent implementation candidates with named allowed files and dependencies.

Success is an evidence-based report that the coordinator can convert into small assignments. Existing historical checks do not establish current browser correctness. Return findings in the final response; the coordinator writes the durable report.
