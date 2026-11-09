# Settings & Profile — Detailed Breakdown

> Generated 2026-10-04 from live codebase. Covers all routes, screens, props, state, data sources, and actions for Profile + Settings area.

## 1. Route Map

| URL | Page file | Screen component | Screen enum (`src/types.ts`) |
|---|---|---|---|
| `/dashboard/profile` | `src/app/dashboard/profile/page.tsx` | `src/components/screens/ProfileScreen.tsx` | `Screen.PROFILE` |
| `/dashboard/edit-profile` | `src/app/dashboard/edit-profile/page.tsx` (verify) | `src/components/screens/EditProfileScreen.tsx` | `Screen.EDIT_PROFILE` |
| `/dashboard/settings` | `src/app/dashboard/settings/page.tsx` | `src/components/screens/SettingsScreen.tsx` | `Screen.SETTINGS` |
| `/dashboard/settings/account` | `src/app/dashboard/settings/account/page.tsx` | `src/components/screens/SettingsAccountScreen.tsx` | `Screen.SETTINGS_ACCOUNT` |
| `/dashboard/settings/notifications` | `src/app/dashboard/settings/notifications/page.tsx` | `src/components/screens/SettingsNotificationsScreen.tsx` | `Screen.SETTINGS_NOTIFICATIONS` |
| `/dashboard/settings/privacy` | `src/app/dashboard/settings/privacy/page.tsx` | `src/components/screens/SettingsPrivacyScreen.tsx` | `Screen.SETTINGS_PRIVACY` |
| `/dashboard/settings/blocked` | `src/app/dashboard/settings/blocked/page.tsx` | `src/components/screens/SettingsBlockedScreen.tsx` | `Screen.SETTINGS_BLOCKED` |
| `/dashboard/settings/muted` | `src/app/dashboard/settings/muted/page.tsx` | `src/components/screens/SettingsMutedScreen.tsx` | `Screen.SETTINGS_MUTED` |
| `/dashboard/settings/data` | `src/app/dashboard/settings/data/page.tsx` | `src/components/screens/SettingsDataScreen.tsx` | `Screen.SETTINGS_DATA` |
| `/dashboard/settings/help` | `src/app/dashboard/settings/help/page.tsx` | `src/components/screens/SettingsHelpScreen.tsx` | `Screen.SETTINGS_HELP` |
| `/dashboard/settings/languages` | `src/app/dashboard/settings/languages/page.tsx` | `src/components/screens/ManageLanguagesScreen.tsx` | `Screen.MANAGE_LANGUAGES` |
| `/settings/billing` | `src/app/settings/billing/page.tsx` | `SubscriptionManager` + `PricingCard` inline | — (direct link, no enum) |
| `/dashboard/change-password` | `src/app/dashboard/change-password/*` | Change password screen | `Screen.CHANGE_PASSWORD` |
| `/dashboard/all-achievements` | `src/app/dashboard/all-achievements/*` | All achievements screen | `Screen.ALL_ACHIEVEMENTS` |

Navigation centralised in `src/hooks/useNavigation.ts:30-57`:
`PROFILE → /dashboard/profile`, `EDIT_PROFILE → /dashboard/edit-profile`, `SETTINGS → /dashboard/settings`, `SETTINGS_ACCOUNT → …/account`, `SETTINGS_NOTIFICATIONS → …/notifications`, `SETTINGS_PRIVACY → …/privacy`, `MANAGE_LANGUAGES → …/languages`, `SETTINGS_HELP → …/help`, `SETTINGS_BLOCKED → …/blocked`, `SETTINGS_MUTED → …/muted`, `SETTINGS_DATA → …/data`.

---

## 2. Profile Page — `/dashboard/profile`

### 2.1 Page wrapper (`src/app/dashboard/profile/page.tsx:18-88`)

- `dynamic = 'force-dynamic'`, client component, `ProfileScreen` dynamically imported with `ssr:false`.
- Hooks:
  - `useNavigation()` → `navigate`, `goBack`.
  - `useAppUser()` → `languages: LanguageSkill[]`, `clerkUser`.
  - `useQuery(api.profile.queries.getDashboard, {})` → `dashboard: ProfileDashboard | null | undefined`.
    - `undefined` = loading, `null` = no data. Never blocks render.
  - `localConversationService.getConversations()` (memoised once) → `conversationCount`, `messageCount` from localStorage. Client-only.
- User mapping (`page.tsx:41-69`):
  - If `dashboard.profile` exists: maps `name, handle, avatar, isGuest, bio, culturalBackground, location, xp, level, badges, followerCount, followingCount, languages, role`.
  - Else fallback: `clerkUser.fullName || "Guest"`, `@username || @guest`, `clerkUser.imageUrl`, `xp:0, level:1, badges:[], followers 0/0, languages` from `useAppUser`, `role:'member'`.
- Renders `<ProfileScreen user navigate goBack isOwnProfile languages dashboard loading conversationCount messageCount />`
  - `isOwnProfile = dashboard===undefined ? true : !!profile.isMe`
  - `loading={false}` hardcoded — skeleton in `ProfileScreen` only shows if `loading && dashboard===undefined`, so currently skeleton is effectively disabled. Intended prop is `isLoading`.

### 2.2 ProfileScreen (`src/components/screens/ProfileScreen.tsx`)

Props (`ProfileScreen.tsx:42-53`):
```ts
user: User; navigate: NavigateFn; goBack(): void;
unreadCount?: number; isOwnProfile?: boolean;
languages: LanguageSkill[]; dashboard?: ProfileDashboard|null;
loading?: boolean; conversationCount?: number; messageCount?: number;
```

State:
- `profileVisible` (init `privacy.profileVisible ?? true`), `showContributions` (init `privacy.showChanga ?? true`), `isFollowing:boolean`.
- Mutations: `api.users.mutations.updatePrivacy` — optimistic toggle with revert on `.catch()`: `handleProfileVisibleChange`, `handleShowChangaChange` (`ProfileScreen.tsx:119-132`).

Helpers:
- `STATUS_META` (`:56-65`) — Changa pipeline `draft/submitted/in_validation/validated/curated/needs_fix/rejected/withdrawn` → pill label + Tailwind classes.
- `relativeTime(ts)`, `formatJoined(ts)` (`MMM YYYY`), `qualityLabel(acceptRate)` (≥0.8 Excellent, ≥0.6 Good, ≥0.4 Fair else Needs improvement).
- `getSkillIcon(level)` — 🌱 Beginner, 🌿 Intermediate, 🌳 Fluent, 🌲 Native. Note: `LanguageSkill.level` type is `'Learning'|'Conversational'|'Fluent'|'Native'` (`src/types.ts:205-210`) so Beginner/Intermediate branches never hit — mismatch.
- `contributionCountForLanguage(byLanguage, name)` — tolerant code↔name match.

Layout sections:

1. **Header (sticky, h-16, border-b)** — back button, centered `Profile` title, right side:
   - Own: Edit (pencil `Edit3`) → `Screen.EDIT_PROFILE`.
   - Other: Share (`Share2`) → `navigator.share` fallback `clipboard.writeText`.
   - `NotificationBell(unreadCount)`.
   - Loading skeleton variant when `isLoading` (`:158-182`).

2. **Profile header** — Avatar 24×24 (32 on sm), moderator shield badge if `role==='moderator'`, name (2xl black), handle, `culturalBackground` with Globe icon (uppercase primary), level badge `Award {title} · Level {n}` + location with MapPin.

3. **Language identity chips** — `user.languages ?? languages` prop, outline badges with skill icon + name + level.

4. **Stats row** — Followers (`dashboard.followerCount ?? 0`), Following (`dashboard.followingCount ?? 0`), Joined (`formatJoined(dashboard.joinedAt)`). Real counts from followers table per comment.

5. **Bio card** — italic quote card with StickyNote watermark, only if `user.bio`.

6. **CTA row** — Own: `Edit Profile` → `EDIT_PROFILE`. Other: Follow/Following toggle (local state only, no mutation).

7. **Tabs** (`Overview | Languages | Changa`):
   - **Overview**:
     - Contributor Level: title + level, `accepted verified` badge or `Start contributing`, `Progress` bar (5 verified per level, cap level 10, `intoLevel = accepted-(level-1)*5`), helper text for next title.
     - Your Samiati: 3 cards — Chats (`conversationCount`), Messages (`messageCount`), Day Streak (`contribution.streakDays`, Flame orange if >0). Plus legacy archive note if `legacyContributionCount>0`.
     - Your Contribution: if `total>0` → 2×2 grid Accepted (CheckCircle2) / In Review (Clock3) / Drafts (PenLine) / Voice (Mic + verified count), quality badges (acceptRate %, reviewer agreement), by-type breakdown list sorted desc. Else empty card with `Start contributing` → `Screen.CHANGA`.
     - Your Impact: Languages count (`topLanguages.length`), Verified (`accepted`), Reviews (`validationCount`), sentence listing top languages capitalised.
     - Achievements: 8 tiles — First Chat (`convs>0`), Conversationalist (`msgs≥50`), First Verified (`accepted≥1`), 100 Verified (`≥100`), 7-Day / 30-Day Streak, Multi-Language (`langs≥2`), Validator (`validations≥10`). Earned = colored, else dashed 50% opacity. `View all` → `Screen.ALL_ACHIEVEMENTS`.
     - Recent Activity: last 5 contribution events + 3 validation events, icon, label + language, relative time, status pill, click → `CHANGA_ACTIVITY`.
   - **Languages**: per-skill card (icon, name, level badge, `Progress percent`, `% MASTERY`, verified/total contributions if matched), empty state, own-profile `Update Skills` → `Screen.MANAGE_LANGUAGES`.
   - **Changa**: `Start a task` → `CHANGA`, `All activity` → `CHANGA_ACTIVITY`, recent contribution list with snippet + status or empty placeholder.

8. **Privacy controls (own profile only)** — Lock icon + `Privacy` heading, card with `Profile Visibility` switch and `Show Changa` switch (persisted via Convex).

### 2.3 Edit Profile (`src/components/screens/EditProfileScreen.tsx:31-169`)

Static/mock UI (no wiring — inputs use `defaultValue`, selects hardcoded):
- Header: back, `Edit Profile`, `NotificationBell`.
- Avatar block: hardcoded image, camera button, `Change Photo` outline button (no upload logic).
- Form: Full Name (`Input defaultValue="Amina Diallo"`), Cultural Background select (Maasai/Zulu/Berber/Ashanti/Fulani).
- Language Masteries: Primary card (Swahili/Yoruba/English + Beginner/Intermediate/Fluent segmented, Fluent active), Secondary card (Yoruba + Intermediate active + remove Minus btn), `Add Another Language` dashed button (no handler).
- `Change Password` ghost row → `Screen.CHANGE_PASSWORD`.
- Sticky footer: `Save Changes` (no onClick) + `Cancel` → `goBack()`.

---

## 3. Settings Hub — `/dashboard/settings`

### 3.1 Page wrapper (`src/app/dashboard/settings/page.tsx:16-70`)

- Client, demo-mode aware: `const useUser = isDemoMode ? useMockUser : useClerkUser` (`@/app/MockProviders` vs `@clerk/nextjs`).
- `isDarkMode` local `useState(true)` + `useSyncExternalStore` hydration guard + `useEffect` toggling `document.documentElement.classList 'dark'`. Returns `null` until hydrated + `isLoaded`.
- Maps Clerk user → `User {name, handle, avatar, isGuest, role}` — authenticated defaults `role:'moderator'`, guest uses long Google avatar URL + `role:'member'`.
- `onSignOut` → `await signOut(); navigate(Screen.WELCOME)`.

### 3.2 SettingsScreen (`src/components/screens/SettingsScreen.tsx:30-181`)

Props: `navigate, goBack, onSignOut, isDarkMode:boolean, toggleTheme, user:User`.
Local: `showSignOutDialog:boolean`.

Sections:
1. Header: back + `Settings`.
2. Profile card (button → `Screen.PROFILE`): Avatar 14×14, name + handle, ChevronRight, hover/active scale.
3. Samiati+ banner: gradient `from-primary via-orange-500 to-orange-600`, copy “Unlock unlimited translations, exclusive cultural badges, and an ad-free journey.”, `Upgrade Now` → `window.location.href="/pricing"`, Zap icon. No plan-state awareness.
4. Links card (`bg-muted/10 rounded-2xl`):
   - Account (`User` icon, sub “Password, 2FA, Delete”) → `SETTINGS_ACCOUNT`
   - Notifications (`Bell`, “Push, Email, In-App”) → `SETTINGS_NOTIFICATIONS`
   - Privacy (`Shield`, “Blocked, Muted, Data”) → `SETTINGS_PRIVACY`
   - Dark Mode row (`Moon`, “High contrast interface”, `Switch checked=isDarkMode`) — inline toggle, not a navigation.
   - Help & Support (`HelpCircle`, “FAQ, Contact”) → `SETTINGS_HELP`
5. Log Out: destructive ghost button → `AlertDialog` (“Log out of Samiati? You will need to sign in again…”, Cancel / Log Out → `onSignOut`).

---

## 4. Settings Sub-pages (detail)

### 4.1 Account — `SettingsAccountScreen.tsx:25-127`

Props `user, navigate, goBack`. State `showDeleteDialog`, `twoFactorEnabled(false)`.
- Header back + `Account`.
- Profile card: Avatar 20×20 + edit badge (material `edit` icon, no handler), name + handle.
- Account Info card (all `readOnly` inputs, no save):
  - Username: `user.handle.replace('@','')`
  - Email: hardcoded `user@example.com`
  - Phone: hardcoded `+254 712 345 678`
- Security card:
  - Change Password (`Key`) → `Screen.CHANGE_PASSWORD`
  - Two-Factor (`Fingerprint`, shows On green / Off muted, local toggle only, no backend)
  - Delete Account (`Trash2`, destructive) → `AlertDialog` (“permanent… All your data, contributions, and saved content will be permanently deleted.”, Delete button has no mutation — UI only).

### 4.2 Notifications — `SettingsNotificationsScreen.tsx:14-103`

Local booleans: `pauseAll(false)`, `changa(true)`, `moderation(true)`, `sessions(true)`, `emailDigest(false)`. No persistence.
- Pause All card (`Bell`, “Mute all notifications temporarily”).
- When `pauseAll`, categories + email sections get `opacity-50 pointer-events-none`.
- Categories: Changa (`MessageCircle`, “Contributions and updates”), Moderation (`Shield`, “Review requests and alerts”), Sessions (`Bell`, “Saved content updates”).
- Email: Weekly Digest (`Mail`, “Summary of top stories and highlights”).

### 4.3 Privacy — `SettingsPrivacyScreen.tsx:14-105`

Local: `privateAccount(false)`, `onlineStatus(true)`, `readReceipts(true)`. No backend (separate from ProfileScreen’s Convex `profileVisible/showChanga` — duplication risk).
- Account Privacy: Private Account (`Eye`, “Only approved followers can see your posts”).
- Activity Status: Show Online Status (`Eye`), Read Receipts (`EyeOff`).
- Safety links: Blocked Accounts (`Ban`) → `SETTINGS_BLOCKED`, Muted Words (`VolumeX`) → `SETTINGS_MUTED`, Data Settings (`Database`) → `SETTINGS_DATA`.

### 4.4 Blocked — `SettingsBlockedScreen.tsx:9-62`

Legacy styling (`bg-stone-50 dark:bg-background-dark`, material symbols, raw `<img>` — inconsistent with rest of settings using shadcn `Button/Avatar`). Local mock list: `Spam Bot 3000 @spam_king`, `Troll Account @troll_123` (pravatar). `Unblock` filters locally. Empty state (“You haven’t blocked anyone yet.”) + explainer (“Blocked accounts will not be able to see your profile, posts, or message you…”).

### 4.5 Muted — `SettingsMutedScreen.tsx:9-81`

Same legacy styling. State `mutedWords=['spoilers','politics','crypto']`, `newWord`. Add (dedup + lowercase, Enter key + Add button disabled when empty), delete per row, empty (“No words muted.”), info box (“Posts containing these words will be hidden… not case-sensitive.”). Local only.

### 4.6 Data — `SettingsDataScreen.tsx:12-75`

Modern shadcn styling. Local: `dataSaver(false)`, `highQuality(true)`, `autoDownload(true)`.
- Usage: Data Saver (`Wifi`, “Reduce image quality and stop autoplay”).
- Media Quality: High Quality Uploads (`Image`), Auto-download Media (`Download`, “Automatically download photos on mobile data”).

### 4.7 Help — `SettingsHelpScreen.tsx:36-194`

Props `goBack` only. `useAction(api.sunflower.sendMessage)` AI help.
State `query`, `conversation:Message[]`, `isLoading`, `messagesEndRef` (declared but never scrolled to — dead ref).
Flow `handleAsk`: append user msg, clear input, `sendMessageAction({userMessage, conversationHistory})`, append ai msg, catch → system msg “I'm having trouble connecting…”.
UI: top AI input bar (`auto_awesome` icon, placeholder switches after first message, send `arrow_upward` hidden when empty), FAQ accordion (`FAQItem` with grid-rows animation) shown only when `conversation.length===0` — 9 hardcoded Q&As (what Samiati does, voice, languages, offline, pricing, accuracy, Changa, who it’s for). Chat bubbles (user primary right, ai/system white card left) + typing dots loading.

### 4.8 Languages — `src/app/dashboard/settings/languages/page.tsx:8-24`

Wraps `ManageLanguagesScreen` with `useAppUser()` languages + `setLanguages` via `onUpdateLanguages`. (Read that screen for full language CRUD.)

### 4.9 Billing — `src/app/settings/billing/page.tsx:40-89`

Standalone (not under `/dashboard`). `userId="current" as any` — not wired to auth.
- `SubscriptionManager userId` (Current Plan section).
- Two `PricingCard`s: Learner $5/mo (400 AI msgs, 200 translations, 20 voice mins, 90-day history, 5 langs) and Fluent $15/mo (1500 msgs, 750 translations, 80 voice mins, unlimited history/langs, export & priority). `onSelect → /checkout?plan=learner|fluent`. Link to `/pricing`.

---

## 5. Data Types

`src/types.ts:74-98` `User`:
`name, handle, avatar, isGuest` + optional `bio, culturalBackground, location, role ('admin'|'moderator'|'member'|'guest'), xp, level, badges[], followerCount, followingCount, languages: LanguageSkill[], streakDays, lastContributionDate, contributionStats {totalApproved, totalPending, byType, byLanguage}`.

`LanguageSkill (:205-210)`: `{id, name, level:'Learning'|'Conversational'|'Fluent'|'Native', percent:number}`.

`ProfileDashboard (:214-260)`: `{profile {isMe,isFollowing,…}, joinedAt, followerCount, followingCount, contribution {total, accepted, inReview, drafts, needsFix, rejected, withdrawn, acceptRate, reviewAgreementRate, trustScore, validationCount, streakDays, voiceRecordings, voiceAccepted, byType, byLanguage, topLanguages[], badges[]}, contributorLevel {level,title}, activeRoles[], legacyContributionCount, timeline[] {kind:'contribution'|'validation', id, label, languageCode?, status?, snippet?, timestamp}, privacy {profileVisible, showChanga, voiceDataAllowed, culturalDataAllowed}}`.

---

## 6. Gaps / Notes for Redesign

1. ~~Privacy duplicated~~ — **Fixed.** `SettingsPrivacyScreen` and `ProfileScreen` now share one source of truth: the `profileVisible` / `showChanga` flags on the Convex `users` row, mirrored through `useAccountSettings()`.
2. ~~Account fields hardcoded + readOnly, 2FA + Delete UI-only~~ — **Fixed.** The Account screen reads the real email and 2FA state from Clerk and hands password / 2FA / sessions / delete to the provider's account panel.
3. ~~Notifications/Data/Blocked/Muted all `useState` local — refresh loses changes~~ — **Fixed.** Notifications and privacy persist to the account via Convex; data, muted words and blocked accounts persist as device settings in `localStorage`.
4. `EditProfileScreen` fully static — no props for user, no save handler, hardcoded “Amina Diallo”.
5. `getSkillIcon` levels (Beginner/Intermediate) don’t match `LanguageSkill` union (Learning/Conversational) — icons fall through to 🌱.
6. Profile `loading={false}` hardcoded in page wrapper disables skeleton; `messagesEndRef` in Help never used for autoscroll.
7. Styling split — **mostly fixed.** The settings hub, Account, Notifications, Privacy, Data, Muted and Blocked screens now share the `SettingsShell` / `SettingsRow` / `SettingsSection` primitives. `SettingsHelpScreen` is the last screen still on the legacy stone/material-symbols styling.
8. Billing uses `userId="current"` placeholder; Samiati+ banner hard-links to `/pricing` with no entitlement check.

> See `SETTINGS_ARCHITECTURE.md` for the full rework, including the settings
> catalogue, the device/account scopes, and the shared primitives.

## 6.1 Profile rework (same treatment as the settings area)

The profile area got the same treatment as the settings area. What changed:

1. **`EditProfileScreen` is real.** It used to be a mock-up: the name was hard-coded to
   "Amina Diallo", the avatar was a hard-coded Google URL, the proficiency buttons
   offered "Beginner / Intermediate / Fluent" — levels the data model does not store —
   and **the "Save Changes" button had no handler at all**. It now loads the current
   values, tracks unsaved changes, validates against the same limits the server
   enforces, and saves through the `updateProfile` mutation (which already existed,
   fully implemented, and was never called).
2. **One language vocabulary.** `src/lib/languages.ts` is now the single source of
   truth for proficiency levels (`Learning` / `Conversational` / `Fluent` / `Native`).
   Before this, the edit screen offered "Beginner / Intermediate / Fluent" while the
   data model stored the other set — which is why `ProfileScreen`'s proficiency icon
   fell through to a seedling for *every* language.
3. **One language editor.** `src/components/profile/LanguageEditor.tsx` is shared by
   the edit-profile screen and the manage-languages screen, which previously each had
   their own.
4. **One privacy path.** The profile screen's "Profile Visibility" and "Show Changa"
   toggles used to call `updatePrivacy` directly, while the Privacy settings screen
   used the shared mirror. Both now go through `useAccountSettings()`.
5. **Manage Languages persists.** It only updated local component state, so in
   production the list was discarded on the next render. It now saves through
   `updateProfile`.
6. **The profile skeleton is bounded.** The profile page used to hard-code
   `loading={false}`. It now shows the skeleton for a short grace period and then
   falls back to the profile it already has, so a slow or unavailable Convex query
   can never leave the page blank.
7. **GDPR actions are reachable.** The `exportUserData` query already existed on the
   server but nothing could reach it. The Data settings screen now offers "Export my
   data" (downloads a JSON copy) and routes "Delete account" to the identity
   provider, which owns the sign-in identity as well as the Samiati data.
8. **The profile is searchable.** The six editable profile fields are in the settings
   catalogue, so searching "bio" or "cultural background" in Settings jumps straight
   to the right field.

## 7. File Index

- Pages: `src/app/dashboard/profile/page.tsx`, `src/app/dashboard/settings/page.tsx`, `src/app/dashboard/settings/{account,notifications,privacy,blocked,muted,data,help,languages}/page.tsx`, `src/app/settings/billing/page.tsx`
- Screens: `src/components/screens/ProfileScreen.tsx`, `EditProfileScreen.tsx`, `SettingsScreen.tsx`, `SettingsAccountScreen.tsx`, `SettingsNotificationsScreen.tsx`, `SettingsPrivacyScreen.tsx`, `SettingsBlockedScreen.tsx`, `SettingsMutedScreen.tsx`, `SettingsDataScreen.tsx`, `SettingsHelpScreen.tsx`, (+ `ManageLanguagesScreen.tsx`)
- Core: `src/types.ts`, `src/hooks/useNavigation.ts`, `src/hooks/useAppUser.ts`, `src/app/MockProviders.tsx`, `src/lib/appMode.ts`, `convex/profile/queries.ts` (`getDashboard`), `convex/users/mutations.ts` (`updatePrivacy`), `src/services/localConversationService.ts`
