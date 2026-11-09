# Settings Architecture

> Rework of the Samiati settings area, modelled on T3 Chat's settings page
> (`pingdotgg/t3code` — `apps/web/src/components/settings/`).

## 1. Why this changed

The previous settings area looked finished but was functionally hollow:

- Every toggle lived in component-local `useState`, so a refresh threw the
  user's choices away.
- The Convex mutations `updateNotificationPreferences` and `updatePrivacy`
  already existed but **nothing called them**.
- The Account screen showed a hard-coded `user@example.com` and a hard-coded
  phone number, and its two-factor / delete-account controls did nothing.
- Privacy was duplicated between the Profile screen and the Privacy screen.
- The theme was a single "Dark Mode" switch that only applied while the
  settings page was mounted.

T3 Chat solved the same problems with four ideas, all of which are now used
here:

| T3 Chat idea | Where it landed in Samiati |
|---|---|
| One persisted settings object | `src/lib/settings.ts` + `src/hooks/useSettings.ts` |
| A searchable catalogue of every setting | `SETTINGS_CATALOG` + `src/components/settings/SettingsSearch.tsx` |
| A shared `SettingsRow` / `SettingsSection` primitive with per-setting reset | `src/components/settings/SettingsRow.tsx`, `SettingsSection.tsx`, `RestoreDefaultsButton.tsx` |
| Scoped settings (global vs project) and a sectioned navigation rail | `src/lib/accountSettings.ts` + `src/components/settings/SettingsShell.tsx` |

## 2. Two scopes

| Scope | Where it lives | Which settings |
|---|---|---|
| **Device** | `localStorage` key `samiati:settings:v1` | Appearance, chat behaviour, data usage, muted words, blocked accounts |
| **Account** | Convex `users` row (`notificationPreferences`, `profileVisible`, `showChanga`, `voiceDataAllowed`, `culturalDataAllowed`) | Notification preferences, privacy and consent flags |

Device settings are read through `useSettings()` (a `useSyncExternalStore`
store, so writes from other tabs and the reset button stay in sync). Account
settings are mirrored locally by `AccountSettingsSync` so the UI is instant,
then pushed to Convex with the existing `updateNotificationPreferences` and
`updatePrivacy` mutations.

## 3. File map

### Foundation

| File | Purpose |
|---|---|
| `src/lib/settings.ts` | Types, defaults, the settings catalogue, search scoring, `formatMessageTime` |
| `src/lib/accountSettings.ts` | The account-scoped mirror + pending-change queue |
| `src/hooks/useSettings.ts` | Device settings store, `useApplySettings`, reset helpers |
| `src/hooks/useAccountSettings.ts` | Read/update account settings from React |

### Shared UI

| File | Purpose |
|---|---|
| `src/components/settings/SettingsShell.tsx` | Header + section navigation rail (sticky on desktop, scrollable chips on mobile) |
| `src/components/settings/SettingsRow.tsx` | One row: icon, title, description, control, reset button |
| `src/components/settings/SettingsSection.tsx` | Grouped card, with an "Advanced" disclosure |
| `src/components/settings/SettingsSelect.tsx` | Styled native select (the project has no `@radix-ui/react-select`) |
| `src/components/settings/SettingsSearch.tsx` | Search across every individual setting |
| `src/components/settings/RestoreDefaultsButton.tsx` | "Restore defaults" with a list of the settings it will reset |
| `src/components/settings/SettingsApplier.tsx` | Applies theme/accent/type-scale/accessibility to `<html>` |
| `src/components/settings/AccountSettingsSync.tsx` | Two-way sync between the mirror and Convex |

### Screens

| Route | Screen |
|---|---|
| `/dashboard/settings` | `SettingsScreen` — searchable directory of every settings area |
| `/dashboard/settings/appearance` | `SettingsAppearanceScreen` — theme, accent, type scale, layout, accessibility, chat behaviour |
| `/dashboard/settings/account` | `SettingsAccountScreen` — real email, 2FA state, sessions, delete |
| `/dashboard/settings/notifications` | `SettingsNotificationsScreen` — persisted to the account |
| `/dashboard/settings/privacy` | `SettingsPrivacyScreen` — visibility, consent, safety |
| `/dashboard/settings/data` | `SettingsDataScreen` — data saver, media quality |
| `/dashboard/settings/muted` | `SettingsMutedScreen` — persisted muted words |
| `/dashboard/settings/blocked` | `SettingsBlockedScreen` — persisted blocked accounts |

## 4. Appearance settings

Driven from `useApplySettings` (`src/hooks/useSettings.ts`), which writes to
`<html>` so the choices apply on every screen and survive navigation.

| Setting | Effect |
|---|---|
| `theme` | `system` / `light` / `dark` — `system` follows `prefers-color-scheme` live |
| `accent` | Rewrites `--active-accent` / `--active-accent-hover` |
| `textSize` | `html[data-text-size]` → `--app-font-scale` |
| `chatWidth` | `html[data-chat-width]` → `--app-content-width`, used by the chat column |
| `reduceMotion` | `html.reduce-motion` |
| `highContrast` | `html.high-contrast` |

## 5. Account management

Password, two-factor authentication, active sessions and account deletion are
owned by the identity provider (Clerk), not by Samiati. The Account screen
shows the real values and hands those four actions to the provider's account
panel via `openUserProfile()`, rather than faking them.

## 6. Tests

`tests/settings.test.ts` covers:

- every catalogue id is unique;
- every catalogue entry points at a route that exists (`SETTINGS_ROUTES`);
- every catalogue entry maps to a real setting key;
- every device setting is catalogued (so a new setting cannot be added
  without appearing in search);
- every editable profile field is catalogued;
- search ranking, keyword matching and the empty/unmatched cases;
- the language vocabulary: the levels match the data model, each level has
  its own icon, and an unknown level falls back safely;
- the account mirror persists changes, queues them for the server, and does
  not let a stale server snapshot overwrite an unsaved local edit.

---

## 7. The profile area

The profile area was reworked with the same principles (see
`SETTINGS_PROFILE_BREAKDOWN.md` §6.1 for the full list).

### Foundation

| File | Purpose |
|---|---|
| `src/lib/profile.ts` | `ProfilePatch`, the server-side field limits, and the editable field list |
| `src/lib/languages.ts` | The single language vocabulary: levels, icons, percentages, available languages |
| `src/components/profile/LanguageEditor.tsx` | The one language editor, shared by the edit-profile and manage-languages screens |
| `src/components/settings/SettingsField.tsx` | A stacked labelled field, for anything the user types into |

### Screens

| Route | Screen | What changed |
|---|---|---|
| `/dashboard/edit-profile` | `EditProfileScreen` | Was a static mock-up with no save handler. Now loads the real values, tracks unsaved changes, validates, and saves through `updateProfile`. |
| `/dashboard/profile` | `ProfileScreen` | Privacy toggles now share the account-settings mirror; the proficiency icon bug is fixed; the loading skeleton is bounded. |
| `/dashboard/settings/languages` | `ManageLanguagesScreen` | Rewritten on the shared editor; saves through `updateProfile` instead of only updating local state. |
| `/dashboard/settings/data` | `SettingsDataScreen` | Now offers "Export my data" (the `exportUserData` query already existed but was unreachable) and routes "Delete account" to the identity provider. |

### Profile fields

`name`, `bio`, `avatar`, `location`, `culturalBackground` and `languages` are
all editable and saved through the `updateProfile` Convex mutation, which
enforces the same limits the form does (name ≤ 100, bio ≤ 500, location ≤ 200,
≤ 20 languages, and the avatar must be an http(s) URL).

