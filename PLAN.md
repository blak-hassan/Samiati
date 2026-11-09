# Plan: Samiati UI revamp

Mode: orchestrated. Existing `GATES.md` belongs to an earlier task and is preserved. Current ledger: `gates/ui-root.md`.

## Contract

- Retain Next 16.3.1 / React 19 / Tailwind 4 / Radix / Lucide / Clerk / Convex; no new dependencies or backend mutations.
- Read local Next docs before code. Preserve dirty-tree work, API shapes, all routes, settings storage, `samiati_conversations`, `samiati_active_chat` and query deep links.
- Foundation leaf owns globals.css, root layout, shared brand/page/theme/product navigation, product language catalogue. Chat leaf owns HomeSearchScreen, search/*, chat/LanguageSelector, AppSidebar, dashboard/page and focused history tests. Ecosystem leaf owns Discover*, Changa presentation, profile/settings presentation, pricing draft presentation. Public leaf owns homepage, language explorer and onboarding. Root owns docs and integration fixes only.
- Semantic classes: bg-background/card/secondary, text-foreground/muted-foreground/primary/ai, border-border, ring-ring; no hardcoded dark surfaces in new UI.
- Foundation catalogue: `src/lib/productLanguages.ts`, `PRODUCT_LANGUAGES` entries `{code,name,nllbCode?:string,region:string,text:'configured'|'planned',voice:'unverified'|'unavailable',note?:string}`. Export `getProductLanguage(code)`; no accuracy scores. Known existing nine text routes plus Gusii/Somali/Sheng marked planned.
- Foundation components in `src/components/product`: `Brand({className?,compact?})`, `PageIntro({eyebrow?,title,description?,children?})`, `ThemeToggle()`, `ProductNav({active?:'chat'|'discover'|'languages'|'changa'|'profile'|'settings'})` using real route links, desktop + safe-area mobile nav. Public can reuse Brand and ThemeToggle; chat retains its own sidebar.
- Use Manrope + Instrument Serif with fallbacks. Font licenses verified upstream OFL 1.1. No unverified translated examples. Configured routes are not operational guarantees. Voice availability remains unverified unless verified.

## Leaves and gates

1. Audit/docs — root, completed before edits.
2. Foundations — gates/ui-foundations.md.
3. Chat — gates/ui-chat.md.
4. Public — gates/ui-public.md.
5. Ecosystem — gates/ui-ecosystem.md.
6. Integration — gates/ui-root.md.

## Status log

- Audit complete; baseline typecheck and 81 tests passed. Migration proposal written before implementation.
- Foundations complete: semantic paired themes, local licensed fonts, shared product primitives, existing-store preferredLanguage, accessible accent pairs and global rem/motion/focus rules; leaf checks recorded in gates/ui-foundations.md.
- Public experience complete: landing, language explorer, optional onboarding and real route links; targeted ESLint/typecheck/tests and HTTP200 public rendering checks recorded in gates/ui-public.md. Browser/service/linguistic verification explicitly remains outside observed evidence.
- Integration review: implement explicit private/consent-off defaults for new users only. No backend schema/API changes or existing-account migration; root owns this narrow correction and regressions.
- Foundations and public leaves verified: paired themes/local fonts/shared preferences/navigation, landing/languages/onboarding. Parent independent review and checks complete.
- Chat leaf verified: history/API/storage retained; chronology, language-first controls, error truthfulness and accessibility improved; focused tests pass.
- Ecosystem leaf verified: live feed/contribution/profile/settings workflows retained, truthful proposed pricing and real milestones. Parent fixed final lint render-effect findings.
- Final integration verified: 102 tests, production build/TypeScript, zero lint errors (6 legacy warnings), 11 HTTP routes passed. Browser testing unavailable; full limitations and changed files in SAMIATI_UI_TESTING.md. No deployment or commit.
