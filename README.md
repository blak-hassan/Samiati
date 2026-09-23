# Samiati — Preserving African Languages & Digital Storytelling

Samiati is a community-driven platform for African language preservation, learning, and crowdsourced data collection. It combines AI-powered chat, voice practice, and the **Changa** contribution system to build ML-ready corpora for underrepresented African languages.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript 5
- **UI:** shadcn/ui (New York), Tailwind CSS v4, Radix UI primitives
- **Backend / Database:** Convex (real-time reactive DB + serverless functions)
- **Auth:** Clerk
- **AI / Inference:** HuggingFace Inference API + Sunflower-Gemma4-E2B
- **Storage:** Convex file storage (Changa audio/image assets)
- **Payments:** Paystack
- **Observability:** Sentry, Vercel Analytics

## Getting Started

### Prerequisites

- Node.js 20.9.0+ (required by Next.js 16)
- npm or pnpm

### Environment Variables

Create a `.env.local` in the project root. The app runs in **demo mode** (using mock providers) when `NEXT_PUBLIC_CONVEX_URL` or `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is missing, so those two are the only strictly required keys for a local UI run — everything else is needed for the corresponding production feature.

Grouped by feature (use the project's established variable names):

```bash
# Core
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Convex (real-time database + serverless functions) — required
NEXT_PUBLIC_CONVEX_URL=<your-convex-deployment-url>

# Clerk (authentication) — required
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_ISSUER_URL=https://<your-clerk-domain>

# AI / Inference (HuggingFace — Sunflower-Gemma4-E2B)
HUGGINGFACE_API_KEY=<your-hf-token>

# Payments (Paystack)
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...

# M-Pesa / Daraja (optional — Kenyan payments)
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_PASSKEY=
MPESA_SHORTCODE=

# SMS (Twilio — optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
SMS_WEBHOOK_SECRET=
```

### Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (Clerk + Convex providers)
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Tailwind v4 theme + animations
│   └── dashboard/          # Authenticated app shell
│       ├── page.tsx        # Main hub (HomeSearchScreen)
│       ├── layout.tsx      # AuthGuard wrapper
│       └── changa/         # Changa routes
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── changa/             # Changa-specific UI
│   ├── screens/            # Full-page screen components
│   ├── shared/             # AppSidebar, MobileAppLayout, etc.
│   ├── landing/            # Navbar, FeatureCard, TestimonialCard
│   └── ...
├── hooks/                  # useNavigation, useToast, useSettings
├── lib/                    # Utils, schemas, constants, appMode
├── services/               # xpService, sunflowerService
└── types.ts                # Central TypeScript types
convex/
├── schema.ts               # Database schema (~910 lines, 30+ tables)
└── changa/                 # Changa backend module
    ├── validators.ts
    ├── tasks.ts
    ├── submissions.ts
    ├── validation.ts
    ├── campaigns.ts
    ├── reputation.ts
    └── ...
```

## Key Modules

### Changa (Community Contribution)

Changa gamifies the crowdsourced collection and validation of African language data.

- **Task Pipeline:** Versioned task templates → claiming → submission → blind validation
- **Gamification:** XP, levels, streaks, badges, validation calibration
- **Campaigns:** Time-bound community goals with reward profiles
- **Reputation:** Granular roles (`new_contributor` → `verified_expert`)
- **Consent:** Explicit scopes for voice, cultural data, and attribution

### AI Chat & Search

- "Kaanze" multi-language AI chat interface
- Real-time search with Wikipedia + Wikimedia Commons
- Conversation history, voice messages, translation

### Social / Community

- Posts, comments, communities, direct messages
- Proverbs, stories, songs, history content cards

## Development

### Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npm test             # Vitest (unit tests)
npm run test:e2e     # Playwright end-to-end, accessibility, and validation specs
```

### End-to-End & Accessibility Tests

The `e2e/` directory contains Playwright browser specs:

- `changa.spec.ts` — Changa contribution flow
- `validation.spec.ts` — community review / validation runner
- `a11y.spec.ts` — accessibility (axe-core) and skip-link navigation

**Test environment setup:**

1. Install the Playwright browsers once:
   ```bash
   npx playwright install --with-deps
   ```
2. Start a running app instance the specs can target. By default the specs hit `http://localhost:3000`, so run `npm run dev` (or `npm run build && npm start`) in another terminal, or set `BASE_URL` to point at a deployed preview.
3. The accessibility spec (`a11y.spec.ts`) runs axe-core via `@axe-core/playwright`; ensure the dev server is up so the pages can be scanned.
4. Run the suite headless with `npm run test:e2e` (or `npx playwright test` for more control, e.g. `--headed` or `--project=chromium`).

### Demo Mode

When `NEXT_PUBLIC_CONVEX_URL` or `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is missing, the app runs in demo mode using mock providers. This is useful for UI development without a backend.

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Ensure `npm run lint` and `npm run typecheck` pass
5. Submit a pull request

## License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for the full text.
