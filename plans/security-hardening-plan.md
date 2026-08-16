# Samiati Security Hardening — Implementation Plan

Derived from `Samiati_Security_Hardening_Master_Plan.md`, scoped to what the
actual repository shows. This plan records the audit findings, the fixes, and
verification for each.

## Architecture snapshot (from code audit)

- **Frontend**: Next.js 16 App Router, React 19, Clerk (`src/proxy.ts` middleware, `ConvexProviderWithClerk`).
- **Backend**: Convex (queries/mutations/actions). Guests connect with a bare `ConvexProvider` (no identity), so `getCurrentUser` returns `null` for them server-side.
- **AI**: 6 public Convex actions → HuggingFace Inference API (Sunflower chat/search/translate, Paza Whisper ASR, Orpheus TTS). One API key (`HUGGINGFACE_API_KEY`).
- **Changa**: well-structured pipeline with ownership checks, idempotency keys, velocity limits, internal worker. Already strong — only targeted fixes needed.
- **API routes**: one — `/api/sms/send` (Twilio webhook).
- **Security headers**: already present in `next.config.ts` (CSP, HSTS, nosniff, frame-ancestors). No `dangerouslySetInnerHTML` in the repo.
- **Secrets**: `.env*` gitignored; git history scan found only placeholder values.

## Vulnerability register

| ID | Severity | Finding | Fix | Status |
|---|---|---|---|---|
| SEC-001 | Critical | AI actions (`translateText`, `gemini.sendMessage`, `gemini.search`, `chat.sendMessage`, `synthesizeSpeech`, `transcribeAudio`) require **no authentication** — anyone with the public Convex URL can burn unlimited HF credits | Require authenticated non-guest user + per-service daily/hourly quotas | Fixed (2026-08): auth + quota gates in `convex/lib/ai-security.ts`, `convex/lib/ai-quota.ts` |
| SEC-002 | Critical | `/api/sms/send` POST is open: no Twilio signature validation, no rate limit → SMS pumping + free AI cost; GET leaks Twilio config state | Twilio signature validation, per-number rate limit, remove GET | Fixed (2026-08): POST-only, `X-Twilio-Signature` HMAC-SHA1 + `SMS_WEBHOOK_SECRET`, 5/hr + 20/day per number |
| SEC-003 | High | `storeGuestUser` is public and unvalidated — unlimited user rows (sybil / storage abuse) | Global rate limit, name/handle validation | Fixed (2026-08): 200/hr + 1000/day, name/handle validation |
| SEC-004 | High | `generateUploadUrl` unlimited — storage abuse | Per-user rate limit, guest rejection | Fixed (2026-08): 30/hr, guests rejected |
| SEC-005 | High | `attachSubmissionAsset` trusts client `mimeType`/`sizeBytes` — no server-side verification of the actual stored file | Verify via `ctx.storage.getMetadata` (real size + content type), mime whitelist | Fixed (2026-08): metadata verified, mime whitelist, 25 MB cap |
| SEC-006 | High | `createDraftSubmission` spreads `...args` into the DB — client can set `autoChecks`, `qualityFlags`, `submissionType` mismatched with the task | Explicit field whitelist, length caps, task-type cross-check | Fixed (2026-08): whitelist + caps + type cross-check |
| SEC-007 | Medium | `users.store` trusts client-supplied `email` | Derive email from Clerk identity claims | Fixed (2026-08): email from identity, handle uniqueness |
| SEC-008 | Medium | `updateProfile` accepts arbitrary `avatar` URL | http(s) URL + length validation | Fixed (2026-08): URL scheme/length validated, percents clamped |
| SEC-009 | Medium | `submitReport` reasons array unbounded | Cap count + per-item length | Fixed (2026-08): 10 reasons × 100 chars, other strings capped |
| SEC-010 | Medium | No rate-limiting infrastructure anywhere | Generic `rateLimits` table + lib | Fixed (2026-08): `convex/lib/rate-limit.ts` sliding-window limiter |
| SEC-011 | Low | `chat.sendMessage` only length-checks the last history message | Cap all history entries | Fixed (2026-08): all history entries validated |
| SEC-012 | Info | CSP allows `'unsafe-eval' 'unsafe-inline'` in script-src | Documented, not changed (Next.js requirement risk) | Deferred |
| SEC-013 | Info | `getModerators` / `checkModeratorStatus` expose role info | Accepted (low sensitivity) | Deferred |

## Execution sections

### Section A — Security core
- `convex/lib/rate-limit.ts`: sliding-window counter over a new `rateLimits` table (`key`, `windowStart`, `count`).
- `convex/lib/ai-security.ts`: `requireAiUser(ctx)` + `enforceAiQuota(ctx, service)` with per-service limits.
- `schema.ts`: add `rateLimits` table + index on `key`.

### Section B — AI gate
Gate all 6 AI actions. Add `asr.transcribeAudioInternal` (internalAction) so the
Changa worker keeps running without identity/quota. `translate`/`chat` keep
string-error degradation so the UI degrades gracefully.

### Section C — SMS route
- Remove `GET` (config disclosure).
- Form (webhook) requests: verify `X-Twilio-Signature` (HMAC-SHA1 over URL + params, `TWILIO_AUTH_TOKEN`). No token configured → reject.
- New `convex/sms.ts` `processSmsSearch` action: gated by `SMS_WEBHOOK_SECRET`, per-number rate limit (5/hour), length caps, then reuses the shared search core.

### Section D — Guest creation
`storeGuestUser`: global rate limit, length + charset validation on name/handle.

### Section E — Uploads
- `generateUploadUrl`: per-user 30/hour, guests rejected.
- `attachSubmissionAsset`: verify real storage metadata; override client claims; mime whitelist (`audio/webm|wav|mpeg|mp4|ogg|aac|flac|opus`); 25 MB max.

### Section F — Changa draft hardening
Whitelist fields in `createDraftSubmission`, cap lengths, cross-check
`submissionType` against the task, never trust client `autoChecks`/`qualityFlags`.

### Section G — Users
`store`: email from identity; handle regex `^[a-zA-Z0-9_]{3,30}$`.
`updateProfile`: avatar must be `http(s)://` ≤ 2048 chars; clamp language percent 0–100.

### Section H — Reports
Cap `reasons` (≤ 10, each ≤ 100 chars), `contextTitle` ≤ 200.

### Section I — Client token plumbing
`geminiService.ts` passes `Authorization: Bearer <clerk-jwt>` to `/api/action`;
call sites (`HomeSearchScreen`, `SettingsHelpScreen`) fetch the token via
`useAuth().getToken()`.

### Section J — Tests
Add Vitest + unit tests for the pure security helpers (rate-limit window math,
ai quota config, SMS signature, handle validation). `npm run lint` + `tsc`.

### Section K — Docs/config
`.env.local.example` gains `SMS_WEBHOOK_SECRET`; `SECURITY_FIXES.md` updated.

## Verification commands

```bash
npx tsc --noEmit
npm run lint
npm test
```

## Round 2 register (2026-08)

Second audit pass after Section A-K landed. All findings fixed.

| ID | Severity | Finding | Fix | Status |
|---|---|---|---|---|
| SEC-014 | High | `attachSubmissionAsset` spread client signals (`snrScore`, `asrText`, waveform, ...) into the DB; `processing.ts` trusted client `snrScore >= 10` for auto-approve | Store only storage-verified fields; signals accepted but never persisted | Fixed (2026-08): `convex/changa/submissions.ts` |
| SEC-015 | High | Failed/empty ASR still routed to peer review (`audio_analysis_pending` not in `HARD_QUALITY_FLAGS`) | Flag is hard; worker clears it only on ASR success, finalizes on failure | Fixed (2026-08): `convex/changa/processing.ts`, `worker.ts` |
| SEC-016 | High | `submitValidationVote` / `getValidationBundle` no status gate; unbounded comment/issueCodes | Require `in_validation`; clamp confidence 0-100, comment 1000, codes 10x100 | Fixed (2026-08): `convex/changa/validation.ts` |
| SEC-017 | Medium | `escalateSubmission` unbounded `changaDecisions` rows | Idempotent per open assignment + 10/hr rate limit | Fixed (2026-08): `convex/changa/validation.ts` |
| SEC-018 | Medium | `createDefaultConsent` granted training/research by default | Defaults all-false; explicit opt-in required | Fixed (2026-08): `convex/changa/submissions.ts` |
| SEC-019 | Medium | `createDraftSubmission` no language cross-check, unlimited drafts per task | Language must match task; max 3 open per (user, task) | Fixed (2026-08): `convex/changa/submissions.ts` |
| SEC-020 | Medium | `claimTask` no concurrent cap | Max 10 active claims per user (`by_user_status` index) | Fixed (2026-08): `convex/changa/tasks.ts` |
| SEC-021 | Medium | `contributions.submit` unbounded strings/examples | All fields capped (200/300/5000/100, 10x500 examples) | Fixed (2026-08): `convex/contributions/mutations.ts` |
| SEC-022 | Medium | `posts.create` image / `communities.create` avatar/coverImage unvalidated | `isValidAvatarUrl` (http(s), <=2048) | Fixed (2026-08): `convex/posts/mutations.ts`, `convex/communities/mutations.ts` |
| SEC-023 | Medium | SMS webhook blocked by Clerk middleware (`auth.protect()` on `/api/sms/send`) | `/api/sms/*` public in `src/proxy.ts`; route keeps signature+secret gate | Fixed (2026-08): `src/proxy.ts` |
| SEC-024 | Low | `getProfile` exposed `lastSeen`/`isOnline`; presence queries unauthenticated | Strip both from public profiles; presence requires signed-in user | Fixed (2026-08): `convex/users/queries.ts`, `convex/presence/queries.ts` |
| SEC-025 | Low | `dms.send` / `users.follow`/`unfollow` unthrottled | 60/hr per user via `checkRateLimit` | Fixed (2026-08): `convex/dms/mutations.ts`, `convex/users/mutations.ts` |
| SEC-026 | High | Dependencies: @clerk/nextjs 6.36.4 (2 critical), next 16.1.0 (high DoS/SSRF/CSRF advisories), sharp 0.34.x (libvips CVEs) | `npm audit fix`; `next` pinned 16.3.1 (patched + sharp 0.35.x); audit now 0 vulns | Fixed (2026-08): `package.json` |

Round 2 verification: `npx tsc --noEmit` clean, `npm test` 22/22, lint clean
for touched files, `npm run build` succeeds on next 16.3.1.

## Deferred (documented, out of scope for this pass)

- CSP tightening (`unsafe-eval`/`unsafe-inline`) — needs Next.js bundle testing.
- Clerk session hardening (session lifetime, MFA) — platform config, not code.
- GitHub branch protection / CodeQL / Dependabot — repo settings.
- Convex deployment-level rate limiting / function-level cost limits — dashboard config.
- Keys rotation — operator action if any key was ever exposed.