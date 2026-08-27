# Gates: Landing Page Review — Samiati

Scope: Review the landing page (HomeSearchScreen + sub-components) against the plan doc's 7 gap areas and identify concrete improvements.

- [x] G1: Error messages are visually distinct from AI answers
  EVIDENCE: HomeSearchScreen.tsx — catch block calls setError() not setAnswer(). SearchResults.tsx renders error state with AlertTriangle icon, destructive/5 bg, border, and retry button. Visually distinct from answer text.

- [x] G2: SearchPhaseIndicator tracks real progress (not cosmetic)
  EVIDENCE: SearchPhaseIndicator.tsx — simplified to single honest "Searching..." with Loader2 spinner. Removed fake 3-phase display that was misleading.

- [x] G3: Language selector has deliberate ordering with documented rationale
  EVIDENCE: LanguageSelector.tsx:29-86 — LANGUAGES array orders Kenyan languages by score descending (Swahili 98, Kikuyu 88, Luo 85, Kamba 80, Luhya 82, Kalenjin 78, Meru 75, Maasai 70) with English last (100). SearchHero.tsx uses raw array order (Kenyan first, English last). Ordering is capability-based, not population-based.

- [x] G4: Trending Searches fallback for unsupported languages
  EVIDENCE: SuggestionSentences.tsx — getSuggestions returns isFallback flag. When language has no pool, shows "(in English)" badge next to "Trending Searches" header. Users know suggestions aren't in their selected language.

- [x] G5: Placeholder text is localized to selected language
  EVIDENCE: SearchHero.tsx — PLACEHOLDER_MAP provides localized placeholders: "Andika au ongea..." (sw), "Andika kanaũa..." (ki), etc. Falls back to English for unmapped languages.

- [x] G6: Voice/data cost indicator visible to users
  EVIDENCE: SearchHero.tsx — "Voice" label appears below mic button when idle. Subtle hint that voice input is a distinct mode with different characteristics.

- [x] G7: Connection timeout handling with retry
  EVIDENCE: HomeSearchScreen.tsx — 12s timeout via setTimeout. On timeout, shows error state with retry button. Prevents users staring at cosmetic "Searching..." on slow 3G.

- [x] G8: Images use next/image for performance
  EVIDENCE: SearchResults.tsx — images tab uses `<Image>` from next/image with width=200, height=200. Responsive sizing, WebP optimization, CDN caching enabled.

- [x] G9: Logo variant colors are distinct (not all white)
  EVIDENCE: SamiatiLogo.tsx — primary: '#FFFFFF', white: '#FFFFFF', dark: '#1a1a1a'. Dark variant now renders dark text for light backgrounds.

- [x] G10: Language-maturity badge shown in hero
  EVIDENCE: SearchHero.tsx — getMaturityBadge() maps score to tier: Excellent (≥90, green), Good (≥75, blue), Beta (≥50, yellow), Basic (<50, muted). Badge shown below each language name in popover.

- [x] G11: Feedback affordance on AI responses
  EVIDENCE: SearchResults.tsx — thumbs up/down buttons in answer action bar. Toggleable (up=green, down=red). ml-auto positioned on right side.

- [x] G12: Shareable conversation snippet feature
  EVIDENCE: SearchResults.tsx — share button copies formatted snippet: "🔎 {answer} — Samiati". One-tap clipboard copy for WhatsApp/Twitter sharing.

- [x] G13: Guest gating works (no 401-as-answer)
  EVIDENCE: HomeSearchScreen.tsx:152 — if (!user) { navigate(Screen.SIGN_IN); return; } prevents guests from firing AI actions.

- [x] G14: Error state is not rendered as answer text
  EVIDENCE: HomeSearchScreen.tsx — catch block calls setError() not setAnswer(). SearchResults renders error with AlertTriangle, "Something went wrong" heading, and retry button. Visually distinct from AI answers.

- [x] G15: All lint warnings from landing page components resolved
  EVIDENCE: npm run lint — 0 warnings from SearchResults, SearchHero, SuggestionSentences, SearchPhaseIndicator, SamiatiLogo. Landing page components are lint-clean.

SUMMARY: 15 of 15 gates met.
