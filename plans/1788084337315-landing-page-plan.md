# Samiati Landing Page — Technical Implementation Plan

**Date:** 2026-08-30
**Status:** Implementation-Ready
**Goal:** Replace the current `/` placeholder ("Coming Soon") with a full marketing landing page that introduces Samiati, showcases its value proposition, drives sign-ups, and maintains consistency with the existing app design system.

---

## 1. Current State Assessment

| Aspect | Current State |
|---|---|
| Home page (`/`) | Minimal "Coming Soon" placeholder. Current copy uses "Darasa" branding, but "Darasa" is actually an in-app feature/screen (`Screen.DARASA`, `DarasaScreen`, AppSidebar label). The product name is **Samiati** per `metadata.json`. The placeholder is outdated. |
| Branding | `SamiatiLogo` SVG component exists at `src/components/SamiatiLogo.tsx`. Variants: `primary` (white text, intended for dark backgrounds), `white` (white text), `dark` (dark text `#1a1a1a` for light backgrounds). |
| Post-auth redirect | Both `/sign-in` and `/sign-up` redirect to `/dashboard` after successful auth. |
| Legal pages | `TermsOfServiceScreen` and `PrivacyPolicyScreen` exist, but their routes (`/dashboard/terms-of-service`, `/dashboard/privacy-policy`) are inside the dashboard layout, which is wrapped in `AuthGuard`. They are **not publicly accessible**. |
| Dark mode | Root `<html>` in `layout.tsx` hardcodes `className="dark"`. The app defaults to dark mode. Light mode colors exist in the theme but are not the default. |
| Pricing page | `/pricing` exists with `PricingCard` and a 4-tier FAQ section. Uses `"use client"`. Organization tier CTA uses `mailto:support@samiati.com`. |
| Routing | App Router (`src/app/`). Root `layout.tsx` wraps all routes in `ConvexClientProvider` + `Analytics`. |
| Styling | Tailwind CSS v4 via `@tailwindcss/postcss`, theme in `globals.css`, Rasta color palette (red, gold, green) + brown heritage accents, dark mode via `.dark` class. |
| Design system | shadcn/ui (New York style) on Radix primitives. `cn()` utility, CVA variants, `lucide-react` icons. |
| Data fetching | Convex + Clerk for app routes. Landing page should be **public and unauthenticated** — no providers needed. |

---

## 2. Landing Page File Structure

```
src/app/
├── layout.tsx                         # Root layout (unchanged)
├── page.tsx                           # REPLACE with new LandingPage
├── globals.css                        # Unchanged (theme, animations)
└── ConvexClientProvider.tsx           # Unchanged
```

No new directories or route groups required. The landing page sits at `/` and should be a **Server Component by default** (no `"use client"`) to keep it fast, with client-side interactivity isolated to specific sub-components if needed (e.g., animated counters, FAQ accordion).

---

## 3. Reusable Components to Leverage

| Component | Path | Usage |
|---|---|---|
| `SamiatiLogo` | `src/components/SamiatiLogo.tsx` | Hero section logo/wordmark. Use `variant="primary"` for dark backgrounds, `variant="dark"` for light. |
| `PricingCard` | `src/components/PricingCard.tsx` | Embed or adapt the pricing tier cards from `/pricing` into the landing page pricing section. |
| `Button` | `src/components/ui/button.tsx` | CTAs (Sign Up, Get Started, Learn More). Use existing CVA variants. |
| `Card` | `src/components/ui/card.tsx` | Feature highlight cards, testimonial cards. |
| `Badge` | `src/components/ui/badge.tsx` | "New", "Popular", or status indicators. |
| `Separator` | `src/components/ui/separator.tsx` | Section dividers. |
| `lucide-react` icons | npm dependency | Feature icons, navigation arrows, checkmarks, decorative elements. |

**No new UI primitives needed.** All visual building blocks already exist.

---

## 4. Landing Page Sections (Proposed)

The page should follow a standard SaaS/marketing structure, adapted to Samiati's cultural/educational mission. **Critical branding note:** Use "Samiati" throughout. "Darasa" is an in-app learning screen, not the product name.

1. **Navigation Bar** — Sticky, minimal. Logo (left), "Sign In" + "Get Started" buttons (right). Link to `/pricing`. Dark-mode-aware (app defaults to dark).
2. **Hero Section** — Large headline, subheadline, primary CTA ("Start Learning Free" → `/sign-up`), secondary CTA ("See Pricing" → `/pricing`). `SamiatiLogo` centered or top-left. Background with subtle Rasta/gradient accents.
3. **Social Proof / Trust Strip** — Short stats (e.g., "10,000+ words preserved", "50+ languages"). Static copy for launch.
4. **Features Grid** — 3–6 cards explaining core value props. Use `Card` + `lucide-react` icons.
5. **How It Works** — 3-step visual (Sign Up → Choose Language → Start Exploring).
6. **Pricing Preview** — Condensed 3-tier pricing (Explorer / Learner / Fluent) using `PricingCard` or a simplified variant. "Organization" can be omitted or shown as "Contact Us" with `mailto:`.
7. **Testimonials** — 2–3 static quote cards.
8. **FAQ** — 4–6 common questions. **Decision needed:** Should this be an accordion (requires `"use client"` sub-component) or static sections?
9. **Final CTA** — Large centered banner with primary button to `/sign-up`.
10. **Footer** — Minimal. Copyright. **Decision needed:** Terms/Privacy links cannot point to `/dashboard/terms-of-service` or `/dashboard/privacy-policy` because they are behind `AuthGuard`. Options: omit links, create public versions, or accept redirect-to-sign-in behavior.

---

## 5. Styling & Design Decisions

### Dark Mode
- Root `<html>` hardcodes `className="dark"` in `layout.tsx`. The landing page **must be designed for dark mode by default**. Light mode CSS variables exist but will not be active unless `dark` is removed from `<html>`.
- Do not remove `className="dark"` from `layout.tsx` without explicit approval — it affects every route.
- Use the existing dark palette: deep brown backgrounds (`#2b1e19`), warm stone text (`#FAFAF9`), brown accent (`#8B4513` via `--active-accent`).

### Typography
- **Display / Headings:** `font-display` (Outfit)
- **Body:** `font-body` (Be Vietnam Pro)
- **Accent / Buttons:** `font-accent` (Lexend) sparingly

### Animations
- Use existing keyframe utilities from `globals.css`: `animate-fade-in-up`, `animate-breathe-pulse`, `stagger-children`.
- Avoid adding new `@keyframes` unless absolutely necessary.

### Layout
- Mobile-first, max-width containers (`max-w-7xl mx-auto px-4`).
- Generous vertical spacing (`py-16`, `py-24`, `gap-8`, `gap-12`).
- Grid layouts for features and pricing (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).

---

## 6. Data Fetching & State Management

**The landing page must be fully static at launch.** No Convex queries, no Clerk auth, no client-side data fetching required.

- `page.tsx` should be a **Server Component** (no `"use client"`).
- CTAs use `<Link href="/sign-up">` or `<a href="/sign-up">` for navigation.
- Pricing CTA buttons can link to `/checkout?plan=...` or `/pricing`.
- If an FAQ accordion or mobile nav toggle is desired, isolate it in a small `"use client"` sub-component with local `useState`.

**If dynamic content is later needed** (e.g., blog posts, testimonials from Convex):
- Create a server component wrapper that fetches via `convex` server client or a Next.js API route.
- Keep the landing page `page.tsx` as a Server Component and pass data as props.

---

## 7. SEO & Metadata

Update `src/app/layout.tsx` metadata to reflect the full product:

```ts
export const metadata: Metadata = {
  title: "Samiati — Preserving African Languages & Digital Storytelling",
  description: "Explore, learn, and contribute to African language preservation with AI-powered chat, voice messages, and community challenges.",
  openGraph: {
    title: "Samiati",
    description: "Preserving African languages and digital storytelling",
    url: "https://samiati.com",
    siteName: "Samiati",
    type: "website",
  },
};
```

---

## 8. Step-by-Step Implementation Task List

1. **Update root `layout.tsx` metadata** — Ensure title and description reflect the full product.
2. **Replace `src/app/page.tsx`** — Remove the "Coming Soon" placeholder. Build the new landing page with the sections defined above.
3. **Create `src/components/landing/Navbar.tsx`** — Sticky nav with `SamiatiLogo` and auth CTAs. Keep minimal for mobile (no hamburger unless content demands it).
4. **Create `src/components/landing/FeatureCard.tsx`** — Reusable card for features grid. Props: `icon`, `title`, `description`.
5. **Create `src/components/landing/TestimonialCard.tsx`** — Quote card with static avatar, name, role.
6. **Create `src/components/landing/FAQAccordion.tsx`** (if accordion chosen) — `"use client"` component using `useState` for expand/collapse.
7. **Create public legal pages** (if chosen) — `src/app/terms/page.tsx` and `src/app/privacy/page.tsx` with static content copied from dashboard screens.
8. **Verify dark mode** — Test all sections in the default dark theme.
9. **Verify routing** — Ensure CTA links (`/sign-up`, `/pricing`, `/checkout`) resolve correctly.
10. **Run lint + build** — `npm run lint && npm run build` to catch TypeScript/Tailwind errors.
11. **Add placeholder images if needed** — Put any new static assets in `public/`.

---

## 9. Risks & Considerations

| Risk | Mitigation |
|---|---|
| **Dark mode lock-in** — Root `<html>` hardcodes `dark`. Light mode is not accessible without changing `layout.tsx`. | Design landing page for dark mode first. Do not remove `className="dark"` unless explicitly requested. |
| **Legal page links** — `/dashboard/terms-of-service` and `/dashboard/privacy-policy` are behind `AuthGuard`. | See open question below. Do not link to dashboard routes from a public page. |
| **Brand confusion** — "Darasa" is an in-app feature, not the product name. | Use "Samiati" consistently. The existing placeholder is outdated. |
| **Auth redirect loops** — Linking to `/sign-up` from a public page is fine (Clerk handles it). | Do not modify `layout.tsx` to add auth wrappers. Keep the landing page completely public. |
| **Future content changes** — Marketing copy is often updated. | Extract long-form copy to constants at the top of `page.tsx` or a separate `src/lib/landingContent.ts`. |
| **Server Component limitations** — No `useState`, `useEffect`, or browser APIs in `page.tsx`. | Isolate any interactivity (FAQ accordion, mobile menu) into `"use client"` sub-components. |

---

## 10. Out of Scope for This Plan

- A/B testing framework or analytics events on CTAs (Vercel Analytics is already included globally).
- Internationalization (i18n) — all copy is English for now.
- CMS integration for dynamic landing page content.
- Animations that require new `@keyframes` definitions.
- Light mode redesign.

---

## 11. Open Question

**Legal page accessibility:** The current Terms of Service and Privacy Policy pages are behind `AuthGuard` inside `/dashboard/`. A public landing page footer should not link to auth-gated routes.

**Recommended answer:** Create lightweight public versions at `/terms` and `/privacy` with the same static content. This is standard practice, keeps the legal pages accessible for compliance, and avoids auth redirects from public links. If you prefer to keep them dashboard-only, omit them from the landing page footer entirely.
