# Samiati implementation and migration plan

This plan is presented before implementation. Changes proceed incrementally in the current repository; all pre-existing edits and backend contracts are retained. No destructive refactor is necessary.

## Phase 1 — audit and proposal

Deliver audit, token/typography proposal, component inventory, hierarchy and this plan. Record baseline type checking/tests. Review the actual Next 16 bundled guides. Gate: documents exist before frontend changes.

## Phase 2 — foundations

Implement paired semantic themes, accessible muted text/focus/status tokens, Manrope/Instrument Serif, global motion and wrapping rules, shared brand/page/navigation primitives, and existing-storage theme toggle. Keep legacy token aliases so untouched screens still render. Gate: typecheck and token checks; preserve appearance preferences.

## Phase 3 — core chat

Restyle the existing Q&A screen and composer, consolidate language picker, improve sidebar/search/history, fix chronological presentation and deep links, retain local storage and Convex actions. Remove invented quality scores/translations, gate unsupported attachments/voice, label related reading honestly. Gate: focused regressions and integration checks. Context-aware chat migration is explicitly separate from this visual redesign.

## Phase 4 — public experience

Replace homepage presentation while preserving waitlist; add language explorer and optional onboarding, use draft configurable pricing. Landing establishes the editorial reference with a clearly labeled interactive demonstration, how-it-works, language/accessibility story, Discover/voice/Changa previews and FAQ. No fabricated language phrases, news, statistics, live offers or payment changes. Gate: routes/build pass and language/status interactions reviewed.

## Phase 5 — ecosystem

Apply shared design to Discover, Changa, profile and settings while retaining all claims, drafts, consent, uploads, review, authentication and account actions. Add provenance and honest empty/error states; reuse actual contribution data. A narrow privacy correction explicitly stores private visibility and consent-off flags on newly created users/guests, with matching frontend defaults. Existing accounts and explicit choices are not migrated or overwritten. This changes no schema or API contract. Gate: existing functional tests, new-user/privacy regressions and focused source/workflow review.

## Phase 6 — integration and evidence

Run TypeScript, existing tests, targeted lint and production build. Review responsive rules at 320/375/430/768/1024/1440, long content, keyboard/focus, reduced motion, safe areas and theme consistency. Record which checks are static and which actually ran in a browser. Validate real APIs only when configured and authorized; never count mocks as service verification.

## Release and rollback

No deployment or commit is required for this local repository task. Keep provider layout and storage keys stable. Roll back individual frontend components/tokens using the task diff, never `git reset` in this dirty workspace. Backend schema, auth contracts, translation routing, payments and existing user data remain unchanged. New-user insertion gains explicit privacy defaults only. Linguistic review, production service verification and hardware testing remain release gates even when code checks pass.

## Reporting

After each phase, record implementation/validation in `SAMIATI_UI_TESTING.md`. Final report names mock versus live behavior and any remaining work explicitly. Root completion ledger is `gates/ui-root.md`, preserving the earlier `GATES.md` ledger.
