# SEC-FIX-001: account and billing boundaries

Owner: Account & Settings. Implement only findings 1 and 5 in `plans/orchestration/reports/SEC-001.md`. Other delegates own Changa and QA; do not touch their files.

Allowed files: `convex/payments/billing.ts`, `convex/payments/usage.ts`, `convex/users/mutations.ts`, a narrowly required non-API helper under `convex/payments/`, focused new tests under `tests/` and minimal adjustments to existing tests when the real contract changes. Shared schema, generated APIs, manifests, UI and orchestration documents remain coordinator-owned.

Acceptance:

- Public billing and account usage entry points resolve authenticated identity and enforce the requested account/subscription owner before returning private data or making writes. Anonymous callers and another account cannot read or cancel a subscription or create its billing events. Owner access continues working. Preserve argument signatures and existing internal renewal/payment behavior.
- Handle uniqueness is enforced on updates as well as creation. Unchanged sync succeeds; another user's handle is rejected; a unique rename succeeds. Convex's indexed read/mutation transaction must preserve concurrency safety. Do not silently migrate or repair existing user records.
- Include meaningful direct-handler tests with fake contexts exercising anonymous, different-user and owner paths, including no-write assertions for rejected mutations. Tests must exercise actual exported handlers, not only mirror a new helper. Check the existing privacy tests still pass.
- Run focused Vitest tests, typecheck and lint for changed files. Use existing installed local tooling where safe, or install the existing lockfile dependencies if needed to make the worktree testable; do not change manifests or add dependencies. Do not contact app services. No live billing actions, migrations, deployments, pushes or PRs.
- Read `AGENTS.md` and appropriate local guides before code. Preserve pre-existing baseline behavior outside these security corrections.

Commit the completed change on your assigned worktree branch. Return commit SHA, branch/worktree, changed files, acceptance evidence, exact checks/results and limitations. Do not merge to the parent checkout. Do not start delegates. The parent independently reviews and integrates.
