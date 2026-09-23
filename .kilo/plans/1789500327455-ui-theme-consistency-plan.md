# UI Theme Consistency Plan

## Executive Summary

The application has a functional dark/light mode toggle in Settings, but **many components hardcode dark-mode colors** or use CSS variables inconsistently, causing visual issues in light mode. The root `<html>` element is hardcoded to `dark` in `layout.tsx`, and the theme only switches after client-side hydration.

## Current Architecture

- **Tailwind CSS v4** with CSS custom properties (defined in `globals.css`)
- **Theme toggle** in Settings persists to `localStorage` (`samiati-settings`)
- **Client-side theme application** via `document.documentElement.classList.add/remove('dark')` in `SettingsLayoutClient.tsx` and `SettingsIndexClient.tsx`
- **No SSR theme detection** - defaults to dark, flashes on hydration in light mode

---

## Identified Issues

### 1. Root Layout Forces Dark Mode (Critical)
**File:** `src/app/layout.tsx:89`
```tsx
<html lang="en" className={`dark ${fontClassName}`} ...>
```
**Impact:** Light mode never works on initial render; flashes dark → light on hydration.

### 2. Home Page Hardcodes Dark Colors (Critical)
**File:** `src/app/page.tsx:116`
```tsx
<main className="min-h-screen bg-background-dark text-text-main antialiased">
```
Uses hardcoded `--color-background-dark` / `--color-text-main` instead of `bg-background text-foreground`.

### 3. Navbar Hardcodes Dark Colors (High)
**File:** `src/components/landing/Navbar.tsx:10`
```tsx
<nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#2b1e19]/80 backdrop-blur-md">
```
Hardcoded `#2b1e19` (dark bg) and `border-white/10`.

### 4. SidebarContent Hardcodes Hover Colors (High)
**File:** `src/components/shared/SidebarContent.tsx:29,134`
```tsx
hover:bg-black/5 dark:hover:bg-white/5
```
Should use `hover:bg-muted/...` or `hover:bg-accent` CSS variables.

### 5. SubscriptionManager Hardcodes Status Badge Colors (Medium)
**File:** `src/components/SubscriptionManager.tsx:77-79`
```tsx
bg-green-100 text-green-700 ... dark:bg-emerald-900/30 dark:text-emerald-300
```
Should use semantic tokens: `bg-success/10 text-success` with dark variants.

### 6. SettingsPageHeader Hardcodes Saved Status Colors (Medium)
**File:** `src/components/settings/SettingsPageHeader.tsx:55`
```tsx
bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 ...
```
Should use semantic success tokens.

### 7. UsageBar Hardcodes Warning/Error Colors (Medium)
**File:** `src/components/UsageBar.tsx:33,44,46`
```tsx
text-amber-500, bg-red-500, bg-amber-500
```
Should use `--color-warning` / `--color-error` / `--color-success` CSS variables.

### 8. Missing Global Theme Toggle (UX)
No theme toggle in main app header/nav - only in Settings.

### 9. No SSR Theme Detection (Performance)
Theme flash on hydration because server always renders dark.

---

## CSS Variable System Analysis (globals.css)

The codebase already defines comprehensive semantic tokens:

**Light mode (`:root`):**
- `--background: #FAF9F6`
- `--foreground: #2b1e19`
- `--card: #ffffff`
- `--card-foreground: #2b1e19`
- `--primary: var(--active-accent)` (brown `#8B4513`)
- `--primary-foreground: #ffffff`
- `--muted: #E7E5E4`
- `--muted-foreground: #5E5852`
- `--border: #E7E5E4`
- `--input: #E7E5E4`
- `--ring: var(--active-accent)`
- `--destructive: #ea4335`

**Dark mode (`.dark`):**
- `--background: #2b1e19`
- `--foreground: #FAFAF9`
- `--card: #42342b`
- `--card-foreground: #FAFAF9`
- `--muted: #584639`
- `--muted-foreground: #C8B9B0`
- `--border: #584639`
- `--input: #42342b`
- `--destructive: var(--color-rasta-red)`

**Custom semantic colors (available):**
- `--color-success: var(--color-rasta-green)` (`#009B3A`)
- `--color-error: var(--color-rasta-red)` (`#C8102E`)
- `--color-warning: var(--color-rasta-gold)` (`#FFD700`)

---

## Fix Plan

### Phase 1: Core Theme Infrastructure

#### Task 1.1: Remove Hardcoded `dark` from Root Layout
**File:** `src/app/layout.tsx`
- Remove `dark` from `<html className>`
- Add inline script in `<head>` to apply theme before paint (prevents flash)
- Read `localStorage.getItem('samiati-settings')` and apply `dark` class if `darkMode !== false`

#### Task 1.2: Fix Home Page Colors
**File:** `src/app/page.tsx`
- Change `bg-background-dark text-text-main` → `bg-background text-foreground`
- Audit all sections for hardcoded dark colors (trust strip, footer, etc.)

#### Task 1.3: Fix Navbar Colors
**File:** `src/components/landing/Navbar.tsx`
- Replace `bg-[#2b1e19]/80` → `bg-background/80`
- Replace `border-white/10` → `border-border/50`

### Phase 2: Component-Level Fixes

#### Task 2.1: Fix SidebarContent Hover States
**File:** `src/components/shared/SidebarContent.tsx`
- Line 29: `hover:bg-black/5 dark:hover:bg-white/5` → `hover:bg-muted/50`
- Line 134: Same fix

#### Task 2.2: Fix SubscriptionManager Status Badge
**File:** `src/components/SubscriptionManager.tsx`
- Replace hardcoded green/emerald with semantic success tokens
- Use `bg-[var(--color-success)/10] text-[var(--color-success)]` + dark variants

#### Task 2.3: Fix SettingsPageHeader Saved Status
**File:** `src/components/settings/SettingsPageHeader.tsx`
- Replace hardcoded emerald with semantic success tokens
- Use CSS variables consistent with design system

#### Task 2.4: Fix UsageBar Warning/Error Colors
**File:** `src/components/UsageBar.tsx`
- Replace `text-amber-500` → `text-[var(--color-warning)]`
- Replace `bg-red-500` → `bg-[var(--color-error)]`
- Replace `bg-amber-500` → `bg-[var(--color-warning)]`
- Replace `text-red-500` → `text-[var(--color-error)]`

### Phase 3: Audit & Polish

#### Task 3.1: Full Codebase Audit for Hardcoded Colors
Search patterns to fix:
- `bg-[#2b1e19]` / `bg-background-dark`
- `text-text-main` / `text-stone-900` (when not using CSS vars)
- `dark:` variants with hardcoded hex colors
- `hover:bg-black/5 dark:hover:bg-white/5`
- `bg-green-100`, `text-green-700`, `bg-emerald-*`, `text-emerald-*`
- `bg-red-500`, `text-red-500`, `bg-amber-500`, `text-amber-500`
- `border-white/10`, `border-white/5`

#### Task 3.2: Add Global Theme Toggle (Optional Enhancement)
- Add theme toggle to `AppSidebar` / `Navbar` / `MobileAppLayout`
- Use existing `toggleTheme` from settings context

#### Task 3.3: Verify Color Contrast (WCAG AA)
- Test all semantic color pairs in both themes
- Ensure `--primary` on `--primary-foreground` meets 4.5:1
- Ensure `--muted-foreground` on `--background` meets 4.5:1
- Ensure `--destructive` on white meets 4.5:1

---

## Validation Strategy

### Automated Checks
1. **Build & Lint:** `npm run build && npm run lint`
2. **TypeCheck:** `npx tsc --noEmit`
3. **E2E Accessibility Tests:** `npm run test:e2e e2e/a11y.spec.ts`
4. **Visual Regression:** Manual testing in both themes across key pages:
   - `/` (homepage)
   - `/dashboard` (main app)
   - `/dashboard/settings` (settings with toggle)
   - `/dashboard/settings/billing` (subscription manager)
   - `/pricing` (landing pricing)

### Manual Verification Checklist
- [ ] Home page renders correctly in light mode (no dark backgrounds)
- [ ] Home page renders correctly in dark mode
- [ ] Dashboard renders correctly in both modes
- [ ] Settings page theme toggle works instantly
- [ ] Sidebar hovers use correct colors in both modes
- [ ] Subscription status badge visible in both modes
- [ ] Usage bars show warning/error states correctly in both modes
- [ ] No flash of wrong theme on page load
- [ ] Theme persists across refreshes
- [ ] All text meets WCAG AA contrast in both themes

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Theme flash on SSR | High | Medium | Inline script in `<head>` |
| Missing hardcoded colors | Medium | High | Comprehensive grep audit |
| Contrast failures in light mode | Medium | High | Test with axe/color contrast tools |
| Breaking existing dark mode | Low | High | Test dark mode first, then light |

---

## Dependencies & Order

```
1.1 (Root Layout) → 1.2 (Home Page) → 1.3 (Navbar)
                                    ↓
2.1 (Sidebar) → 2.2 (Subscription) → 2.3 (Settings Header) → 2.4 (UsageBar)
                                    ↓
                            3.1 (Full Audit) → 3.3 (Contrast Check)
```

---

## Out of Scope

- Adding new design tokens (existing system is sufficient)
- Refactoring to next-themes (current implementation works)
- Mobile-specific theme issues (covered by responsive testing)
- Animation/transition polish (separate concern)

---

## Success Criteria

1. **Zero hardcoded dark-mode colors** in components using semantic CSS variables
2. **No theme flash** on initial page load in either mode
3. **WCAG AA contrast** passed for all text in both themes
4. **All existing tests pass** (`npm run test && npm run test:e2e`)
5. **Theme toggle works** instantly without page reload