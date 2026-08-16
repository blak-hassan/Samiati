# Security Improvements Implemented

## Fixed Errors

### Issue: "Called storeUser without authentication present"

**Root Cause:** The application was trying to call the Convex `storeUser` mutation for unauthenticated (guest) users, but Convex with Clerk integration requires authentication for all mutations when using `ConvexProviderWithClerk`.

**Fixes Applied:**

1. **[`src/app/ConvexClientProvider.tsx`](src/app/ConvexClientProvider.tsx)**
   - Restructured to use different Convex providers based on auth status
   - Authenticated users: Uses `ConvexProviderWithClerk` (full features)
   - Guests (unauthenticated): Uses plain `ConvexProvider` (limited features)
   - Only syncs users to database when Clerk authentication is present

2. **[`src/components/auth/AuthGuard.tsx`](src/components/auth/AuthGuard.tsx)**
   - Updated to allow access without immediate authentication redirect
   - Permission checking is done server-side in Convex mutations

3. **[`src/hooks/useCurrentUser.ts`](src/hooks/useCurrentUser.ts)**
   - Updated to properly check authentication status using both Clerk and database user
   - Added `isGuest` flag for future guest user support

4. **[`src/middleware.ts`](src/middleware.ts)**
   - Added guest route support for `/dashboard` and its subpaths
   - Public routes remain: `/`, `/sign-in`, `/sign-up`, `/forgot-password`

## Previous Security Improvements (Preserved)

1. **Server-Side Route Protection** - Middleware added for authentication
2. **Input Validation** - Added length limits and sanitization to mutations
3. **Guest Permission System** - Guests cannot create posts, follow users, or update profiles (enforced server-side)
4. **Security Headers** - X-Content-Type-Options, X-Frame-Options, etc.

## Guest User Behavior

- Guests can view the dashboard and browse content (using ConvexProvider without Clerk)
- Guests cannot create posts, follow users, or update profiles (enforced server-side in mutations)
- When guests sign up/sign in, they get a full user profile with all features
- The `isGuestUser()` helper in Convex checks `user.isGuest === true` to restrict actions

## How Guest Restrictions Work

1. **Client-side**: Guests can browse and view content
2. **Server-side (Convex)**: Mutations check `isGuestUser(user)` and throw errors for restricted actions:
   - `create` mutation: "Guests cannot create posts. Please sign up to contribute."
   - `updateProfile` mutation: "Guest users cannot update their profile"
   - `follow` mutation: "Guest users cannot follow other users"

## Security Hardening Round (2026-08)

Fixed a set of server-side vulnerabilities identified in an audit. Full
register: [`plans/security-hardening-plan.md`](plans/security-hardening-plan.md).

### Unauthenticated AI actions (Critical)
- **Before:** `translate`, `gemini.search`, `chat`, `tts`, and `asr` actions were
  callable by anyone (including guests) without limits.
- **After:** all AI actions now require an authenticated Clerk identity via
  `requireAuthenticatedAction` and are rate-limited per user
  (`convex/lib/ai-security.ts`, `convex/lib/ai-quota.ts`).
  `chat.sendMessage` also validates every history message, not just the last.
- **New env var:** none.

### Open SMS webhook (Critical)
- **Before:** `POST /api/sms/send` accepted requests from anyone and could
  exhaust the search quota; it also served a `GET` handler.
- **After:** route is `POST`-only, validates the `X-Twilio-Signature` header
  (HMAC-SHA1 per Twilio's spec) plus a shared server secret, caps query/phone
  lengths, and rate-limits per phone number (5/hour, 20/day) through
  `convex/sms.ts` (`src/app/api/sms/send/route.ts`, `src/lib/smsSignature.ts`).
- **New env var:** `SMS_WEBHOOK_SECRET` (server-only, see `.env.local.example`).

### Guest account abuse (High)
- **Before:** `users.storeGuestUser` had no rate limit and accepted unvalidated
  names/handles; `users.store` trusted a client-supplied email.
- **After:** `storeGuestUser` is rate-limited (200/hour, 1000/day) and validates
  name/handle; email now comes from the Clerk identity; `updateProfile` only
  accepts http(s) avatar URLs and clamps language percentages.

### Unrestricted uploads & drafts (High)
- **Before:** `generateUploadUrl` was unlimited; `attachSubmissionAsset` trusted
  client-reported size/mime; `createDraftSubmission` spread client args.
- **After:** upload URLs are rate-limited (30/hour) and guest-restricted;
  `attachSubmissionAsset` verifies real storage metadata (mime whitelist,
  25 MB cap); drafts use an explicit field whitelist with length caps and
  ignore client-supplied `qualityFlags`/`autoChecks`.

### Misc (Medium)
- `convex/reports.ts` caps/dedupes report reasons and strings.
- New generic sliding-window rate limiter: `convex/lib/rate-limit.ts`
  (per-request counters in a `rateLimits` table, lazy cleanup).

### Verification
- `npm test` — 22/22 passing (rate limiter, quotas, validation, Twilio signature).
- `npx tsc --noEmit` — clean.
- `npm run lint` — no new problems in touched files.

### Deployment note
- The `rateLimits` table and new internal functions require regenerated Convex
  client code: run `npx convex dev` (or `npx convex codegen`) once linked to a
  deployment, and add `SMS_WEBHOOK_SECRET` to the server environment.

## Security Hardening Round 2 (2026-08)

Second audit pass: Changa pipeline integrity, validation gating, consent,
social/community input validation, presence privacy, dependency CVEs.
Full register: [`plans/security-hardening-plan.md`](plans/security-hardening-plan.md).

### Changa pipeline trust (High)
- **Before:** `attachSubmissionAsset` stored client-supplied signal metadata
  (`snrScore`, `clippingScore`, `asrText`, `asrConfidence`, `waveformPreview`,
  `durationMs`, ...) verbatim via `...args`; `processing.ts` trusted
  `snrScore >= 10` for the auto-approve path; a failed/empty ASR run did not
  keep the submission in the human lane.
- **After:** the asset insert stores only storage-verified fields (real mime,
  size). Client signals are accepted for display but never persisted.
  `audio_analysis_pending` is now a hard quality flag; the worker clears it
  only when ASR returns text, and calls `finalizeSubmissionRouting` even on
  ASR failure so failed-ASR items stay `submitted` (human lane).

### Validation gating (High)
- **Before:** `submitValidationVote` and `getValidationBundle` accepted any
  submission state; vote comments/issue codes were unbounded.
- **After:** both require `status === "in_validation"`; confidence clamped to
  0-100, comments capped at 1000 chars, issue codes 10 x 100 chars.

### Escalation flood (Medium)
- **Before:** `escalateSubmission` inserted a `changaDecisions` row on every
  call; repeated escalations of the same item created unbounded rows.
- **After:** one open assignment per submission (idempotent early return) and
  10 escalations/hour per user.

### Consent default (Medium)
- **Before:** `createDefaultConsent` granted training/research consent by
  default when a client omitted `consent`.
- **After:** defaults are all-false; consent must be explicit.

### Draft & claim bounds (Medium)
- **Before:** `createDraftSubmission` accepted a `languageCode` mismatched with
  the task and allowed unlimited open drafts; `claimTask` had no concurrent
  claim cap.
- **After:** language is cross-checked against the task; max 3 open
  submissions per (user, task); max 10 concurrent active claims per user.

### Input validation (Medium)
- `contributions.submit`: all fields length-capped (title 200, content 5000,
  examples 10 x 500, ...).
- `posts.create` image and `communities.create` avatar/coverImage must be real
  http(s) URLs (reuses `isValidAvatarUrl`).

### SMS middleware (Medium)
- **Before:** `/api/sms/send` was behind Clerk `auth.protect()`; Twilio could
  never reach the webhook when Clerk was configured.
- **After:** `src/proxy.ts` treats `/api/sms/*` as public; the route keeps its
  own Twilio signature + secret validation.

### Presence privacy (Low)
- **Before:** `getProfile` exposed `lastSeen`/`isOnline` to any visitor;
  presence queries were callable unauthenticated.
- **After:** `lastSeen`/`isOnline` stripped from public profiles;
  `getOnlineStatus`/`getUserPresence` require a signed-in user (guests receive
  closed values).

### Message & follow rate limits (Low)
- `dms.send`: 60/hour per sender. `users.follow`/`unfollow`: 60/hour per user.

### Dependency CVEs
- **Before:** @clerk/nextjs 6.36.4 (2 critical), next 16.1.0 (high, multiple
  advisories), sharp 0.34.x (libvips CVEs).
- **After:** `npm audit fix` cleared clerk; `next` pinned to 16.3.1 (patched,
  pulls sharp 0.35.x + postcss fixes). `npm audit` now reports **0
  vulnerabilities**.

### Verification
- `npm test` — 22/22 passing.
- `npx tsc --noEmit` — clean.
- `npm run lint` — no new problems in touched files (5 pre-existing errors in
  untouched files remain).
- `npm run build` — production build succeeds on next 16.3.1.
