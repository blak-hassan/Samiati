# Samiati privacy and terms review

Prepared: 8 November 2026. The pages are implemented locally; no deployment or changes to provider settings were made.

## Owner decisions and adopted launch rules

The owner identified the legal operator as **Samiati**, confirmed **Kenya** as the operating country, and authorized `hasb8882@gmail.com` as the current public contact. Both policies explicitly identify Samiati as the operator, without adding an unprovided corporate suffix or claiming registration status. The owner asked for suitable age, refund, and contribution rules to be established. The updated policies adopt:

- **18+ launch:** adults only for accounts, guest interactive features, waitlist, purchases, and contributions; no parental-permission exception or child/school account program at launch. This is a service decision while verified parental-consent handling is unavailable, not a statement that Kenyan law bans every under-18 service.
- **First-payment refund:** a full refund of the first successful paid subscription payment requested within seven calendar days, once per customer, with no reason or usage threshold. Paid access ends on refund. Renewals, upgrades, and later purchases do not reset this voluntary guarantee. Mandatory rights and remedies for incorrect, duplicate, unauthorized, post-cancellation, or unprovided-service charges remain available outside that window. Refunds are handled through the contact email and the payment provider; no automatic refund function was added.
- **Changa:** affirmative internal training and evaluation consent, separate from general terms and ordinary app use. Additional research, commercial use (including use in a paid tool), commercial licensing, public datasets, and named attribution require a separate, specific grant. Existing consent is not expanded retroactively. Withdrawal requests use the contact email and apply to future consent-based use, with individual assessment of existing copies and models.
- **Kenyan law:** competent Kenyan courts, preserving mandatory consumer rights and lawful forums elsewhere. No compulsory arbitration or shortened claim period.

Official sources checked for these decisions:

- [Age of Majority Act, section 2](https://new.kenyalaw.org/akn/ke/act/1974/1/eng%401974-04-05/source).
- [ODPC guidance on children's data](https://www.odpc.go.ke/wp-content/uploads/2025/11/ODPC-%E2%80%93-Guidance-Note-for-Processing-Childrens-Data.pdf).
- [Consumer Protection Act, particularly internet agreements and statutory cancellation rights](https://new.kenyalaw.org/akn/ke/act/2012/46/eng%402022-12-31/source). The seven-day discretionary guarantee is an additional business promise, not an exhaustive statement of Kenyan cancellation rights or a limit on longer statutory rights.
- [Data Protection Act, sections 32–33](https://new.kenyalaw.org/akn/ke/act/2019/24/eng%402022-12-31/source) and [ODPC consent guidance](https://www.odpc.go.ke/wp-content/uploads/2024/02/ODPC-Guidance-Notes-on-Consent.pdf).

## Documents and integration

- Public pages: `/privacy-policy` and `/terms-of-service`; explicitly allowed by `src/proxy.ts` before authentication.
- Existing `/dashboard/privacy-policy` and `/dashboard/terms-of-service` screens reuse the same content.
- Policy source: `src/components/legal/legal-content.tsx`. Update its fixed revision and effective dates when adopting a later revision.
- Links are available on the waitlist/home page, sign-in, sign-up, checkout, and existing settings screens.

## Reference material

T3 Chat was used as a coverage and organization reference. The wording is original and tailored to the inspected Samiati implementation. T3's company identity, California venue, mandatory arbitration, age threshold, provider list, and data-training promises were not adopted.

- [T3 Chat Privacy Policy](https://t3.chat/privacy-policy), reviewed 8 November 2026.
- [T3 Chat Terms of Service](https://t3.chat/terms-of-service), reviewed 8 November 2026.
- [Kenya ODPC: rights of a data subject](https://odpc.go.ke/rights-of-a-data-subject/index.html) and [data protection framework](https://www.odpc.go.ke/data-protection-laws-kenya/), reviewed for conditional rights language, rather than a claim that all jurisdictions have identical rights.
- Provider notices linked in the policy: [Clerk](https://clerk.com/legal/privacy), [Hugging Face](https://huggingface.co/privacy), [Vercel Analytics](https://vercel.com/docs/analytics/privacy-policy), and [Google](https://policies.google.com/privacy). A general notice does not establish Samiati's particular contractual retention or transfer arrangements.

## Business details to settle before publication

| Detail | Current treatment | Decision needed |
| --- | --- | --- |
| Legal operator and postal address | Identifies Samiati as the operator, based in Kenya, with `hasb8882@gmail.com`, as confirmed by the owner. | A mailing address has not been supplied. Add it when available. No corporate suffix, registration number, or registration status has been asserted. |
| Support contact | Uses the owner's confirmed `hasb8882@gmail.com` in the policies, footer, pricing, and contribution withdrawal notices. | Monitor the mailbox for privacy, cancellation, refunds, and complaints. No email was sent or mailbox connection configured. |
| Minimum age | Adopted 18+; signup and waitlist display the rule. | These notices are not verified age checks. Configure suitable age assurance and handling of suspected child accounts before launch. No date of birth or identity document collection was added. |
| Governing law | Adopted Kenyan law with competent Kenyan courts and preservation of mandatory rights elsewhere; Samiati is the named operator. | Keep these terms consistent with any later change of operator or organizational agreement. |
| Refunds and cancellations | Adopted seven-day first-payment guarantee and manual email request route; statutory rights preserved. Checkout shows the guarantee. | Establish operational refund handling and fix the processor-cancellation gap below. No automated refunds or end-of-period access logic was added. |
| Liability allocation | No monetary cap, blanket indemnity, compulsory arbitration, or class-action waiver. | Decide whether additional business terms are appropriate for the legal operator and markets. |
| Infrastructure and transfers | Names integrations supported by code, with conditional Sentry and SMS wording. No fixed hosting-country or zero-retention claims. | Confirm deployed providers, processing locations, contracts, transfer safeguards, inference-provider retention/training settings, and actual diagnostic instrumentation. |
| Retention | Explains purpose-based retention and differences between browser, backend, provider, and contribution copies. | Adopt operational retention periods and backup deletion procedures by data category. |
| Changa licensing | Adopted internal training only as the standard grant; other uses require specific additional permission. Labels and new correction metadata align with that grant. | Reconcile any already published consent-policy text/summary and existing templates with the new wording before adoption. Deploying a model in a paid tool needs the additional commercial-use grant described in the policy. Do not retroactively change existing consent. |
| Adoption and notice | Fixed revision dates and a sign-up notice; contribution consent remains separate. | Confirm the effective date at launch, notice existing users, and decide how acceptance of new terms should be recorded. These pages do not themselves implement consent or acceptance tracking. |

## Implementation gaps found during the audit

These are follow-up engineering work, not fixes performed as part of writing the pages. The policy avoids promising the missing behavior.

1. **Account erasure is incomplete.** `src/app/dashboard/settings/data/page.tsx` opens Clerk's account panel. No Clerk `user.deleted` cleanup integration was found. `convex/users/mutations.ts` has partial cleanup, but not a complete removal of messages, uploaded blobs, feedback, billing, consent/review/curation copies, or all other account-related tables. Implement coordinated deletion across Clerk, Convex records, storage, and relevant providers; preserve only justified exceptions and clear browser-local data separately.
2. **The export is partial.** `convex/users/queries.ts` exports selected profile and social data, excluding browser chats and some server categories. Extend access/export handling to DMs, Changa, feedback, billing, and usage where appropriate. The page explicitly calls the existing tool a selected-data export.
3. **Withdrawal does not reach every derivative.** `convex/changa/consent.ts` marks a submission withdrawn, but does not itself delete uploads, retract curated copies, or remove existing dataset release memberships. `convex/changa/curation.ts` needs scope/revocation checks across curation and export. Establish handling of already shared datasets and trained models, and a support process for specific requests.
4. **General consent preferences are not withdrawal controls.** Account `voiceDataAllowed` and `culturalDataAllowed` flags are stored, but were not found enforced throughout Changa. Do not imply changing a switch automatically revokes prior submission permissions. Align the settings labels, submission pipeline, consent records, and curation/export checks.
5. **Changa wording alignment was corrected in this update.** Quick contributions and correction promotion now describe storage, peer validation, and internal training, excluding research and wider uses. Both still submit `allowResearch: false` and `allowPublicAttribution: false`. Restored task drafts no longer preselect training consent. Newly promoted corrections use `license: "internal"`, and new correction template metadata no longer lists research as a required scope. Existing stored templates, published summaries, and consent records were not rewritten; review those separately. General policies do not enlarge an earlier grant.
6. **Cancellation is not wired through to Paystack.** The public cancellation mutation in `convex/payments/billing.ts` marks a subscription canceled without calling the internal subscription-disable action in `convex/payments/paystack.ts`. Plan access can revert immediately. Align processor cancellation, effective dates, access, confirmation, and pricing FAQ wording before relying on self-service cancellation.
7. **Displayed quotas and enforced windows differ.** Pricing, hourly/daily AI controls, and calendar-month usage counters use different measures. Keep the actual purchase disclosures consistent with enforcement; the Terms deliberately avoid freezing numerical quotas into legal prose.
8. **Review checkout identity.** `src/components/CheckoutForm.tsx` currently passes `user@example.com` into payment initialization. Confirm the server uses the verified account email and that receipts and provider records are associated with the right customer.

## Source evidence

- Accounts/profiles: `convex/schema.ts`, `convex/users/mutations.ts`, `convex/profile/queries.ts`, `src/lib/accountSettings.ts`.
- Chats/AI/voice: `src/services/localConversationService.ts`, `src/app/dashboard/page.tsx`, `convex/sunflower.ts`, `convex/translate.ts`, `convex/asr.ts`, `convex/tts.ts`.
- Contributions: `convex/changa/submissions.ts`, `convex/changa/consent.ts`, `convex/changa/curation.ts`, `convex/changa/validation.ts`, `src/components/changa/TaskContributionScreen.tsx`.
- Feedback: `convex/feedback.ts`, `src/components/feedback/PromoteFeedbackDialog.tsx`.
- Waitlist/local storage: `convex/waitlist/`, `src/lib/visitorId.ts`, `src/lib/settings.ts`, `src/lib/changaTelemetry.ts`.
- Providers: `src/app/layout.tsx`, `sentry.*.config.ts`, `convex/payments/paystack.ts`, `convex/sms.ts`, `src/app/api/sms/send/route.ts`, `src/app/api/wiki/route.ts`.

An unused Cloudflare R2 helper and legacy M-Pesa environment examples were not treated as confirmed live processors. Direct messages were not described as end-to-end encrypted. Secret environment values were not inspected.

## Verification

- `npm run build`: passed, including TypeScript and static generation of both public and existing dashboard routes.
- `npm test`: all 81 existing tests passed across seven files.
- Targeted ESLint: passed for the new legal components/pages and all files touched for policy integration.
- Prettier: passed for the new legal files and rewritten policy screens.
- Inspected production HTML for both public pages: correct page titles and dates, one main landmark and H1 each, 16 privacy sections and 19 terms sections, unique element IDs, valid local contents anchors, and the support link.
- No visual browser review or deployment was performed.
