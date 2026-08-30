# Samiati — Preserving African Languages & Digital Storytelling

Samiati is a community-driven platform for African language preservation, learning, and crowdsourced data collection. It combines AI-powered chat, voice practice, and the **Changa** contribution system to build ML-ready corpora for underrepresented African languages.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript 5
- **UI:** shadcn/ui (New York), Tailwind CSS v4, Radix UI primitives
- **Backend / Database:** Convex (real-time reactive DB + serverless functions)
- **Auth:** Clerk
- **AI / Inference:** HuggingFace Inference SDK + Sunflower-Gemma4-E2B
- **Storage:** AWS S3
- **Payments:** Paystack
- **Observability:** Sentry, Vercel Analytics

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Environment Variables

Create a `.env.local` in the project root:

```bash
NEXT_PUBLIC_CONVEX_URL=<your-convex-url>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
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
npm test             # Vitest
```

### Demo Mode

When `NEXT_PUBLIC_CONVEX_URL` or `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is missing, the app runs in demo mode using mock providers. This is useful for UI development without a backend.

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Ensure `npm run lint` and `npm run typecheck` pass
5. Submit a pull request

## License

[Add license here]
