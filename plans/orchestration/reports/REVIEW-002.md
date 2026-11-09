# REVIEW-002

**Recommend changes before acceptance: two concrete objections.**

1. **High — The actual worker still processes revoked audio.**  
   The new guard in [processing.ts:311](C:/Users/pc/.t3/worktrees/samiati-1.0/t3-255241bb/convex/changa/processing.ts:311) protects `completeProcessingRun`, but the scheduled worker uses separate handlers. [worker.ts:28](C:/Users/pc/.t3/worktrees/samiati-1.0/t3-255241bb/convex/changa/worker.ts:28) returns withdrawn submissions, the action dispatches ASR at line 80, and completion stores the transcript at line 178.

   Independently reproduced: submit audio → revoke consent → invoke the actual worker action with all external I/O stubbed. It read storage, called the ASR adapter once, and completed the run while the submission remained withdrawn.

   **Classification:** pre-existing path left unprotected; incomplete remediation of the requested stale-worker behavior.  
   **Smallest fix:** apply eligibility checks to actual worker selection, dispatch, completion and routing. Ensure skipped revoked jobs cannot clog the queue. Add direct worker-handler regressions, including completion after revocation.

2. **Medium — Ineligible historical rows can permanently hide valid curation candidates.**  
   [curation.ts:35](C:/Users/pc/.t3/worktrees/samiati-1.0/t3-255241bb/convex/changa/curation.ts:35) takes the first `limit` validated submissions before filtering eligibility. Historical rows that deliberately fail closed remain validated and repeatedly occupy that prefix.

   Independently reproduced: 50 ineligible validated rows followed by one valid claimed submission. `limit: 50` returned nothing; `limit: 51` returned the valid submission. The current UI always requests 50.

   **Classification:** newly introduced workflow regression.  
   **Smallest fix:** scan past ineligible rows until enough eligible candidates are found or the query is exhausted. Add an invalid-prefix regression test.

The remaining reviewed gates behaved as intended: legacy creation fails closed; final submission and idempotent retries validate consent/provenance; consumed claims survive expiry; correction provenance survives vote deletion; stale curation, approval, export, release and evaluation mutations reject revoked sources. Audit links remain intact. Deliberately unprovable historical rows are appropriately rejected.

Independent checks passed:

- Focused tests: **53/53**
- Full suite: **155/155**
- Typecheck, targeted lint and diff whitespace check

No files changed; candidate remains clean at `e095c3a3cec500678ac799df41cb5f44739dfc58`.

Limits: no live services or concurrent transactions were exercised. Release-count recomputation performs broad scans whose production transaction cost remains unverified. External ASR already dispatched before revocation cannot be recalled. The separately tracked upload-ownership vulnerability remains outside this candidate.
