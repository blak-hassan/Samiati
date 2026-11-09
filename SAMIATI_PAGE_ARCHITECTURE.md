# Samiati page architecture

## Hierarchy

```text
/                              Editorial landing + interactive example + existing waitlist
/languages                     Public language explorer and honest capability descriptions
/onboarding                    Optional language-first introduction; guest entry remains available
/pricing                       Configurable draft Free / $5 / $15 / Custom presentation
/sign-in, /sign-up              Existing Clerk routes
/privacy-policy, /terms-of-service  Existing legal documents
/dashboard                     Main language-first Q&A + local conversation history
  ?chatId=...                   Existing conversation deep link
  ?q=...                        Existing Discover-to-chat link
  /discover                    Existing reactive editorial feed and saved stories
  /changa                      Community contribution overview
  /changa-campaigns            Task discovery
  /changa-activity              Contribution history
  /validate                    Existing review workflow
  /profile                     Profile, contributions, preferences and private account controls
  /settings                    Searchable settings hub
    /appearance                Theme, size, width and accessibility
    /languages                 Existing profile language preferences
    /privacy, /notifications, /account, /data, /blocked, /muted, /help
  [existing social, moderation and contribution routes retained]
/checkout, /settings/billing, /api/paystack/callback  Existing payment routes, unchanged
```

## Primary flows

1. Landing → explore languages or optional onboarding → `/dashboard` → choose language → compose → response → optional feedback/correction.
2. Sidebar/drawer → search local history → reopen a saved thread → continue Q&A. Explain browser-local history; do not imply cloud synchronization or context-aware reasoning.
3. Discover → category → sourced AI summary → save/share/read source → ask Samiati using existing `?q=` route.
4. Changa → task discovery → claim → consent → contribute → review → submit → genuine recognition from backend stats.
5. Profile → language preferences / settings → theme/accessibility/privacy/data. Existing account actions remain intact.

## Navigation

Desktop: collapsible chat sidebar; shared ecosystem navigation on other screens. Mobile: drawer for conversation history, compact Chat / Discover / Languages / Changa bottom navigation with safe-area padding. Account/settings are reachable without displacing the chat composer. Public header links to language explorer, Changa, pricing and chat; public footer retains legal/waitlist access.

## Ownership and content truth

One language catalogue separates configured text routes from planned requests and unverified voice. Profile proficiency is user-reported, not model accuracy. Luhya/Kalenjin and other labels are not claims of a single standardized variety. Do not add translated examples or autonyms without verification.

Discover summaries are labeled AI-generated; linked publisher metadata remains intact. Empty live feeds remain empty with an explanation. Marketing demonstration cards are labeled examples, not fabricated reporting. Prices are proposals in configurable data with no checkout action added.

Onboarding and language defaults reuse existing local settings/storage; authenticated language updates retain existing account/profile mechanisms. No new database or payment system is introduced.
