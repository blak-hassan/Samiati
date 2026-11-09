# UI-FIX-001: source-confirmed journey corrections

Implemented by coordinator on 2026-11-09 after QA-001 completed. Backend delegates have disjoint code ownership.

## Behavior changes

1. Feedback promotion keeps the successfully submitted correction separate from the cleared editable input, preserving its review action and reference. Changing the vote clears stale promotion metadata.
2. Changa review advancement records completed submission IDs rather than increasing an index into a shrinking reactive queue. Both update orderings preserve remaining items; new arrivals appear after the queue was cleared.
3. Recent sessions renders all sorted matching conversations, including pinned sessions. All/Pinned grouping remains intact.
4. Guest Discover questions appear as unsent composer drafts. Sending as a guest carries the question through the sign-in return URL. Sign-in uses the installed Clerk fallback redirect property so an explicit return URL is honored. Guests do not auto-send requests.
5. Checkout validates the URL plan before initializing render state, falls back to the existing learner default for unsupported values and remounts the plan selector for a new valid URL plan.

## Evidence

- `npm test -- --reporter=dot`: PASS, 13 files / 116 tests, including initial checkout rendering for supported/unsupported values, both reactive review update orderings and question-preserving sign-in navigation.
- `npx tsc --noEmit --pretty false`: PASS, exit 0.
- ESLint on changed application/test files: PASS, zero errors; two pre-existing unused-import warnings in SavedConversationsScreen.
- `npm run build`: PASS, exit 0, after the UI fixes.
- Browser checks remain blocked by the earlier T3 navigation and snapshot timeouts. Server rendering, helper tests and source inspection are not live browser or service verification.

Logs: `plans/orchestration/baseline/ui-fix-*.log`. Independent review is required before marking the assignment Done. No deployment or live mutation was performed.
