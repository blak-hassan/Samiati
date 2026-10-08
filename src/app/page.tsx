// src/app/page.tsx — Samiati landing page.
// Server Component: all interactive pieces ('use client' leaves) live in
// src/components/landing/{Navbar,DemoChat,LanguageStrength,FAQAccordion}.tsx.
import Link from 'next/link';
import { FAQS as faqs } from '@/lib/landingContent';
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/seo';
import { LANGUAGE_PAGES, getLanguageBySlug } from '@/lib/languages';
import { PLANS } from '@/lib/plans';
import SamiatiLogo from '@/components/SamiatiLogo';
import Navbar from '@/components/landing/Navbar';
import { FeatureCard } from '@/components/landing/FeatureCard';
import FAQAccordion from '@/components/landing/FAQAccordion';
import { DemoChat, type DemoPhrase } from '@/components/landing/DemoChat';
import { LanguageStrength } from '@/components/landing/LanguageStrength';
import { Badge } from '@/components/ui/badge';
import { CookieSettingsLink } from '@/components/cookie-consent';
import { TrackedCta, HeroCta } from '@/components/landing/HeroCta';
import { PricingCard } from '@/components/PricingCard';
import { MessageSquare, Mic, Globe2 } from 'lucide-react';

// Languages shown in the picker grid: only those with a real /languages/<slug>
// page, so every card links somewhere that exists (e2e/links.spec crawls them).
const LIVE_SLUGS = new Set(['kikuyu', 'swahili']);
const pickerLanguages = LANGUAGE_PAGES.map((lang) => ({
  ...lang,
  live: LIVE_SLUGS.has(lang.slug),
}));

// Design-spec counts. Both derive from the real language tables so they can
// never drift: live = the two published /languages pages marked live above;
// next = every language name across both tables (LANGUAGES + LANGUAGE_PAGES)
// minus the live ones — 11 names total, 2 live, 9 "planned with their
// communities", exactly matching the design's "2 live / 9 next".
const LIVE_LANGUAGE_COUNT = LIVE_SLUGS.size;
const ALL_LANGUAGE_NAMES = new Set<string>([
  ...LANGUAGE_PAGES.map((lang) => lang.name),
]);
const NEXT_LANGUAGE_COUNT = ALL_LANGUAGE_NAMES.size - LIVE_LANGUAGE_COUNT;


// Real sample phrases behind the interactive demo — from the published
// /languages/kikuyu and /languages/swahili pages, not invented copy.
const kikuyuPhrases: DemoPhrase[] = getLanguageBySlug('kikuyu')?.phrases ?? [];
const kiswahiliPhrases: DemoPhrase[] =
  getLanguageBySlug('swahili')?.phrases ?? [];

const CAPABILITIES = [
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: 'Ask anything',
    description:
      'Questions, translations, everyday explanations — answered in the language you asked in.',
  },
  {
    icon: <Mic className="h-6 w-6" />,
    title: 'Voice or text',
    description:
      'Speak when typing is slow, type when you are somewhere loud. Both come back in your language.',
  },
  {
    icon: <Globe2 className="h-6 w-6" />,
    title: 'Mix as you speak',
    description:
      'Switch between Kikuyu, Kiswahili, English or Sheng mid-sentence. Samiati keeps up.',
  },
] as const;

const HOW_STEPS = [
  {
    title: 'Speak or type',
    body: 'Say it the way you would to a friend. Mix in Kiswahili, English or Sheng if you like.',
  },
  {
    title: 'Samiati understands',
    body: 'It carries your meaning across languages so a powerful AI can help you properly.',
  },
  {
    title: 'You get the answer',
    body: 'The reply comes back in your language, in text or in voice.',
  },
] as const;

const CHANGA_STEPS = [
  { title: 'Use Samiati', body: 'Ask in your language' },
  { title: 'Spot a gap', body: 'A word it misses' },
  { title: 'Add it on Changa', body: 'A few quick taps' },
  { title: 'Better data', body: 'Checked by speakers' },
  { title: 'Better Samiati', body: 'For everyone' },
] as const;

const PROMISES = [
  {
    title: 'Your chats stay yours',
    body: 'You can delete your conversations at any time.',
  },
  {
    title: 'Sharing is a choice',
    body: 'Nothing is used to improve languages unless you opt in through Changa.',
  },
  {
    title: 'Voice is handled with care',
    body: 'You decide whether recordings can be used, and you can withdraw later.',
  },
  {
    title: 'Built with communities',
    body: 'Language speakers check and guide what goes into Samiati.',
  },
] as const;


export default function Home() {
  return (
    <>
      {/* `#top` anchor target — the design's brand link and social placeholders
          resolve here. Wraps the whole page so the jump lands at the very top. */}
      <div id="top">
        <main
          id="main"
          tabIndex={-1}
          className="min-h-screen bg-background text-foreground antialiased"
        >
          <Navbar />

          {/* Announcement */}
          <div className="border-b border-border/50 bg-primary/10">
            <p className="mx-auto max-w-7xl px-4 py-3 text-center text-sm text-foreground sm:px-6 lg:px-8">
              Kikuyu and Kiswahili are live. More languages are coming.
            </p>
          </div>

          {/* Hero + demo */}
          <section className="relative overflow-hidden">
            <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
              <div className="space-y-6">
                <h1 className="text-4xl font-extrabold leading-tight tracking-tight font-display sm:text-5xl lg:text-6xl">
                  AI that speaks{' '}
                  <em className="text-gold">Kikuyu</em>
                  <span className="block">your language</span>
                </h1>
                <p className="max-w-xl text-lg text-muted-foreground">
                  Speak or type the way you naturally do. Samiati answers in
                  your language, so you never have to switch to English.
                </p>
                <TrackedCta
                  href="#languages"
                  location="hero"
                  label="Explore languages"
                  size="lg"
                  className="min-h-11"
                />
              </div>

              {/* Interactive demo (#demo) */}
              <div id="demo" className="scroll-mt-16">
                <DemoChat
                  phrases={{
                    kikuyu: kikuyuPhrases,
                    kiswahili: kiswahiliPhrases,
                  }}
                />
              </div>
            </div>
          </section>

          {/* Languages picker */}
          <section id="languages" className="scroll-mt-16 py-16 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-10 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gold">
                  Languages
                </p>
                <h2 className="text-3xl font-bold tracking-tight font-display sm:text-4xl">
                  Pick the language you live in.
                </h2>
              </div>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {pickerLanguages.map((lang) => (
                  <li key={lang.slug}>
                    <Link
                      href={`/languages/${lang.slug}`}
                      className="flex min-h-11 h-full flex-col gap-2 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="font-bold">{lang.name}</span>
                        <Badge
                          variant={lang.live ? 'default' : 'secondary'}
                          className="shrink-0"
                        >
                          {lang.live ? 'Live' : 'Next'}
                        </Badge>
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {lang.nativeName !== lang.name
                          ? `${lang.nativeName} · `
                          : ''}
                        {lang.tagline}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* What you can do */}
          <section className="border-t border-border/50 bg-card/30 py-16 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-10 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gold">
                  What you can do
                </p>
                <h2 className="text-3xl font-bold tracking-tight font-display sm:text-4xl">
                  Ask anything. In your words.
                </h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {CAPABILITIES.map((capability) => (
                  <FeatureCard
                    key={capability.title}
                    icon={capability.icon}
                    title={capability.title}
                    description={capability.description}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* How it works */}
          <section className="py-16 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-10 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gold">
                  How it works
                </p>
                <h2 className="text-3xl font-bold tracking-tight font-display sm:text-4xl">
                  You talk. Samiati does the rest.
                </h2>
                <p className="max-w-2xl text-muted-foreground">
                  The technical part stays out of sight. You only see a
                  conversation in your language.
                </p>
              </div>
              <ol className="grid gap-6 sm:grid-cols-3">
                {HOW_STEPS.map((step, index) => (
                  <li
                    key={step.title}
                    className="rounded-2xl border border-border bg-card p-6"
                  >
                    <span className="mb-4 flex size-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-gold">
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-bold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Why this matters */}
          <section className="border-y border-border/50 bg-card/30 py-16 sm:py-24">
            <div className="mx-auto max-w-4xl space-y-6 px-4 text-center sm:px-6 lg:px-8">
              <p className="text-xs font-bold uppercase tracking-widest text-gold">
                Why this matters
              </p>
              <p className="text-2xl font-semibold leading-relaxed tracking-tight font-display sm:text-3xl">
                Millions of Africans think, work and dream in their own
                languages. Most AI still expects English.
              </p>
              <p className="mx-auto max-w-2xl leading-relaxed text-muted-foreground">
                Samiati exists so that you never have to change how you speak
                to use modern AI. It is built with the people who speak these
                languages, starting in Kenya and growing across Africa.
              </p>
            </div>
          </section>

          {/* Language strength */}
          <section className="py-16 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-10 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gold">
                  Language strength
                </p>
                <h2 className="text-3xl font-bold tracking-tight font-display sm:text-4xl">
                  How well does AI know your language today?
                </h2>
                <p className="max-w-2xl text-muted-foreground">
                  Tap a point. Add a contribution. Watch it grow.
                </p>
              </div>

              <LanguageStrength />

              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card p-6">
                  <p className="text-3xl font-extrabold text-gold">
                    {LIVE_LANGUAGE_COUNT} live
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Kikuyu and Kiswahili
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-6">
                  <p className="text-3xl font-extrabold text-gold">
                    {NEXT_LANGUAGE_COUNT} next
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Planned with their communities
                  </p>
                </div>
                <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6">
                  <p className="text-3xl font-extrabold text-muted-foreground">
                    Your story
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Community stories and live numbers will appear here.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Changa */}
          <section id="changa" className="scroll-mt-16 border-t border-border/50 bg-card/30 py-16 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-10 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gold">
                  Changa
                </p>
                <h2 className="text-3xl font-bold tracking-tight font-display sm:text-4xl">
                  Help your language grow.
                </h2>
                <p className="max-w-2xl text-muted-foreground">
                  Every contribution is checked by speakers before it counts.
                  Start on Changa in seconds.
                </p>
              </div>
              <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
                {CHANGA_STEPS.map((step, index) => (
                  <li
                    key={step.title}
                    className="rounded-2xl border border-border bg-card p-6"
                  >
                    <span className="mb-4 flex size-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-gold">
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-bold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </li>
                ))}
              </ol>
              <div className="mt-8">
                <TrackedCta
                  href="/dashboard/changa"
                  location="changa"
                  label="Open Changa"
                  size="lg"
                  className="min-h-11"
                />
              </div>
            </div>
          </section>

          {/* Promises */}
          <section className="border-t border-border/50 py-16 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-10 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gold">
                  Promises
                </p>
                <h2 className="text-3xl font-bold tracking-tight font-display sm:text-4xl">
                  Your language. Your terms.
                </h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {PROMISES.map((promise) => (
                  <div
                    key={promise.title}
                    className="rounded-2xl border border-border bg-card p-6"
                  >
                    <h3 className="text-lg font-bold">{promise.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {promise.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Pricing preview */}
          <section id="pricing" className="scroll-mt-16 border-t border-border/50 bg-card/30 py-16 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-10 space-y-3 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-gold">
                  Pricing
                </p>
                <h2 className="text-3xl font-bold tracking-tight font-display sm:text-4xl">
                  Start free. Grow when ready.
                </h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {PLANS.map((plan) => (
                  <PricingCard
                    key={plan.title}
                    title={plan.title}
                    price={plan.price}
                    priceSuffix={plan.priceSuffix}
                    description={plan.description}
                    features={[...plan.features]}
                    cta={plan.cta}
                    popular={plan.popular}
                    href={plan.href}
                    ctaLocation="landing"
                  />
                ))}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="scroll-mt-16 py-16 sm:py-24">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <div className="mb-10 space-y-3 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-gold">
                  FAQ
                </p>
                <h2 className="text-3xl font-bold tracking-tight font-display sm:text-4xl">
                  Questions, answered.
                </h2>
              </div>
              <FAQAccordion items={faqs} />
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    mainEntity: faqs.map((faq) => ({
                      '@type': 'Question',
                      name: faq.question,
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: faq.answer,
                      },
                    })),
                  }),
                }}
              />
            </div>
          </section>

          {/* Final CTA */}
          <section className="border-t border-border/50 bg-card/30 py-16 sm:py-24">
            <div className="mx-auto max-w-4xl space-y-6 px-4 text-center sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold tracking-tight font-display sm:text-4xl">
                Your language belongs in AI.
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Join free today and help build technology that speaks like you do.
              </p>
              <HeroCta location="final-cta" />
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-border/50 py-10">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:px-8">
              <Link href="#top" className="flex items-center" aria-label={`${SITE_NAME} home`}>
                <SamiatiLogo size={32} variant="primary" />
              </Link>
              <p className="text-sm text-muted-foreground">
                {SITE_NAME} — {SITE_DESCRIPTION}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <Link href="/about" className="text-muted-foreground hover:text-foreground">
                  About
                </Link>
                <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
                  Pricing
                </Link>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground">
                  FAQ
                </Link>
                <CookieSettingsLink />
              </div>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}


