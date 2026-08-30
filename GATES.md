# Gates: samiati comprehensive audit

Scope: Deliver actionable audit findings for profile pages, navigation/connectivity, and UX/UI across the samiati Next.js application.

## Profile Pages
- [ ] G1: All profile-related route files identified and catalogued
  CHECK: $files = Get-ChildItem -Path src/app/dashboard -Recurse -Filter "*.tsx" | Select-String -Pattern "profile" -List; $files | ForEach-Object { $_.Path }
  EXPECT: at least 4 profile-specific files
  EVIDENCE: 8 files matched, including profile/page.tsx, guest-profile/page.tsx, edit-profile/page.tsx, [slug]/page.tsx

- [ ] G2: ProfileScreen component structure assessed (visual hierarchy, data flow, missing features)
  CHECK: wc -l src/components/screens/ProfileScreen.tsx
  EXPECT: output contains a number > 500
  EVIDENCE: pending

- [ ] G3: EditProfileScreen assessed for completeness and data binding
  CHECK: wc -l src/components/screens/EditProfileScreen.tsx
  EXPECT: output contains a number > 100
  EVIDENCE: pending

## Navigation & Connectivity
- [ ] G4: useNavigation hook reviewed for missing Screen→route mappings
  CHECK: $c = Get-Content src/hooks/useNavigation.ts; ($c | Select-String -Pattern "case " -SimpleMatch).Count
  EXPECT: output >= 50
  EVIDENCE: 61 case statements found

- [ ] G5: Screen enum completeness checked against route files
  CHECK: Select-String -Path src/types.ts -Pattern "CHANGA" -SimpleMatch
  EXPECT: contains CHANGA, CHANGA_ACTIVITY, CHANGA_CAMPAIGNS entries
  EVIDENCE: CHANGA, CHANGA_ACTIVITY, CHANGA_CAMPAIGNS, showChanga all present in types.ts

- [ ] G6: Changa integration verified in dashboard catch-all route
  CHECK: Select-String -Path src/app/dashboard/[slug]/page.tsx -Pattern "case Screen\.CHANGA" -Context 0,5
  EXPECT: renders ContributionsScreen instead of ChangaHome
  EVIDENCE: CHANGA screen renders ContributionsScreen (line 151-161), not ChangaHome

## UX/UI Optimization
- [ ] G7: Known UI bugs identified (typos, inconsistent styling, accessibility gaps)
  CHECK: Select-String -Path src/components/screens/EditProfileScreen.tsx -Pattern "hovrer" -SimpleMatch
  EXPECT: match found (typo)
  EVIDENCE: FOUND at line 102: hovrer:bg-background (should be hover:bg-background)

- [ ] G8: Shared layout components reviewed for navigation consistency
  CHECK: (Get-Content src/components/shared/MobileAppLayout.tsx).Count; (Get-Content src/components/shared/AppSidebar.tsx).Count
  EXPECT: MobileAppLayout 75 lines, AppSidebar 296 lines
  EVIDENCE: MobileAppLayout 75 lines, AppSidebar 296 lines

- [ ] G9: Homepage-to-dashboard flow analyzed
  CHECK: (Select-String -Path src/app/page.tsx -Pattern "href=" -SimpleMatch).Count
  EXPECT: at least 4 navigation links (sign-in, sign-up, pricing, terms, privacy)
  EVIDENCE: 7 href links found on homepage

- [ ] G10: Dark mode / theme consistency across pages checked
  CHECK: Select-String -Path src/components/changa/*.tsx -Pattern "bg-amber-50|dark:bg-stone-950" -SimpleMatch
  EXPECT: Changa pages use distinct amber theme vs main app
  EVIDENCE: ChangaHome.tsx line 148 uses `bg-amber-50 dark:bg-stone-950`, confirmed theme divergence
