# Samiati UI audit

Audit date: 2026-11-08. Source of truth: current working tree, including pre-existing uncommitted work. No backend rewrite, data migration, dependency replacement, or payment change is proposed.

## Existing implementation

- Next.js **16.3.1**, React **19.2.3**, TypeScript 5, App Router and `src/proxy.ts`. Local Next guides for layouts, server/client components and fonts were reviewed before implementation.
- Tailwind **4**, CSS variables in `src/app/globals.css`, shadcn-style Radix primitives in `src/components/ui`, Lucide plus legacy Material Symbols. Fonts currently Outfit, Be Vietnam Pro and Lexend via Google CSS.
- Clerk authentication, Convex queries/actions/mutations, Sentry and Vercel Analytics. Root providers also serve public waitlist/billing; dashboard adds auth-aware settings/account synchronization. Preserve this arrangement.
- `/` currently presents Darasa Coming Soon and a working Samiati waitlist. Preserve the waitlist within the new public page.
- `/dashboard` renders `HomeSearchScreen` with `sunflower.search`: stateless Q&A, not context-aware `convex/chat`. History is browser-local (`samiati_conversations`, `samiati_active_chat`). Preserve keys, message schema and `?chatId=` / `?q=` deep links.
- Discover has Convex feed, categories, trending, engagement, saving and dismissing. Changa has task claims, drafts, consent, recording/upload, processing and review. Profile queries real account/contribution data and local history. Settings already provide reusable shells/sections/rows, search, device preferences and account synchronization.
- Pricing currently links to checkout and hardcodes allowances. Payments are outside the authorized visual migration; proposed pricing must be visibly configurable and unconfirmed.
- No dedicated onboarding or language explorer exists. Manage Languages edits profile proficiency, which is a different purpose.

## Component inventory and disposition

| Component/system | Decision | Reason |
| --- | --- | --- |
| Radix buttons, dialogs, sheets, popovers, fields, cards, skeletons | Retain and refine | Existing accessibility behavior and low migration risk |
| Root/auth/Convex providers, API contracts | Retain | Working integrations and guest handling |
| Settings store, account mirror, settings shell/search/rows | Retain | Existing persistent architecture |
| FeedbackBar, Changa task/validation runners, media upload | Retain and restyle | Real workflows and consent must survive |
| AppSidebar / search composer / language picker | Modify | Simplify navigation, remove duplicated pickers, improve keyboard/touch use |
| HomeSearchScreen / SearchResults | Modify | Chronology, errors, truthful sources and restrained chat presentation |
| Public homepage | Replace presentation, retain waitlist | Establish Samiati identity and entry points |
| Pricing presentation | Replace with configurable draft plans | Avoid unconfirmed offers or invented limits |
| Language explorer and onboarding | Add | Missing product flows; share language choices and existing storage |
| Legacy Material icons and unrelated social screens | Retain incrementally | Global removal would create unnecessary regressions |

## Findings and risks

1. Newest answers currently precede old turns; successful questions disappear. Sidebar selection can overwrite its own conversation URL; saved history does not immediately refresh.
2. Language scores and quality labels have no benchmark provenance. Localized placeholders and suggestion pools lack linguistic verification. Use neutral names and explicitly English examples pending review.
3. UI language vocabulary, profile language skills and backend mappings are separate. A configured route is not proof of operational or linguistic quality. Gusii, Somali and Sheng need honest planned/community distinctions, never an invented model code.
4. ASR/TTS actions exist, but operational support per language is unverified. Image chips do not reach the model. Do not imply image understanding, live camera or unsupported speech.
5. Independently fetched Wikipedia links are not answer citations. Show related reading unless actual grounding is supplied. Backend `ERROR:` strings must enter the error path.
6. Mobile navigation relies on a drawer, desktop has a sidebar; ecosystem screens are inconsistent and often narrow. Add shared navigation without nesting duplicate sidebars or hiding existing screens.
7. Muted text contrast is weak, icon targets are small, some controls lack labels, mobile Sheet lacks a title. Long words need wrapping, dialogs need bounded viewports and motion needs a system-preference override.
8. Discover refresh is cosmetic; source links/summary provenance need clearer presentation. Do not fabricate articles, dates or citations when feed data is absent.
9. Changa has genuine upload/review behavior. Keep consent, claims and moderation intact; remove unsupported decorative language symbols and clearly label demonstration activity.
10. Profile/privacy defaults are public/opted-in. New default values can be made private without overwriting existing saved preferences; existing users require deliberate migration rather than a visual rewrite.
11. Substantial dirty working tree means changes must be additive and narrowly scoped. No reset, bulk deletion or generated backend edits.

## Research and verification limits

Fetched public text from [Brainy](https://brainy.ink/), [T3 Chat](https://t3.chat/) and [Linear](https://linear.app/). Perplexity and Duolingo returned no useful interface content; no full visual inspection of those products is claimed. The attached Brainy screenshot supplies the bold type/contrast reference. Use abstract editorial geometry only, without attributing invented motifs to communities.

Baseline: `npx tsc --noEmit --pretty false` passed; `npm test -- --reporter=dot` passed (7 files, 81 tests). Browser, deployed credentials, payment, microphone hardware, linguistic accuracy and external service availability are not established by those checks.

See `SAMIATI_IMPLEMENTATION_PLAN.md` for the migration order and `SAMIATI_UI_TESTING.md` for final evidence.
