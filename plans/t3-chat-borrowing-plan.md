# T3 Chat → Samiati: What to Borrow

> A comparison of T3 Chat's settings and profile surfaces against Samiati's, and
> five concrete changes worth taking — each one re-pointed at Samiati's own
> translation-first product rather than copied across.

Reference implementation: [`pingdotgg/t3code`](https://github.com/pingdotgg/t3code)
(`apps/web/src/components/settings/`). Samiati's existing borrowing is already
documented in [`SETTINGS_ARCHITECTURE.md`](../SETTINGS_ARCHITECTURE.md); this
document covers what is *still* missing.

---

## 1. What the comparison actually shows

T3 Chat's settings feel refined because of three structural properties, not
because it has more screens.

| Property | T3 Chat | Samiati today |
|---|---|---|
| **Every setting has a visible scope** | `scopedSettings.ts` + `SettingInheritance.tsx` render "inherited from global / overridden here", with a clear-override action. `SettingsScopeNotice.tsx` explains when a setting does not apply at the current scope. | `src/lib/settings.ts` defines `scope: 'device' \| 'account' \| 'profile'` and every catalogue entry carries one — but **no UI ever renders it**. The user cannot tell whether "High contrast" follows them to their laptop. |
| **Search lands on the exact row** | `settingsSearch.ts` entries carry a `targetId`; `settingsLayout.tsx` scrolls it into view, focuses it and applies a `settings-search-target-pulse` highlight. `AdvancedSettings.tsx` auto-expands a collapsed "Advanced" fold when the target lives inside one. | `SettingsSearch.tsx` does `router.push(entry.path)` and dumps the user at the top of a section. The stable ids already exist (`appearance.theme` in both `SETTINGS_CATALOG` and `SettingsRow id=`) — nothing uses them. |
| **Diagnostics is a first-class surface** | `DiagnosticsSettings.tsx` (~50 KB), `ConnectionDiagnosisDetails.tsx`, `ResourceTelemetryDiagnostics.tsx`, `TelemetryExportSettings.tsx`: per-service health, copyable trace IDs, exportable bundle. | **Nothing.** Worse: `convex/sunflower.ts` returns `{ answer: "ERROR: ..." }` and `HomeSearchScreen.tsx` calls `setAnswer(result.answer)`, so a missing API key or a rate limit is rendered *inside the answer bubble as if the AI said it*. `GATES.md` G14 claims this cannot happen — the returned-string path bypasses the `setError` guard it cites. |

T3's profile page is thin but **account-shaped**: `T3ChatUserProfilePage.tsx`
shows plan, account-link status and a `TunnelUsageMeter` used/limit meter.
Samiati's `/dashboard/profile` is rich in *community* shape (followers,
languages, Changa activity) but carries **no plan, no usage, and no settings
entry point**, and its privacy toggles duplicate `SettingsPrivacyScreen`.

The single largest gap is not a missing screen. It is that **Samiati's settings
are mostly decorative**: several toggles are persisted and rendered but read by
nothing. See `src/lib/settings.ts` `DeviceSettings` — `sendOnEnter`,
`autoTranslate`, `dataSaver`, `highQualityUploads`, `autoDownloadMedia`,
`chatWidth` (the `--app-content-width` custom property is written but never
consumed), `mutedWords` and `blockedUsers` (neither is enforced in any Convex
query) are all inert.

---

## 2. The five changes

Ordered by compounding return, not by effort.

### 1. Feedback → Changa: a bad translation becomes a training example

**T3 Chat has:** `/feedback <reason>` in the composer (`threadFeedback.ts`,
`ComposerFeedback.tsx`) that uploads the thread to the provider and hands back a
**copyable feedback ID** with a status banner (uploading → sent → failed).

**Samiati has:** `convex/feedback.ts` already stores `reason`, `correction`,
`contextType`, `language` and `originalText`; `FeedbackBar.tsx` already
collects a free-text correction. But `getUserStats` and `getRecent` are
**defined and never called by any screen**, and a thumbs-down on a Kikuyu
translation goes nowhere.

**The build.** A `promoteToChanga` mutation on the feedback row creates a
`changaSubmissions` row through the existing Changa pipeline
(`createDraftSubmission` → `submitSubmission` → `runSubmissionChecks`), typed
as `phrase_translation`/`sentence_translation` with the correction as
`targetText`, the original as `sourceText`, and the reason as `contextNote`.
Consent is captured through the existing `changaConsentValidator` +
`insertConsentRecord` pair, so training use is never implied. The feedback row
keeps `changaSubmissionId` so the link is visible from both ends.

The payoff is the point: a user typing *"this should be mũgithi"* is handing
Samiati a curated training example. Today that value is dropped on the floor.

**Also:** give every feedback row a short, quotable `code` (the T3 feedback-ID
pattern) and surface the user's own corrections on their profile via the
already-written `getUserStats`.

### 2. Per-language-pair settings scope

**T3 Chat has:** `scopedSettings.ts`, `ScopedSwitch.tsx`,
`SettingInheritance.tsx` (inherited vs overridden + clear-override),
`SettingsScopeNotice.tsx` (why a setting is unavailable at this scope).

**Samiati has:** the *data model* for three scopes (`src/lib/settings.ts:17`)
and a two-level mirror in `src/lib/accountSettings.ts` — but the scope is
invisible, so "device vs account" is folklore.

**The build.** Add a `scope` prop to `SettingsRow` rendering a small badge
("This device" / "Your account"), sourced from the catalogue so it cannot
drift. Then add the translation-specific scope axis T3's project-scoping
implies: a `perLanguage` map on `DeviceSettings`, so "auto-translate on for
Swahili, off for Kikuyu" is expressible. Reuse the existing pending-change
queue in `accountSettings.ts` for inheritance resolution.

This matters because the language switch in `HomeSearchScreen` resets to
`sw` on every mount and `LanguageSelector.tsx` holds its own list of 9
languages while `src/lib/languages.ts` holds a *different* list of 13.

### 3. Diagnostics + a copyable support bundle

**T3 Chat has:** a diagnostics panel with per-connection state, copyable trace
IDs and telemetry export.

**Samiati has:** none — and a real defect. `convex/translate.ts` routes per
language-pair to *different model endpoints* via `SUNFLOWER_MT_KIK_URL` /
`SUNFLOWER_MT_KIK_EN_URL`, so a Kikuyu user and a Swahili user hit different
models. None of that is observable, and failures arrive as answer text.

**The build.** A `/dashboard/settings/diagnostics` section listing per-service
health (translate / chat / asr / tts / wiki), which endpoint serves each
language pair, and a **Copy diagnostics** button emitting a JSON bundle —
model IDs, endpoint reachability, device settings, rate-limit state, recent
error codes, **no secrets**. Alongside it, make `runSearchCore` and
`callSunflower` return a typed `{ ok, answer } | { ok: false, code }` instead
of an `ERROR:`-prefixed string, so the answer bubble can never contain
infrastructure text.

On a 3G connection in Kenya, "the model is loading (503)", "you hit the hourly
limit" and "the API key is misconfigured" need three different answers. Right
now all three render as English prose in the wrong place.

### 4. Usage & limits — enforced and visible

**T3 Chat has:** a `/chat/usage` route (`UsagePage.tsx`, `UsageLimits.tsx`,
`UsageShareBar.tsx`) *and* a usage meter on the profile page.

**Samiati has:** the entire backend — `PLAN_LIMITS` for 4 tiers,
`getUsageStats`, `UsageBar`, `SubscriptionManager` — with three real problems:

- `convex/lib/aiSecurity.ts:46` hardcodes `const tier: PlanTier = "free"`. A
  paying Fluent subscriber is enforced at free-tier limits.
- `recordUsage` (`usage.ts:131`) and `checkUsageLimit` (`usage.ts:164`) are
  **never called**, so `usageTracking` counts are permanently zero and the
  monthly limits in `PLAN_LIMITS` are never actually applied.
- The only surface is `/settings/billing` — outside `/dashboard`, unreachable
  from Settings, linked from nowhere in `src/`.

**The build.** Call `recordUsage` from the AI actions that consume quota,
resolve the real tier from `getActiveSubscription` inside
`enforceAiQuotaAction`, add a "Usage & limits" row in Settings > Data, and put
a compact meter on the profile like T3's `TunnelUsageMeter`. Also fold
`exportUserData` and `deleteAccount` in `convex/users/mutations.ts` into
scope: neither currently touches `feedback`, `usageTracking` or
`subscriptions`, so deleting an account leaves orphaned feedback rows holding
AI transcripts and user corrections.

### 5. Voice & dictionary settings

**T3 Chat has:** `VoiceSettingsPanel.tsx` (~65 KB) — speech-language select, a
personal dictionary *and* a project dictionary, silence filtering,
remove-filler-words, cleanup model, mic test.

**Samiati has:** ASR (Paza Whisper, 51 African languages) and TTS (Orpheus, 32
speaker IDs) with **zero settings for either**. And a concrete coverage hole:
`convex/tts.ts` `ORPHEUS_SPEAKER_MAP` has 28 base languages while
`convex/translate.ts` `LANGUAGE_MAP` has 60. **32 translatable languages have
no voice** and fall through to `DEFAULT_SPEAKER = 'salt_eng_0001'` — English.
That includes Kalenjin (`kln`) and Luhya (`luy`), both of which are already in
`LanguageSelector.tsx` and `AVAILABLE_LANGUAGES`.

**The build.** A "Voice" settings section — speech language, per-language voice
selection, mic test reusing the recorder already in `HomeSearchScreen.tsx`,
and a **personal dictionary** of names/terms always translated consistently.

A personal dictionary is simultaneously a UX feature *and* curated language
data — the same compounding loop as #1. And "Kalenjin text-to-speech reads in
an English voice" is a bug a settings screen would have surfaced on its own.

---

## 3. Deliberately not copied

| T3 Chat feature | Why not |
|---|---|
| Labs / beta channel | Samiati already ships `Discover`, `Wiki`, `Sunflower` and Paystack. A general feature-flag panel would be ceremony, not capability. |
| Scheduled tasks, worktrees, source control | T3-Code-the-product concepts. Samiati has no threads, worktrees or source control to schedule against. |
| Full keybinding editor | Disproportionate for a mobile-first Kenyan audience. Honouring the existing `sendOnEnter` setting is the right-sized slice. |
| Provider / secret settings | Samiati runs one AI stack. There is nothing for the user to configure. |

---

## 4. Two cheap riders

Both are small, and both make existing work feel finished.

- **Make settings search land on the row.** `SettingsSearch.tsx` already has
  `entry.id`; the `SettingsRow` DOM ids already match. Push
  `#${entry.id}`, then scroll + focus + pulse. T3's exact mechanism, ~30 lines.
- **Make `sendOnEnter` real.** `SearchHero.tsx:139` hardcodes
  `e.key === "Enter" && !e.shiftKey` and never reads the setting, so that
  toggle is currently a lie.

---

## 5. Rollout sequence

### Milestone 1 — Feedback → Changa
Close the loop from a reported mistake to a validated dataset example.
Includes the feedback `code`, the promotion mutation, the consent capture, and
a "Your corrections" block on the profile.

### Milestone 2 — Honest errors + diagnostics
Typed action results, the diagnostics screen, the copyable support bundle.

### Milestone 3 — Scope visibility + per-language settings
Scope badges, `perLanguage` overrides, search-lands-on-the-row.

### Milestone 4 — Usage, limits and plan correctness
Real tier resolution, real counters, in-product surfaces.

### Milestone 5 — Voice & dictionary
Per-language voices, mic test, personal dictionary.

---

## 6. Success metrics

Track from day one:

- **Correction capture** — feedback rows with a correction, per 100 AI answers.
- **Correction promotion** — corrections promoted to Changa, and the share that
  reach `validated` then `curated`.
- **Dataset yield** — promoted corrections landing in a `changaDatasetReleases`
  slice, per language.
- **Trust** — peer accept rate on promoted corrections vs. task-originated
  submissions. Promoted corrections should be *at least* as acceptable as
  volunteered ones; if they are not, the promotion path is admitting noise.
- **Error legibility** — share of failed AI calls that render a typed error
  rather than an `ERROR:` string in the answer bubble.
- **Plan integrity** — paid subscribers enforced at their purchased tier.
- **Language coverage** — languages with at least one curated example, and
  languages with a working TTS voice.


