# SEC-001: backend authorization and lifecycle audit

Owner: Account & Settings / backend reviewer. Mode: read-only inspection of the current working checkout. Do not modify files, create commits, run service mutations, deploy, regenerate schemas, start delegates or overwrite reports.

Read `AGENTS.md`, `SAMIATI_ORCHESTRATION.md`, current security plans and the actual current implementation. Do not assume an old checklist still describes a defect.

Trace identity and ownership in `convex/users/*`, `convex/chat.ts`, `convex/feedback.ts`, `convex/changa/{tasks,submissions,consent,validation}.ts`, upload functions and the server authorization/rate-limit/quota helpers. Review billing/usage entry points only as needed to understand identity and entitlement boundaries. Inspect callers and validators where needed to confirm reachability.

Prioritize cross-account reads/writes, guest identity handling, contribution claim/consent lifecycle bypasses, uploaded-file ownership, role checks and quota bypasses. Do not read local credential files or print secret values. Use static inspection and existing tests; do not contact live services or install dependencies. Avoid build/typecheck commands because the coordinator owns the baseline run.

Return a concise audit with:

1. Coverage and authorization/lifecycle invariants checked.
2. At most five confirmed findings: severity, exact file/line, triggering inputs and call path, expected protection, actual behavior, confidence and smallest proposed fix.
3. Which existing protections already work and any unverified assumptions.
4. Focused regression scenarios and independent implementation candidates with named files, API/schema dependencies and suggested owner.

Do not report theoretical concerns as confirmed vulnerabilities. If no confirmed defect is found, say so and identify the checks still requiring test accounts or service execution. Return findings in the final response; the coordinator writes the durable report.
