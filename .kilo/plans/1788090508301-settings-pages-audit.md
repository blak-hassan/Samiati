# Settings Pages Audit & Improvement Plan

## Scope
All settings pages excluding the profile page:
- `/dashboard/settings` (Main Settings)
- `/dashboard/settings/notifications`
- `/dashboard/settings/privacy`
- `/dashboard/settings/blocked`
- `/dashboard/settings/muted`
- `/dashboard/settings/data`
- `/dashboard/settings/help`
- `/dashboard/settings/languages`
- `/settings/billing`

---

## Issues Found (Detailed)

### 1. Inconsistent Header/Back Button Styles Across Pages
**Severity:** High  
**Pages:** All pages  
**Analysis:**  
- Most pages (Settings, Notifications, Privacy, Data, Help, Languages) use a `Button` component from shadcn/ui with an `ArrowLeft` lucide icon for the back button.  
- Two pages (Blocked, Muted) use a raw `<button>` with `material-symbols-outlined` ("arrow_back") instead of the shadcn Button + lucide icon pattern. (Languages was previously listed here, but it actually renders the shared `SettingsPageHeader` back button, so it belongs in the Button group above.)
- Some headers use `px-4 h-14`, others use `p-4`. Some have `border-b border-border/50`, others use `border-stone-200 dark:border-white/5`. This creates visual inconsistency when navigating between settings pages.  
**Impact:** Users perceive jarring style changes when navigating between settings pages, reducing perceived polish.  
**Action Plan:**  
1. Extract a shared `SettingsPageHeader` component with `title` and `onBack` props.  
2. Replace all page headers with this shared component.  
3. Standardize on shadcn `Button` + lucide `ArrowLeft` for all back buttons.  
4. Standardize header height (`h-14`), padding (`px-4`), and border styles across all settings pages.

---

### 2. Missing Save/Confirmation Feedback for Settings Changes
**Severity:** Low (resolved at PR head)  
**Pages:** Notifications, Privacy, Data  
**Analysis:**  
- The `useSettings` hook now persists preferences (including `darkMode`, `dataSaver`, `highQuality`, `autoDownload`, `privateAccount`, etc.) and surfaces a "Settings saved" / success toast on change.  
- Server-backed settings use the Convex `updatePrivacy` mutation (e.g. `privateAccount` → `profileVisible`) and the dedicated settings mutations for blocked/muted words, with error toasts on failure.  
- Toggling a switch persists the value and shows confirmation; navigating away no longer silently loses changes.  
**Impact:** Resolved — preferences persist and users receive confirmation.  
**Action Plan:**  
1. (Done) `useSettings` persists to `localStorage` and `updateSetting` shows a success toast.  
2. (Done) Server-backed toggles call `updatePrivacy`/settings mutations with error handling.

---

### 3. Unused `navigate` Prop in Sub-Pages
**Severity:** Low  
**Pages:** Blocked, Muted, Data, Help  
**Analysis:**  
- `SettingsBlockedScreen`, `SettingsMutedScreen`, `SettingsDataScreen`, and `SettingsHelpScreen` all receive a `navigate` prop in their `Props` interface (or the page passes it) but never use it inside the component.  
- Example: `SettingsBlockedScreen.tsx` has `interface Props { goBack: () => void; }` — it correctly omits `navigate`.  
- However, the `page.tsx` wrappers for Blocked and Muted pass only `goBack`, while Notifications and Privacy pass both `navigate` and `goBack`.  
- This inconsistency suggests that some screens may have been designed to support internal navigation (e.g., to an Account page) but it was never wired up.  
**Impact:** Dead code / API surface. Not a functional bug, but increases maintenance burden.  
**Action Plan:**  
1. Decide whether these pages need internal navigation (e.g., Data Settings → Help). If not, remove the `navigate` prop from the interfaces and page wrappers.  
2. If internal navigation is planned, implement it or remove the prop until needed.

---

### 4. Dark Mode Toggle Has No Persistence or System Preference Detection
**Severity:** Medium  
**Page:** Main Settings (`/dashboard/settings`)  
**Analysis:**  
- The `isDarkMode` value is derived from persisted settings (`savedSettings.darkMode ?? true`), which initializes only on the component's first mount — not on every render, since React preserves `useState`/derived state across re-renders.  
- Theme changes are persisted via the `useSettings` flow (backed by `localStorage`) and applied immediately to the document.  
- It does not check `window.matchMedia('(prefers-color-scheme: dark)')` for system preference.  
- Because the theme is now persisted, a full page reload restores the saved preference rather than resetting it; only a hard reset of stored settings would revert to the `true` default.  
- **Status:** Resolved at PR head (persisted theme handling implemented).
**Impact:** Users lose their theme preference on every reload.  
**Action Plan:**  
1. Read initial theme from `localStorage` or system preference in a `useEffect` with empty dependency array (client-side only).  
2. Persist theme changes to `localStorage` (or user API) when toggled.  
3. Consider using `next-themes` for robust theme management.

---

### 5. `BillingPage` Uses a Placeholder User ID and Client-Side Redirect
**Severity:** Low (resolved at PR head)  
**Page:** `/settings/billing`  
**Analysis:**  
- The user ID is now derived from the authenticated user context (`user?.id || user?.username || "current"`) rather than a hardcoded `"current" as any`.  
- Checkout navigation uses Next.js `useRouter().push(\`/checkout?plan=...\`)` instead of a full `window.location.href` reload, preserving SPA behavior.  
- The remaining `"current"` fallback is a defensive default; the server-derived billing identity is used when available.  
**Impact:** Resolved — subscription data loads from the real user identity and checkout stays within the SPA.  
**Action Plan:**  
1. (Done) Derive `userId` from the app user context.  
2. (Done) Use `router.push` for checkout navigation.

---

### 6. `SettingsHelpScreen` Does Not Auto-Scroll to New Messages
**Severity:** Medium  
**Page:** Help & Support  
**Analysis:**  
- A `messagesEndRef` is created (`const messagesEndRef = useRef<HTMLDivElement>(null);`) and rendered as `<div ref={messagesEndRef} />`.  
- However, it is never scrolled into view after a new message is added or after the AI finishes responding.  
- The `conversation` array grows, but the viewport stays at the top.  
**Impact:** Users must manually scroll to see the latest AI response, which is a poor chat UX.  
**Action Plan:**  
1. Add a `useEffect` that triggers `messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })` whenever `conversation` changes or `isLoading` becomes false.

---

### 7. `SettingsMutedScreen` Uses `onKeyPress` (Deprecated)
**Severity:** Low  
**Page:** Muted Words  
**Analysis:**  
- The input field uses `onKeyPress={(e) => e.key === 'Enter' && handleAddWord()}`.  
- `onKeyPress` is deprecated in React 18+ and may be removed in future versions.  
- It does not prevent the default Enter behavior in all browsers, which could cause form submission side effects.  
**Impact:** Minor. Works today but may break in future React versions.  
**Action Plan:**  
1. Replace `onKeyPress` with `onKeyDown` and add `e.preventDefault()`.

---

### 8. `ManageLanguagesScreen` Uses `alert()` for Validation
**Severity:** Medium  
**Page:** Languages  
**Analysis:**  
- `alert("All available languages have been added!")` and `alert("You already have this language listed.")` are used for user feedback.  
- `alert()` is blocking, unstyled, and inconsistent with the rest of the app's toast/dialog patterns.  
**Impact:** Jarring UX. Blocks the main thread. Inconsistent with the app's design language.  
**Action Plan:**  
1. Replace `alert()` calls with a toast notification system (e.g., `sonner` or `react-hot-toast`).  
2. Alternatively, show inline validation messages near the trigger button.

---

### 9. Inconsistent Empty States
**Severity:** Low  
**Pages:** Blocked, Muted  
**Analysis:**  
- `SettingsBlockedScreen` empty state uses an icon (`material-symbols-outlined text-4xl mb-2 opacity-50`), a paragraph, and a light background.  
- `SettingsMutedScreen` empty state uses plain text (`<p>No words muted.</p>`) with no icon and less visual emphasis.  
- Other pages (e.g., Notifications, Data) do not have empty states at all.  
**Impact:** Inconsistent experience when content is absent.  
**Action Plan:**  
1. Create a reusable `EmptyState` component with icon, title, and optional description slots.  
2. Apply it consistently across Blocked, Muted, and any future list-based settings pages.

---

### 10. `SettingsScreen` (Main) Has a Profile Card That Links to Excluded Page
**Severity:** Low  
**Page:** Main Settings  
**Analysis:**  
- The Profile card at the top of `SettingsScreen.tsx` navigates to `Screen.PROFILE` (`/dashboard/profile`).  
- The user explicitly excluded the profile page from this audit, but the Profile card is the first and most prominent element on the main settings page.  
- If the profile page has issues, users will encounter them immediately from settings.  
**Impact:** Boundary issue. The settings menu effectively hands users off to the excluded profile page.  
**Action Plan:**  
1. Clarify with the user whether the Profile card link should be included in the audit scope.  
2. If the profile page is out of scope, at minimum ensure the link is clearly labeled and the destination page matches user expectations.

---

### 11. `SettingsHelpScreen` Stops Showing FAQs After First Question
**Severity:** Medium  
**Page:** Help & Support  
**Analysis:**  
- The FAQ section (`{conversation.length === 0 && ...}`) disappears entirely once the user sends their first message.  
- Users can no longer browse FAQs while chatting.  
- There is no way to return to the FAQ-only view without clearing the conversation (and there is no clear/reset button).  
**Impact:** Loss of helpful self-service content after the first interaction.  
**Action Plan:**  
1. Keep the FAQ section visible alongside the chat history.  
2. Add a "Reset conversation" button.  
3. Consider splitting the page into tabs: "FAQ" and "Ask AI".

---

### 12. `SettingsDataScreen` Has No Visual Feedback for Data Saver State
**Severity:** Low  
**Page:** Data Settings  
**Analysis:**  
- The "Data Saver" toggle description says "Reduce image quality and stop autoplay".  
- There is no visual indication (e.g., a banner, badge, or changed layout) when Data Saver is active.  
- Users have no way to verify that the setting is actually affecting the app.  
**Impact:** Discoverability. Users may not know the setting is working.  
**Action Plan:**  
1. Add a subtle banner or indicator when Data Saver is active (e.g., "Data Saver is on — images are compressed").  
2. Ensure the rest of the app respects the Data Saver toggle (verify implementation outside this page).

---

### 13. `BillingPage` Layout Breaks Mobile Consistency
**Severity:** Low  
**Page:** Billing & Subscription  
**Analysis:**  
- The billing page uses a completely different layout pattern (`mx-auto max-w-4xl px-4 py-12`) compared to the other settings screens (which use `p-4 space-y-6` inside a card-based layout).  
- It does not use the shared settings header pattern at all — no back button, no sticky header.  
- If navigated to from within the app, users may feel they have left the app entirely.  
**Impact:** Breaks the mental model of the settings section.  
**Action Plan:**  
1. Wrap the billing content in the same header/card pattern used by other settings pages.  
2. Ensure the page respects the app's max-width and padding conventions.

---

### 14. `useNavigation` Default Fallback May Generate Invalid Routes
**Severity:** Medium  
**File:** `src/hooks/useNavigation.ts`  
**Analysis:**  
- The `default` case in `navigate()` does: `go(`/dashboard/${screen.toLowerCase().replace(/_/g, '-')}${queryString}`);`  
- This assumes every `Screen` enum value maps 1:1 to a route. If a screen like `SETTINGS_BLOCKED` is not explicitly mapped, it becomes `/dashboard/settings-blocked`, which is wrong (should be `/dashboard/settings/blocked`).  
- However, all settings screens ARE explicitly mapped, so this is a latent risk for future screens.  
**Impact:** Future screens added to the `Screen` enum without explicit route mapping will generate broken URLs.  
**Action Plan:**  
1. Add a comment warning future developers to add explicit routes.  
2. Consider adding a lint rule or unit test that asserts every `Screen` value has an explicit `case` in `navigate()`.

---

### 15. `SettingsMutedScreen` Delete Button Has No Confirmation
**Severity:** Low  
**Page:** Muted Words  
**Analysis:**  
- Clicking the delete icon immediately removes the word with no confirmation dialog.  
- If a user accidentally taps delete, the word is gone instantly.  
**Impact:** Accidental data loss.  
**Action Plan:**  
1. Add a confirmation dialog or an "undo" toast when a word is deleted.  
2. Alternatively, require a long-press or secondary tap to delete.

---

### 16. `SettingsBlockedScreen` Unblock Has No Confirmation
**Severity:** Low  
**Page:** Blocked Accounts  
**Analysis:**  
- Clicking "Unblock" immediately removes the block with no confirmation.  
- Similar to Muted Words, accidental taps cause unintended actions.  
**Impact:** Accidental unblocking of a user.  
**Action Plan:**  
1. Add a confirmation dialog: "Unblock @spam_king? They will be able to see your profile and message you again."

---

### 17. `SettingsScreen` (Main) Missing Accessibility Labels on Toggle
**Severity:** Low  
**Page:** Main Settings  
**Analysis:**  
- The Dark Mode `Switch` component lacks an explicit `aria-label` or associated `<label>` element.  
- Screen readers may announce it as "switch" without context.  
**Impact:** Reduced accessibility for screen reader users.  
**Action Plan:**  
1. Add `aria-label="Dark mode"` to the Switch component.  
2. Ensure all switches across settings pages have descriptive labels.

---

### 18. `SettingsHelpScreen` Loading State Lacks an Explicit "Thinking..." Affordance
**Severity:** Low  
**Page:** Help & Support  
**Analysis:**  
- The input field correctly uses `disabled={isLoading}`, which greys it out while a response is pending.  
- However, there is no explicit "Thinking..." text or a nearby loading indicator at the input bar itself (the only indicator lives in the chat area).  
- The send button is hidden via `disabled:opacity-0 disabled:pointer-events-none`, which may not be obvious to all users.  
**Impact:** Minor UX ambiguity.  
**Action Plan:**  
1. Add a subtle loading indicator or "Samiati is typing..." text near the input bar while `isLoading` is true.

---

## Prioritized Action Plan

### P0 — Must Fix Before Release
1. **#6 HelpScreen auto-scroll** — Core chat UX is broken.  
   (Note: #5 BillingPage userId & routing is resolved at PR head — removed from P0.)

### P1 — High Priority (Fix in Next Sprint)
2. **#1 Inconsistent headers** — Visual polish.  
   (Note: #2 Save/confirmation feedback and #4 Dark mode persistence are resolved at PR head — removed from active priorities.)

### P2 — Medium Priority
6. **#3 Unused navigate props** — Code hygiene.  
7. **#7 Deprecated onKeyPress** — Future-proofing.  
8. **#8 alert() in ManageLanguages** — UX consistency.  
9. **#11 FAQ disappears** — Help content discoverability.  
10. **#14 Navigation default route risk** — Defensive coding.

### P3 — Low Priority (Polish)
11. **#9 Inconsistent empty states** — Visual consistency.  
12. **#12 Data Saver no visual feedback** — Discoverability.  
13. **#13 Billing layout inconsistency** — Brand consistency.  
14. **#15 Muted delete no confirmation** — Prevent accidental loss.  
15. **#16 Blocked unblock no confirmation** — Prevent accidental loss.  
16. **#17 Accessibility labels** — A11y compliance.  
17. **#18 Help loading clarity** — Minor UX.

---

## Recommended Implementation Order

1. Extract `SettingsPageHeader` component.  
2. Refactor all settings pages to use the shared header.  
3. (Done) Implement a `useSettings` hook for persistent preferences.  
4. (Done) Wire up toasts for all toggle changes.  
5. (Done) Fix BillingPage userId and routing.  
6. Add `useEffect` scroll-to-bottom in HelpScreen.  
7. Replace deprecated `onKeyPress` and `alert()` calls.  
8. Add confirmation dialogs for destructive actions (unblock, delete muted word).  
9. (Done) Persist dark mode preference.  
10. Keep FAQ visible alongside chat in HelpScreen.
