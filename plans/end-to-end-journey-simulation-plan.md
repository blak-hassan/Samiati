# End-to-End User Journey Simulation — Full Plan
**Project**: Samiati  
**Worktree**: `cut-sparrow`  
**Date**: 2026-08-30  
**Status**: Planning complete — ready for execution or continuation in a new session  

---

## 1. Context & Scope

This document captures the complete implementation plan for an end-to-end user journey simulation across the Samiati web application. The simulation is divided into four modules:

1. **User Authentication & Onboarding**
2. **Core Feature Testing (Samiati AI)**
3. **Linguistic & Cultural Simulation (Changa)**
4. **System Settings & Profile Management**

Each module includes a detailed walkthrough of simulated user actions, expected system responses, and a catalog of discovered loose ends, edge cases, and logical gaps.

---

## 2. Architecture Snapshot

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 16.3.1 (App Router), React 19, Tailwind CSS v4 | Client components use `"use client"` |
| Backend | Convex (real-time DB + mutations/queries + storage) | Schema at `convex/schema.ts` |
| Auth | Clerk (`@clerk/nextjs`) | Demo mode supported via `isDemoMode` |
| AI | Sunflower-Gemma4-E2B via HuggingFace Inference API | Used for chat, translate, and search |
| Testing | Vitest | 4 existing tests: `ai-quota`, `rate-limit`, `smsSignature`, `validation` |
| Payments | Paystack | Subscription tiers: free, learner, fluent, organization |

### Key Convex Tables
- `users` — profiles, roles, privacy flags
- `posts`, `likes`, `comments`, `reposts`, `bookmarks`, `validations` — social feed
- `conversations`, `messages` — chat (note: chat is currently localStorage-only on the client)
- `changaTaskTemplates`, `changaCampaigns`, `changaCampaignProposals`, `changaTasks`, `changaTaskClaims`, `changaSubmissions`, `changaSubmissionAssets`, `changaProcessingRuns`, `changaValidationAssignments`, `changaValidationVotes`, `changaDecisions`, `changaCuratedExamples`, `changaUserStats`, `changaRoleGrants`, `changaConsentRecords`, `changaConsentPolicies`, `changaDatasetReleases`, `changaReleaseMembers`, `changaEvaluationSets`, `changaEvaluationItems`, `changaInvites` — full Changa data engine
- `reports`, `moderationActions` — moderation
- `followers`, `communities`, `communityMembers`, `dmConversations`, `dmMessages` — social
- `challenges`, `challengeEntries` — gamification
- `notifications` — in-app notifications
- `subscriptions`, `billingEvents` — billing
- `discoverRawItems`, `discoverItems`, `discoverClusters`, `discoverEngagement`, `discoverUserInterests`, `discoverSourceReputation` — Discover feed
- `feedback` — AI response feedback
- `rateLimits` — generic sliding-window rate limits
- `usageTracking` — monthly AI usage counters

### Key Routes
- `/sign-in`, `/sign-up` — Clerk-hosted auth (or demo-mode fallback)
- `/forgot-password` — custom mock form
- `/dashboard` — main authenticated shell (`HomeSearchScreen`)
- `/dashboard/changa-activity` — Changa activity
- `/dashboard/settings/account`, `/notifications`, `/privacy`, `/languages`, `/data`, `/blocked`, `/muted`, `/help`, `/billing` — settings
- `/dashboard/moderation-dashboard`, `/moderation-log`, `/moderation-application` — moderation

---

## 3. Module 1: User Authentication & Onboarding

### 3.1 Detailed Walkthrough

| Step | Action | Expected System Response | Key Code |
|------|--------|--------------------------|----------|
| 1.1 | Navigate to `/sign-up` | Clerk sign-up form renders. If `isDemoMode` (missing Clerk env), fallback banner: "Sign up unavailable — Authentication is not configured for this deployment." | `src/app/sign-up/[[...sign-up]]/page.tsx:8-25` |
| 1.2 | Submit sign-up with valid credentials | Clerk creates identity; redirects to `/dashboard`. Convex `store` mutation (`users/mutations.ts:193-251`) creates `users` record with `clerkId`, `role: 'member'`, `isGuest: false`, `joinedAt: Date.now()`. Handle auto-generated from Clerk username; if taken, random suffix appended. | `convex/users/mutations.ts:193-251` |
| 1.3 | Submit sign-up with duplicate handle | `store` queries `by_handle` index; if exists, sets `finalHandle = handle.slice(0,24) + '_' + randomSuffix`. Inserts user with unique handle. | `convex/users/mutations.ts:228-234` |
| 1.4 | Sign out and navigate to `/sign-in` | Clerk sign-in form renders; redirects to `/dashboard` on success. | `src/app/sign-in/[[...sign-in]]/page.tsx` |
| 1.5 | Navigate to `/forgot-password` | Custom form renders. On submit, simulates 1.5s delay then shows "Check your email" state with the submitted email displayed. No real API call. | `src/app/forgot-password/page.tsx:29-39` |
| 1.6 | Attempt to access `/dashboard` without auth | `AuthGuard` (`components/auth/AuthGuard.tsx`) wraps dashboard. In demo mode, renders children directly. In production, waits for Clerk `isLoaded`, then renders `AuthProvider`. | `src/components/auth/AuthGuard.tsx:14-35` |
| 1.7 | Create guest user via `storeGuestUser` | Public mutation (no auth required). Creates user with `role: 'guest'`, `isGuest: true`, `clerkId: 'guest_<timestamp>_<random>'`. Rate-limited: max 200/hr, 1000/day globally via `checkRateLimit`. Handle uniqueness enforced. | `convex/users/mutations.ts:256-328` |
| 1.8 | Guest attempts AI feature (chat/translate) | `requireAiUser` in `aiSecurity.ts` throws `"Guests cannot use AI features. Please sign in."` | `convex/lib/aiSecurity.ts:14-21` |
| 1.9 | Guest attempts to create post | `posts/mutations.ts:create` checks `isGuestUser` and throws `"Guests cannot create posts. Please sign up to contribute."` | `convex/posts/mutations.ts:27-33` |
| 1.10 | Guest attempts to update profile | `users/mutations.ts:updateProfile` checks `isGuestUser` and throws `"Guest users cannot update their profile"` | `convex/users/mutations.ts:40-46` |

### 3.2 Edge Cases & Loose Ends

| ID | Description | Severity | Location |
|----|-------------|----------|----------|
| AUTH-01 | **Guest session persistence**: Guest users are created in Convex but there is no visible guest profile management UI. Guests can only see `GuestBanner` + `HomeSearchScreen`. | Medium | `src/app/dashboard/page.tsx:96-103` |
| AUTH-02 | **Handle collision race condition**: `store` mutation queries for existing handle, then inserts user. Two concurrent sign-ups with the same handle could both insert before either patches, violating uniqueness. | High | `convex/users/mutations.ts:214-234` |
| AUTH-03 | **Clerk ↔ Convex sync gap**: `UserSync.tsx` runs client-side to sync Clerk user to Convex. If it fails silently, the user has a Clerk identity but no Convex record, blocking all data operations. | High | `src/app/UserSync.tsx` |
| AUTH-04 | **No email verification enforcement**: Sign-up flow does not enforce email verification before allowing dashboard access. Users with unverified emails can fully interact. | Medium | Clerk configuration |
| AUTH-05 | **Password reset is mock-only**: `forgot-password` page simulates 1.5s delay and shows success; does not actually call any API. In production Clerk handles this, but in demo mode it is entirely fake. | Low | `src/app/forgot-password/page.tsx:29-39` |
| AUTH-06 | **No onboarding wizard**: After sign-up, users land directly on `/dashboard` with an empty profile — no guided onboarding for language selection, interests, or Changa consent. | Medium | Missing entirely |

---

## 4. Module 2: Core Feature Testing (Samiati)

### 4.1 AI Chat (Samiati)

| Step | Action | Expected System Response | Key Code |
|------|--------|--------------------------|----------|
| 2a.1 | Navigate to `/dashboard` (authenticated) | `HomeSearchScreen` renders with active chat area. `localConversationService` loads conversations from `localStorage`. | `src/app/dashboard/page.tsx:36-39` |
| 2a.2 | Send message "Habari yako?" with targetLanguage "Swahili" | `convex/chat.ts:sendMessage` action called. System prompt instructs Samiati to reply in Swahili only. HuggingFace API returns Swahili response. | `convex/chat.ts:17-84` |
| 2a.3 | Send message exceeding 5000 chars | Returns `"ERROR: Message too long. Please keep messages under 5,000 characters."` | `convex/chat.ts:37-40` |
| 2a.4 | Send 21st message in same hour on free tier | `enforceAiQuotaAction` throws hourly quota error. Free tier: 5/hr, 10/day. | `convex/lib/aiQuota.ts:12-17`, `convex/lib/aiSecurity.ts:38-57` |
| 2a.5 | Click thumbs-up on AI response | `feedback.ts:submit` creates record with `type: 'up'`, `contextType: 'chat'`. Second click toggles off (deletes record). | `convex/feedback.ts:6-69` |
| 2a.6 | Click thumbs-down + enter correction | Creates feedback record with `type: 'down'`, `correction` field populated. | `convex/feedback.ts:6-69` |
| 2a.7 | Start new chat | `handleNewChat` clears active conversation ID from `localStorage`. URL becomes `/dashboard` (no `?chatId`). | `src/app/dashboard/page.tsx:81-85` |

### 4.2 Translation Workflow

| Step | Action | Expected System Response | Key Code |
|------|--------|--------------------------|----------|
| 2b.1 | Trigger translation of English text to Swahili | `convex/translate.ts:translateText` calls `callSunflower` with prompt `"Translate from English to Swahili: <text>"` | `convex/translate.ts:88-165` |
| 2b.2 | Translation succeeds | Returns translated text string from HuggingFace API. | `convex/translate.ts:151-155` |
| 2b.3 | Translation API returns 403 | Returns `"ERROR: Translation API access forbidden. This may be due to: (1) Invalid API key, (2) Model requires accepting terms..., or (3) API quota exceeded."` | `convex/translate.ts:133-136` |
| 2b.4 | Translation API returns 503 | Returns `"Translation Model is loading, please try again in a moment."` | `convex/translate.ts:143-146` |
| 2b.5 | Text exceeds 5000 chars | Returns `"ERROR: Text too long. Please keep text under 5,000 characters."` | `convex/translate.ts:178-179` |
| 2b.6 | Submit translation feedback | Creates `feedback` record with `contextType: 'translate'`. | `convex/feedback.ts:6-69` |

### 4.3 Comments, Likes, Validations on Posts

| Step | Action | Expected System Response | Key Code |
|------|--------|--------------------------|----------|
| 2c.1 | Like a post | `posts/mutations.ts:like` inserts `likes` record, increments `post.stats.likes`, creates notification for post author (if not self-like). Returns `true`. | `convex/posts/mutations.ts:82-136` |
| 2c.2 | Unlike a post | Deletes `likes` record, decrements `post.stats.likes` (floors at 0). Returns `false`. | `convex/posts/mutations.ts:95-105` |
| 2c.3 | Self-like attempt | Notification not created (`post.authorId !== user._id` check). Like still toggles on. | `convex/posts/mutations.ts:119-131` |
| 2c.4 | Comment on post | `comments/mutations.ts` creates comment with `targetType: 'post'`, `targetId: postId`. | `convex/comments/mutations.ts` |
| 2c.5 | Validate (upvote truth) a post | `validations/mutations.ts` creates validation record; `posts/queries.ts:feed` shows `isValidated: true` for current user. | `convex/posts/queries.ts:44-63` |
| 2c.6 | View post thread | `post-thread` page loads post with author details, comments, and interaction state. | `src/app/dashboard/post-thread/page.tsx` |

### 4.4 Edge Cases & Loose Ends

| ID | Description | Severity | Location |
|----|-------------|----------|----------|
| SAM-01 | **Chat is localStorage-only**: Conversations are stored in browser `localStorage`, not in Convex. If user clears storage or switches devices, all chat history is lost. No server-side conversation persistence. | High | `src/services/localConversationService.ts` |
| SAM-02 | **Two competing AI backends**: `chat.ts` and `sunflower.ts` both implement `sendMessage` with different signatures and constraints. Dashboard page uses `localConversationService` which doesn't call any server action — purely client-side. | Medium | `convex/chat.ts` vs `convex/sunflower.ts` |
| SAM-03 | **Translation has no conversation context**: Translation is a stateless action — it doesn't remember previous translations or conversation history. | Low | `convex/translate.ts` |
| SAM-04 | **Feedback toggle behavior**: If a user clicks thumbs-up twice, the feedback is removed entirely (not updated). Intentional but may confuse users. | Low | `convex/feedback.ts:28-49` |
| SAM-05 | **Like count race condition**: `posts/mutations.ts:like` reads the post, then patches it. Two concurrent likes could both read the same count and write the same incremented value, losing one increment. | High | `convex/posts/mutations.ts:99-103` |
| SAM-06 | **No post editing**: Once created, posts cannot be edited — only deleted by author/admin/moderator. | Low | `convex/posts/mutations.ts:138-156` |
| SAM-07 | **AI quota tier hardcoded**: `aiSecurity.ts` always uses `tier: "free"` regardless of actual subscription. Paid tiers defined in `aiQuota.ts` but never passed from the action handler. | High | `convex/lib/aiSecurity.ts:46` |
| SAM-08 | **AI quota check uses wrong tier variable**: `enforceAiQuotaAction` always passes `tier: "free"` to the internal mutation, ignoring the user's actual plan. | High | `convex/lib/aiSecurity.ts:43-52` |

---

## 5. Module 3: Linguistic & Cultural Simulation (Changa)

### 5.1 Changa Task Lifecycle

| Step | Action | Expected System Response | Key Code |
|------|--------|--------------------------|----------|
| 3a.1 | Navigate to Changa home (`/dashboard/changa-activity`) | `MyChangaActivity` component loads user's Changa stats. | `src/app/dashboard/changa-activity/page.tsx` |
| 3a.2 | Browse available tasks | `listAvailableTasks` query returns open tasks sorted by priority (critical > high > normal > low), then by newest first. Max 25 returned. | `convex/changa/tasks.ts:82-118` |
| 3a.3 | Claim a task | `claimTask` mutation creates `changaTaskClaims` record with `status: 'active'`, expires in 20 minutes. Enforces max 10 concurrent claims per user. Expires other active claims for same user+task. | `convex/changa/tasks.ts:151-207` |
| 3a.4 | Start working on claimed task | `startClaimedSubmission` creates draft `changaSubmissions` record. Requires `isGranted: true` and `allowTraining: true` consent. Validates consent policy version matches. | `convex/changa/submissions.ts:267-347` |
| 3a.5 | Submit translation for sentence_translation task | `submitSubmission` validates text is non-empty via `ensureRequiredTaskAnswer`. Enforces velocity limits (50/hr, 300/day). Enqueues processing runs. | `convex/changa/submissions.ts:356-446` |
| 3a.6 | Submit audio for audio_reading task | Requires audio asset attached via `attachSubmissionAsset`. Validates MIME type against whitelist (webm, wav, mpeg, mp4, ogg, aac, flac, opus, m4a). Max 25MB. Min >0 bytes. | `convex/changa/submissions.ts:493-561` |
| 3a.7 | Submission processing completes | Worker (`changa/worker.ts`) processes ASR, language ID, moderation checks. If no hard flags remain and all queued runs complete, status transitions to `in_validation`. | `convex/changa/worker.ts:41-307` |
| 3a.8 | Peer validation | `submitValidationVote` records vote. 2 accepts → `validated`; 2 rejects → `rejected`; 2 minor_fixes → `needs_fix`; disagreement (accept+reject) → moderator assignment + stays `in_validation`. | `convex/changa/validation.ts:175-358` |
| 3a.9 | View submission status | `listUserSubmissions` shows all submissions with status, filtered by optional status. Non-moderators can only see their own. | `convex/changa/submissions.ts:68-94` |

### 5.2 Changa Campaign Lifecycle

| Step | Action | Expected System Response | Key Code |
|------|--------|--------------------------|----------|
| 3b.1 | Moderator creates campaign | `createCampaign` inserts `changaCampaigns` record. Only moderators/admins can create. Default status: `draft`. | `convex/changa/campaigns.ts:23-57` |
| 3b.2 | Contributor proposes campaign | `submitCampaignProposal` creates proposal with `status: 'pending'`. Any authenticated user can propose. | `convex/changa/campaigns.ts:62-86` |
| 3b.3 | Moderator reviews proposal | `reviewCampaignProposal` sets status to approved/adapted/rejected. If approved, creates live campaign from proposal with `status: 'active'`. | `convex/changa/campaigns.ts:118-164` |
| 3b.4 | View campaign leaderboard | `getCampaignLeaderboard` aggregates submissions per user across all tasks in campaign. Sorted by submission count descending. | `convex/changa/campaigns.ts:167-199` |
| 3b.5 | Sheng seed data | `seedShengData` internal mutation creates 110 translation tasks + 50 audio tasks, 3 templates, and a campaign for "Collect 500 Sheng Sentences". Requires CLI run: `npx convex run changa.seedSheng:seedShengData`. | `convex/changa/seedSheng.ts:114-393` |

### 5.3 Changa Validation & Moderation

| Step | Action | Expected System Response | Key Code |
|------|--------|--------------------------|----------|
| 3c.1 | Reviewer views validation queue | `listValidationQueue` shows `in_validation` submissions, excluding own work and already-voted items. Moderators also see assigned escalation items. | `convex/changa/validation.ts:38-115` |
| 3c.2 | Peer reviewer votes | Peer reviewers see no existing votes (blind review). Moderators see all votes. | `convex/changa/validation.ts:118-151` |
| 3c.3 | Disagreement detected | `submitValidationVote` creates `changaValidationAssignments` with `roleRequired: 'moderator'`. | `convex/changa/validation.ts:263-278` |
| 3c.4 | Moderator resolves assignment | Closes assignment, writes immutable `changaDecisions` record with decision and evidence version. | `convex/changa/validation.ts:292-307`, `changa/validation.ts:318-334` |
| 3c.5 | Gold task calibration | `seedGoldTask` creates hidden calibration items. Reviewer votes compared against expected verdict stored in `changaCuratedExamples.reviewSummary`. | `convex/changa/validation.ts:420-483` |

### 5.4 Kenyan Sheng Linguistic Simulation

| Step | Action | Expected System Response | Key Code |
|------|--------|--------------------------|----------|
| 3d.1 | Run `seedShengData` | Creates 110 sentence translation tasks + 50 audio tasks with English source sentences covering: everyday conversation (30%), questions/commands (20%), emotional/social (15%), work/education (10%), technology/finance (10%), cultural idioms (10%), numbers/dates/places (5%). | `convex/changa/seedSheng.ts:8-393` |
| 3d.2 | Contributor translates Sheng sentence | Creates `changaSubmissions` with `languageCode: 'sheng'`, `submissionType: 'sentence_translation'`. | `convex/changa/submissions.ts:242-264` |
| 3d.3 | Validation of naturalness | Validation template asks for 1-5 naturalness rating and language type classification (Sheng/Swahili/English/Mixed). | `convex/changa/seedSheng.ts:181-203` |
| 3d.4 | Domain categorization | `getDomain()` classifies sentences into 7 domains for targeted collection. | `convex/changa/seedSheng.ts:276-355` |

### 5.5 Edge Cases & Loose Ends

| ID | Description | Severity | Location |
|----|-------------|----------|----------|
| CHANGA-01 | **Consent is mandatory but not contextually explained**: Consent form requires `allowTraining` and `allowResearch` but provides no inline explanation of what these mean in practice. | Medium | `convex/changa/submissions.ts:15-25` |
| CHANGA-02 | **Changa campaigns page route missing**: `useNavigation.ts` references `Screen.CHANGA_CAMPAIGNS` mapped to `/dashboard/changa-campaigns` but this route/page does not exist. | High | `src/hooks/useNavigation.ts:100` |
| CHANGA-03 | **No Changa campaign discovery UI**: `listActiveCampaigns` exists in Convex but there is no visible UI to browse campaigns by language or filter by task type. | Medium | `convex/changa/campaigns.ts:7-20` |
| CHANGA-04 | **Audio upload is fragile**: `attachSubmissionAsset` requires pre-uploaded audio via Convex storage, but there is no visible upload UI component wired to this mutation in the changa input components. | High | `convex/changa/submissions.ts:493-561`, `src/components/changa/inputs/` |
| CHANGA-05 | **Sheng seed is internal-only**: `seedShengData` is an `internalMutation` requiring a Convex CLI run — it cannot be triggered from the app UI. | Low | `convex/changa/seedSheng.ts:114` |
| CHANGA-06 | **Validation queue pulls all languages**: `listValidationQueue` has optional `languageCode` filter but when not provided, loads all `in_validation` submissions across all languages, which could be expensive at scale. | Medium | `convex/changa/validation.ts:51-57` |
| CHANGA-07 | **No campaign progress auto-update**: `changaCampaigns.currentCount` is set to 0 on creation and never automatically incremented when submissions are validated. | Medium | `convex/changa/campaigns.ts:49` |
| CHANGA-08 | **Changa XP/reward profile not integrated with social XP**: The `changaRewardProfileValidator` defines XP rewards but there is no visible integration with the user's main XP/leveling system. | Low | `convex/changa/validators.ts:80-86` |
| CHANGA-09 | **Worker processing is cron-dependent**: The `processQueuedRuns` worker action must be triggered by a cron schedule. If the cron fails, submissions remain stuck in `submitted` status indefinitely. | High | `convex/changa/worker.ts:41-128` |
| CHANGA-10 | **No offline queue for Changa**: Unlike chat which uses localStorage, Changa submissions require real-time Convex mutations. Network loss causes hard failures. | Medium | `convex/changa/submissions.ts` |
| CHANGA-11 | **Submission language mismatch not enforced for all fields**: `createDraftSubmission` cross-checks `submissionType` and `languageCode` against the task, but does not validate `dialectCode` or `regionCode` consistency. | Low | `convex/changa/submissions.ts:208-216` |
| CHANGA-12 | **Duplicate detection is placeholder**: `calculateTextSimilarity` in processing is a basic implementation. No real duplicate detection against existing curated examples. | Medium | `convex/changa/processing.ts` |

---

## 6. Module 4: System Settings & Profile Management

### 6.1 Detailed Walkthrough

| Step | Action | Expected System Response | Key Code |
|------|--------|--------------------------|----------|
| 4.1 | Navigate to `/dashboard/settings/account` | `SettingsAccountScreen` renders with user's Clerk-derived data. | `src/app/dashboard/settings/account/page.tsx` |
| 4.2 | Edit profile (name, bio, avatar, location, languages) | `users/mutations.ts:updateProfile` patches user record. Validates lengths: name ≤100, bio ≤500, location ≤200, ≤20 languages. | `convex/users/mutations.ts:24-93` |
| 4.3 | Set avatar to invalid URL | Throws `"Avatar must be a valid http(s) image URL"`. `isValidAvatarUrl` validates against XSS vectors (no `data:`, `javascript:`, `file:`). | `convex/users/mutations.ts:65-69` |
| 4.4 | Set avatar exceeding 2048 chars | Truncated to 2048 chars. | `convex/users/mutations.ts:209` |
| 4.5 | Update privacy settings | `updatePrivacy` patches `profileVisible`, `showChanga`, `voiceDataAllowed`, `culturalDataAllowed`. | `convex/users/mutations.ts:334-354` |
| 4.6 | Navigate to settings/languages | `MANAGE_LANGUAGES` screen renders. | `src/hooks/useNavigation.ts:53` |
| 4.7 | Change password | `/dashboard/change-password` renders custom form; actual change handled by Clerk. | `src/app/dashboard/change-password/page.tsx` |
| 4.8 | Navigate to settings/notifications | `SETTINGS_NOTIFICATIONS` screen renders. No dedicated backend query found for notification preferences. | `src/hooks/useNavigation.ts:51` |
| 4.9 | Navigate to settings/privacy | `SETTINGS_PRIVACY` screen renders. Maps to `updatePrivacy` mutation. | `src/hooks/useNavigation.ts:52` |
| 4.10 | Navigate to settings/data | `SETTINGS_DATA` screen renders. No dedicated backend handler found. | `src/hooks/useNavigation.ts:57` |
| 4.11 | Navigate to settings/blocked | `SETTINGS_BLOCKED` screen renders. No dedicated backend handler found. | `src/hooks/useNavigation.ts:55` |
| 4.12 | Navigate to settings/muted | `SETTINGS_MUTED` screen renders. No dedicated backend handler found. | `src/hooks/useNavigation.ts:56` |
| 4.13 | Navigate to billing | `/dashboard/settings/billing` renders `SubscriptionManager` component. Uses Paystack integration. | `src/app/dashboard/settings/billing/page.tsx` |

### 6.2 Edge Cases & Loose Ends

| ID | Description | Severity | Location |
|----|-------------|----------|----------|
| SET-01 | **Settings screens without backend logic**: `settings/data`, `settings/blocked`, `settings/muted`, and `settings/help` pages exist as routes but have no corresponding Convex mutations/queries — they render empty or placeholder UI. | Medium | `src/app/dashboard/settings/data/page.tsx`, `blocked/page.tsx`, `muted/page.tsx`, `help/page.tsx` |
| SET-02 | **Notification preferences are UI-only**: `SETTINGS_NOTIFICATIONS` screen exists but there is no `notificationPreferences` table or mutation — toggles have no persistent effect. | Medium | `src/app/dashboard/settings/notifications/page.tsx` |
| SET-03 | **Profile visibility not enforced in queries**: `users` table has `profileVisible` field but no query filters profiles by this flag — private profiles are still returned by public queries. | High | `convex/schema.ts:69` |
| SET-04 | **No language deletion flow**: Languages can be added via `updateProfile` but there is no dedicated remove/delete language UI or mutation. | Low | `convex/users/mutations.ts:79-89` |
| SET-05 | **Password change is Clerk-only**: The change-password page is a custom UI that ultimately delegates to Clerk. If Clerk is in demo mode, this flow does nothing. | Low | `src/app/dashboard/change-password/page.tsx` |
| SET-06 | **No account deletion/deactivation**: No UI or mutation exists for users to delete their account or export their data (GDPR requirement gap). | High | Missing entirely |
| SET-07 | **Cultural background field exists in schema but no UI**: `users.culturalBackground` is in the schema but no settings screen edits it. | Low | `convex/schema.ts:37` |
| SET-08 | **No notification persistence for read/unread state synchronization**: The `notifications` table exists but there is no visible mutation to mark notifications as read in bulk or filter by type. | Low | `convex/notifications/` |

---

## 7. Feasibility Assessment

### 7.1 What CAN Be Simulated With Available Tools

- Code-level walkthroughs and static analysis (completed)
- Route coverage verification (every `Screen` enum value vs actual page files)
- Mutation/query signature verification
- Authorization boundary checks (guest vs member vs moderator vs admin)
- Rate limit and quota boundary analysis
- Data flow consistency checks (localStorage vs Convex)
- Existing test execution via `vitest`

### 7.2 What CANNOT Be Fully Simulated Without a Running Environment

- Live AI API calls (require `HUGGINGFACE_API_KEY` in Convex Dashboard)
- Clerk authentication flows (require Clerk env vars)
- Convex real-time reactivity
- Browser `localStorage` behavior across sessions
- Audio recording/upload pipeline (requires device permissions)
- Payment flow with Paystack (requires test keys)

### 7.3 Recommended Simulation Approach

1. **Static route coverage analysis**: Verify every `Screen` enum value in `types.ts` has a corresponding route/page and that navigation paths resolve correctly.
2. **Mutation/query coverage audit**: For each user action, trace the exact Convex mutation/query called and verify argument validation, authorization checks, and error handling.
3. **Data flow consistency check**: Verify that UI state (localStorage, React state) matches Convex database state.
4. **Authz boundary testing**: For each mutation, verify guest/mod/admin access controls.
5. **Quota/rate limit boundary testing**: Verify AI quota enforcement, guest creation limits, follow rate limits, submission velocity limits, and escalation rate limits.
6. **Edge case injection**: For each mutation, test boundary values (max lengths, empty strings, special characters, concurrent operations).

---

## 8. Prioritized Gaps Summary

| Priority | Gap | Location | Impact |
|----------|-----|----------|--------|
| P0 | **Chat history is localStorage-only** — lost on device switch/clear | `src/services/localConversationService.ts` | Data loss for all chat users |
| P0 | **AI quota tier hardcoded to "free"** — paid plans get no benefit | `convex/lib/aiSecurity.ts:46` | Revenue/business model broken |
| P0 | **Changa campaigns route missing** (`/dashboard/changa-campaigns`) | `src/hooks/useNavigation.ts:100` | Broken navigation |
| P1 | **Handle collision race condition in user creation** | `convex/users/mutations.ts:214-234` | Duplicate handles possible |
| P1 | **Like count race condition (read-then-patch)** | `convex/posts/mutations.ts:99-103` | Lost like counts under concurrency |
| P1 | **Settings screens without backend** (data, blocked, muted, help) | `src/app/dashboard/settings/*` | Dead-end UI |
| P1 | **Profile visibility not enforced in queries** | `convex/schema.ts:69` + queries | Privacy violation |
| P1 | **No account deletion/GDPR export flow** | Missing entirely | Compliance gap |
| P2 | **Two competing AI backends** (chat.ts vs sunflower.ts) | `convex/chat.ts` vs `convex/sunflower.ts` | Maintenance burden |
| P2 | **No onboarding wizard after sign-up** | Missing entirely | Poor first-time UX |
| P2 | **Consent form lacks contextual explanation** | Changa submission flow | Legal/UX risk |
| P3 | **Notification preferences UI-only, no persistence** | `settings/notifications` | User expectation mismatch |
| P3 | **Cultural background field in schema but no editing UI** | `convex/schema.ts:37` | Dead schema field |

---

## 9. Reporting Framework

For each gap discovered during simulation execution, report:

```
- **Location**: File path + line number
- **Category**: Auth gap | Data loss | Race condition | Missing route | Logic error | UX gap | Security issue
- **Severity**: Critical (data loss/auth bypass) | High (broken flow) | Medium (edge case) | Low (polish)
- **Impact**: Which user journeys are affected
- **Suggested fix**: Concrete remediation
```

---

## 10. Next Steps / Continuation Plan

To continue this work in a new session, provide:

1. **This document** — full context of the architecture, modules, and identified gaps.
2. **The current git state** — run `git status` and `git log --oneline -10` in the worktree to capture current branch and uncommitted changes.
3. **The simulation execution order** — which module to execute first, or whether to prioritize fixing P0 gaps before simulation.
4. **Environment availability** — whether `HUGGINGFACE_API_KEY` and Clerk env vars are available for live testing, or if the simulation should remain static.

### Suggested Execution Order

1. Fix P0 gaps (chat persistence, AI quota tier, missing Changa route)
2. Execute Module 1 simulation (auth) — verify all authz boundaries
3. Execute Module 2 simulation (Samiati AI) — verify chat, translate, feedback flows
4. Execute Module 3 simulation (Changa) — verify task lifecycle, validation, campaign flows
5. Execute Module 4 simulation (settings) — verify all settings screens have working backend
6. Compile final gap report with prioritized fix recommendations

---

*End of document.*
