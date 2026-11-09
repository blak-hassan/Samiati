# Samiati Pre-Launch Web App Implementation Plan

**Project:** Samiati  
**Purpose:** Pre-launch quality, security, accessibility, performance, SEO, reliability, and growth checklist  
**Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, Convex, Clerk, Google GenAI, Hugging Face, Paystack  
**Priority:** Security → Legal/Privacy → Core UX → SEO → Performance → Analytics/Growth

---

## 1. Executive Goal

Before launching Samiati publicly, the application should be:

- Secure against common web/API abuse.
- Safe for user conversations and Changa contributions.
- Reliable when AI providers fail or become slow.
- Mobile-first and usable on low-end Android devices.
- Accessible and readable.
- Search-engine and social-share ready.
- Payment-safe.
- Measurable through privacy-conscious analytics.
- Clear about AI limitations and user-generated data.

The goal is not to implement every possible feature before launch. The goal is to remove launch-blocking risks while keeping the product simple.

---

# 2. Master Launch Checklist

## Security

- [ ] Remove all secrets from frontend/client code.
- [ ] Confirm AI API keys are server-side only.
- [ ] Confirm Hugging Face tokens are server-side only.
- [ ] Confirm Paystack secret key is server-side only.
- [ ] Confirm Clerk secret credentials are server-side only.
- [ ] Audit Convex authorization rules.
- [ ] Verify users cannot access another user's conversations.
- [ ] Verify users cannot modify another user's Changa submissions.
- [ ] Add server-side input validation.
- [ ] Add server-side rate limiting.
- [ ] Add AI usage quotas.
- [ ] Add upload size/type restrictions.
- [ ] Force HTTPS in production.
- [ ] Add appropriate security headers.
- [ ] Review authentication/session behavior.

## Legal & Privacy

- [ ] Create `/privacy`.
- [ ] Create `/terms`.
- [ ] Document what user data Samiati collects.
- [ ] Document how conversations are handled.
- [ ] Document voice/audio handling.
- [ ] Document Changa contribution usage.
- [ ] Explain whether contributions may be used for model improvement.
- [ ] Explain data retention.
- [ ] Provide a contact mechanism.
- [ ] Implement appropriate cookie/consent behavior if required.
- [ ] Provide account/data deletion functionality.

## SEO

- [ ] Add page titles.
- [ ] Add meta descriptions.
- [ ] Add Open Graph metadata.
- [ ] Create social preview image.
- [ ] Add favicon/app icons.
- [ ] Generate sitemap.
- [ ] Generate robots.txt.
- [ ] Prevent private pages from being indexed.
- [ ] Add public language pages where useful.

## Accessibility & Mobile

- [ ] Test 360px width.
- [ ] Test 375px width.
- [ ] Test 390px width.
- [ ] Test 412px width.
- [ ] Test tablet.
- [ ] Test desktop.
- [ ] Check text contrast.
- [ ] Add useful alt text.
- [ ] Ensure keyboard navigation works.
- [ ] Ensure form labels are accessible.
- [ ] Ensure errors are understandable.
- [ ] Ensure touch targets are sufficiently large.
- [ ] Test chat input when Android keyboard opens.
- [ ] Test audio recording on mobile.

## Reliability

- [ ] Create custom 404 page.
- [ ] Test all internal links.
- [ ] Test authentication failure states.
- [ ] Test AI provider failure states.
- [ ] Test AI timeout states.
- [ ] Add retry behavior where appropriate.
- [ ] Add empty states.
- [ ] Add loading states.
- [ ] Add error logging/monitoring.
- [ ] Test payment failure states.

## Performance

- [ ] Optimize images.
- [ ] Use Next.js image optimization.
- [ ] Lazy-load noncritical content.
- [ ] Reduce unnecessary client-side JavaScript.
- [ ] Check bundle size.
- [ ] Test landing page performance.
- [ ] Test chat performance.
- [ ] Test Discover performance.
- [ ] Test Changa performance.
- [ ] Optimize AI loading UX.

## Analytics

- [ ] Define key events.
- [ ] Track landing-page conversion.
- [ ] Track first translation.
- [ ] Track successful translations.
- [ ] Track translation failures.
- [ ] Track language selection.
- [ ] Track Changa engagement.
- [ ] Track feedback.
- [ ] Track subscription funnel.
- [ ] Avoid sending private conversation text to analytics.

---

# 3. Phase 1 — Security

This is the highest priority.

## 3.1 Secrets

The browser must never receive private API credentials.

Bad architecture:

```text
Browser
  ↓
Google AI API
Hugging Face API
Paystack secret
```

Preferred architecture:

```text
Browser
  ↓ HTTPS
Next.js server/API
  ↓
Convex / AI providers / Paystack
```

Environment variables should contain server-side secrets.

Example:

```env
GOOGLE_API_KEY=...
HF_TOKEN=...
PAYSTACK_SECRET_KEY=...
CLERK_SECRET_KEY=...
```

Do not expose secrets using `NEXT_PUBLIC_`.

Search the entire repository for:

- API keys
- bearer tokens
- private tokens
- service keys
- secret URLs
- credentials

---

## 3.2 Convex Authorization

Every database operation involving private data must verify the current authenticated user.

Test:

```text
User A
  ↓
Conversation A

User B
  ↓
Conversation B
```

Attempt to access Conversation A using User B.

Expected result:

```text
ACCESS DENIED
```

Repeat this test for:

- conversations
- profiles
- Changa submissions
- audio
- feedback
- private settings
- subscriptions

Never trust an ID supplied by the browser.

---

## 3.3 Authentication

Audit Clerk integration.

Test:

- Sign up.
- Sign in.
- Sign out.
- Invalid login.
- Session expiration.
- Protected route access.
- Direct access to private URLs.
- Account deletion.
- Multiple accounts.

Private pages should redirect unauthenticated users appropriately.

---

## 3.4 Server-Side Validation

Validate all incoming data.

Examples:

```text
translation text
language code
conversation ID
Changa submission
audio file
comment
feedback
payment reference
```

Never assume browser validation is sufficient.

---

## 3.5 Rate Limiting

Rate-limit expensive or abuse-prone operations.

At minimum:

```text
AI translation requests
AI chat requests
ASR requests
TTS requests
Changa submissions
Comments
Likes
Feedback
Audio uploads
Authentication attempts
```

For example:

```text
Free user
→ limited requests/day

Paid user
→ larger allowance

Abuse
→ temporarily blocked
```

All quotas must be enforced server-side.

---

# 4. Phase 2 — Changa Protection

Changa is not just another form. It is a future data-generation pipeline.

## 4.1 Submission validation

Validate:

- selected language
- translation text
- source text
- audio format
- audio duration
- audio size
- duplicate submissions
- authenticated user

Example:

```text
English:
How are you?

Sheng:
Uko aje?

Audio:
[Sheng recording]
```

---

## 4.2 Contribution consent

Before submission, clearly explain:

- what is being collected
- why it is collected
- whether it can improve Samiati models
- whether it may become part of a dataset
- whether the contribution can be publicly displayed
- how contributor recognition works

Do not hide this in dense legal text.

---

## 4.3 Moderation

Add a moderation pipeline.

```text
User submission
      ↓
Validation
      ↓
Spam/duplicate check
      ↓
Safety/moderation check
      ↓
Human review when necessary
      ↓
Approved dataset
```

Do not immediately assume every contribution belongs in a training dataset.

---

# 5. Phase 3 — Legal & Privacy

## 5.1 Privacy page

Create:

```text
/privacy
```

Cover:

- account information
- conversations
- translations
- voice/audio
- Changa
- uploaded files
- analytics
- cookies
- authentication providers
- AI providers
- payment provider
- data retention
- deletion
- contact information

The policy should accurately describe what Samiati actually does. Do not claim that data is deleted, encrypted, stored locally, or never used for training unless the implementation guarantees it.

---

## 5.2 Terms page

Create:

```text
/terms
```

Cover:

- acceptable use
- AI limitations
- translation accuracy
- user-generated content
- Changa contributions
- moderation
- account termination
- subscriptions
- refunds
- payments
- intellectual property
- service availability
- liability limitations

Get the final legal text reviewed appropriately before commercial launch.

---

# 6. Phase 4 — SEO

## 6.1 Metadata

Create unique metadata for important public pages.

Example:

```text
Samiati — AI Translation for African Languages
```

Pages:

```text
/
/pricing
/faq
/about
/changa
/discover
/languages
/privacy
/terms
```

---

## 6.2 Language SEO

Eventually create public pages such as:

```text
/languages/kikuyu
/languages/dholuo
/languages/kalenjin
/languages/luhya
/languages/kamba
/languages/somali
/languages/swahili
/languages/sheng
```

These can explain:

- the language
- Samiati support
- translation capabilities
- contribution opportunities
- cultural/localization focus

Do not create thin duplicate pages solely for SEO.

---

## 6.3 Social preview

Create a dedicated Open Graph image.

Concept:

```text
SAMIATI

AI that speaks Africa.

Translate • Chat • Discover • Contribute
```

Test sharing through WhatsApp and major social platforms.

---

# 7. Phase 5 — Accessibility & Mobile

Samiati is mobile-first.

## 7.1 Mobile testing

Test:

```text
360px
375px
390px
412px
768px
1024px
1440px
```

Prioritize:

- chat
- language selector
- voice recording
- Discover
- Changa
- pricing
- authentication
- profile
- settings

---

## 7.2 Low-end Android testing

Do not optimize only for a modern developer laptop.

Test:

- slow network
- low RAM
- older Android device
- mobile browser
- keyboard open
- microphone permissions
- interrupted network

A user should see useful feedback instead of a frozen screen.

---

## 7.3 Accessibility

Check:

- color contrast
- text size
- focus states
- keyboard navigation
- screen-reader labels
- form labels
- button names
- error messages
- audio controls

Use semantic HTML wherever possible.

---

# 8. Phase 6 — Reliability

## 8.1 AI provider failures

AI services will sometimes fail.

Handle:

```text
timeout
rate limit
provider outage
invalid response
malformed response
network failure
model unavailable
```

Instead of:

```text
Something went wrong.
```

Use a useful message:

```text
Samiati couldn't complete the translation right now.
Please try again in a moment.
```

---

## 8.2 Loading states

AI interactions should immediately communicate progress.

Example:

```text
User sends message
       ↓
Translating...
       ↓
Thinking...
       ↓
Translating response...
       ↓
Answer
```

Do not expose unnecessary technical model/provider details to normal users.

---

## 8.3 Custom 404

Create a Samiati-branded 404.

Example:

```text
This page got lost.

The page you're looking for doesn't exist.

[Back to Samiati]
```

---

# 9. Phase 7 — Performance

## 9.1 Images

Use optimized formats and Next.js image optimization.

Avoid unnecessarily large:

```text
PNG
JPEG
GIF
```

Use modern formats where appropriate.

---

## 9.2 JavaScript

Avoid loading every Samiati feature on every page.

For example, the landing page should not unnecessarily load:

```text
Changa logic
Discover feed
chat engine
payment components
admin tools
```

Use route-level loading and code splitting.

---

## 9.3 AI perceived performance

Even if the model takes several seconds, make the interface feel responsive.

Show:

```text
Sending...
Translating...
Thinking...
```

Use streaming where appropriate.

---

# 10. Phase 8 — Analytics

Analytics should answer business and product questions.

## Funnel

```text
Visitor
   ↓
Landing page
   ↓
Try Samiati
   ↓
Select language
   ↓
First translation
   ↓
Second translation
   ↓
Sign up
   ↓
Return
   ↓
Changa
   ↓
Subscription
```

## Events

Recommended events:

```text
language_selected
translation_started
translation_completed
translation_failed
voice_started
voice_completed
changa_opened
changa_started
changa_submitted
feedback_given
discover_opened
signup_completed
subscription_started
subscription_completed
```

Do not send actual private conversation content to analytics.

---

# 11. Samiati-Specific Product Improvements

The generic 20-point checklist should be expanded for Samiati.

## AI quality feedback

Every answer should eventually support:

```text
👍 Good translation
👎 Bad translation
Suggest correction
Report issue
```

This creates a quality-improvement loop:

```text
User
 ↓
Translation
 ↓
Feedback
 ↓
Quality data
 ↓
Review
 ↓
Dataset
 ↓
Fine-tuning
 ↓
Better model
 ↓
Better Samiati
```

---

## AI uncertainty

Samiati should eventually communicate uncertainty when appropriate.

Example:

```text
Samiati isn't fully confident in this translation.
```

This is preferable to presenting an uncertain translation as unquestionably correct.

---

# 12. Payments

For Paystack:

```text
User
 ↓
Samiati server
 ↓
Payment initialization
 ↓
Paystack
 ↓
Payment
 ↓
Webhook/server verification
 ↓
Samiati subscription updated
```

Never treat:

```text
payment_success = true
```

from the browser as sufficient proof of payment.

Verify transactions server-side.

Test:

- successful payment
- failed payment
- cancelled payment
- duplicate webhook
- delayed webhook
- expired transaction
- wrong amount
- wrong plan

---

# 13. Recommended Samiati Application Structure

```text
SAMIATI
│
├── Public
│   ├── Landing
│   ├── Pricing
│   ├── FAQ
│   ├── About
│   ├── Languages
│   ├── Privacy
│   ├── Terms
│   └── 404
│
├── Authentication
│   ├── Sign in
│   ├── Sign up
│   └── Account recovery
│
├── Application
│   ├── Chat
│   ├── Discover
│   ├── Changa
│   ├── Profile
│   └── Settings
│
├── AI
│   ├── Translation
│   ├── Reasoning
│   ├── ASR
│   ├── TTS
│   └── Moderation
│
├── Data
│   ├── Convex
│   ├── Conversations
│   ├── Feedback
│   ├── Changa
│   └── Profiles
│
└── Infrastructure
    ├── Clerk
    ├── Paystack
    ├── Rate limiting
    ├── Analytics
    ├── Monitoring
    └── Security
```

---

# 14. Launch Gates

Samiati should not launch publicly until these are passing.

## Gate 1 — Security

```text
[ ] No exposed secrets
[ ] Convex authorization tested
[ ] Authentication tested
[ ] Rate limits working
[ ] Input validation working
[ ] Payment verification working
[ ] HTTPS working
```

## Gate 2 — User experience

```text
[ ] Mobile UI works
[ ] Chat works
[ ] Language selection works
[ ] AI errors handled
[ ] Loading states work
[ ] Changa works
[ ] Navigation works
```

## Gate 3 — Legal/privacy

```text
[ ] Privacy Policy
[ ] Terms
[ ] Changa contribution terms
[ ] Data deletion process
[ ] Cookie/consent requirements addressed
```

## Gate 4 — Performance

```text
[ ] Images optimized
[ ] Core pages tested
[ ] Low-end Android tested
[ ] Slow network tested
[ ] AI latency UX tested
```

## Gate 5 — Growth

```text
[ ] Analytics
[ ] Conversion funnel
[ ] Feedback
[ ] Error monitoring
[ ] Subscription tracking
```

---

# 15. Priority Matrix

## P0 — Must fix before public launch

```text
Security vulnerabilities
Exposed API keys
Broken authentication
Broken authorization
Payment verification
Missing critical validation
No rate limits on expensive AI endpoints
HTTPS
Critical privacy/legal issues
Application-breaking bugs
```

## P1 — Should complete before launch

```text
Mobile responsiveness
AI failure handling
404
Metadata
Sitemap
Robots
Favicon
Social preview
Accessibility basics
Analytics
Image optimization
```

## P2 — Can improve after launch

```text
Advanced SEO
Advanced gamification
Advanced recommendation engine
Advanced personalization
Offline mode
Advanced social features
Complex contributor ranking
Advanced AI quality dashboards
```

---

# 16. Final Launch Sequence

Follow this order:

```text
1. Backup code/data
        ↓
2. Security audit
        ↓
3. Fix authentication/authorization
        ↓
4. Move/verify secrets
        ↓
5. Add validation + rate limits
        ↓
6. Secure Paystack
        ↓
7. Privacy + Terms
        ↓
8. Mobile/accessibility pass
        ↓
9. Error/loading states
        ↓
10. SEO setup
        ↓
11. Performance optimization
        ↓
12. Analytics
        ↓
13. Production testing
        ↓
14. Soft launch
        ↓
15. Monitor
        ↓
16. Public launch
```

---

# 17. Definition of Done

Samiati is launch-ready when a new user can:

```text
Open Samiati
    ↓
Understand what it does
    ↓
Choose a language
    ↓
Start translating/chatting
    ↓
Receive a useful response
    ↓
Recover gracefully from an error
    ↓
Create an account
    ↓
Use Changa
    ↓
Give feedback
    ↓
Understand how their data is used
    ↓
Upgrade safely if desired
```

while the system can:

```text
Protect user data
Protect API credentials
Prevent abuse
Validate input
Verify payments
Handle AI failures
Measure product usage
Monitor errors
Scale gradually
```

The key principle is:

**Do not launch Samiati merely because the UI looks finished. Launch when the entire user → AI → data → payment → feedback pipeline is safe and reliable.**
