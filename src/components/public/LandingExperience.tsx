'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Compass,
  Globe2,
  HeartHandshake,
  MicOff,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/hooks/useSettings';
import { PRODUCT_LANGUAGES, getProductLanguage } from '@/lib/productLanguages';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import WaitlistHero from '@/components/waitlist/WaitlistHero';
import { cn } from '@/lib/utils';

const EXAMPLES = [
  {
    topic: 'Understand something',
    question: 'Explain how solar energy works in simple terms.',
    answer:
      'Think of a solar panel as a collector of sunlight. Its cells turn light into electricity that can power things in your home. A battery can store some of that energy for later.',
  },
  {
    topic: 'Find the right words',
    question: 'Help me write a warm thank-you note to my teacher.',
    answer:
      'Thank you for your patience, encouragement, and the time you have given me. You helped me believe I could learn something new, and that will stay with me.',
  },
  {
    topic: 'Make a plan',
    question: 'What should I think about before starting a small business?',
    answer:
      'Start with the people you want to help. What do they need? Then think about your costs, a fair price, and a small way to try your idea before committing more money.',
  },
];

const FAQS = [
  [
    'Do I need an account to try Samiati?',
    'You can open the guest chat without creating an account. Some community, contribution and account features require sign-in. Service availability and usage controls still apply.',
  ],
  [
    'Which languages can I use?',
    'Explore the language directory for experimental text chat and planned languages. Availability depends on the service; translation quality and coverage of language varieties can differ. Voice availability is under review.',
  ],
  [
    'Will Samiati always get my language right?',
    'AI can make mistakes, especially with language varieties, context and cultural meaning. You can report a problem or suggest a better translation. Check important answers with a reliable source or someone knowledgeable.',
  ],
  [
    'How can I help improve my language?',
    'Changa is Samiati’s contribution space. When tasks are available, you can contribute translations, recordings, corrections and reviews through a consent-led process.',
  ],
  [
    'Where are my conversations stored?',
    'The current chat history is stored in your browser on this device. It is not a cloud backup, and clearing browser data removes it. Account and contribution information use the existing Samiati services.',
  ],
  [
    'Can I change the appearance?',
    'Yes. Use the appearance menu for light, dark or system mode. Settings also includes text size, reading width, reduced motion and high contrast. Your appearance choices stay on this device.',
  ],
];

export function LandingExperience() {
  const { settings, updateSetting } = useSettings();
  const preference = getProductLanguage(settings.preferredLanguage);
  const selectedLanguage = preference?.text === 'configured' ? preference : PRODUCT_LANGUAGES[0];
  const [exampleIndex, setExampleIndex] = useState(0);
  const example = EXAMPLES[exampleIndex];
  const configured = PRODUCT_LANGUAGES.filter((language) => language.text === 'configured');

  return (
    <div className="min-h-screen overflow-clip bg-background text-foreground">
      <PublicHeader />
      <main id="main-content" tabIndex={-1} className="outline-none">
        <section className="relative isolate border-b border-border/70">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 right-[-10%] -z-10 size-[min(80vw,55rem)] rounded-full bg-[radial-gradient(ellipse,var(--secondary),transparent_65%)] opacity-70"
          />
          <div className="product-container grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.12fr_1fr] lg:gap-12 lg:py-28">
            <div className="min-w-0">
              <p className="mb-7 flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                <span aria-hidden="true" className="size-2 rounded-full bg-ai" />
                African languages. A wider world.
              </p>
              <h1 className="max-w-3xl text-[clamp(3.3rem,7vw,6.5rem)] leading-[0.98] font-extrabold tracking-[-0.065em]">
                Your language.
                <br />
                <span className="font-editorial font-normal tracking-[-0.045em] text-primary">
                  <em>Every possibility.</em>
                </span>
              </h1>
              <p className="mt-7 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
                Ask, explore, and create with AI in the language you call home.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild className="min-h-12 rounded-full px-6 text-sm font-bold">
                  <Link href="/dashboard">
                    Start chatting <ArrowUpRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="min-h-12 rounded-full px-6 text-sm">
                  <Link href="/languages">
                    Explore languages <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
              <p className="mt-5 text-xs text-muted-foreground">
                Start as a guest. Make yourself at home.
              </p>
            </div>
            <div className="relative min-w-0">
              <div
                aria-hidden="true"
                className="absolute -top-4 -right-3 bottom-4 left-3 -z-10 rotate-2 rounded-[1.75rem] border border-primary/25 bg-primary/5 sm:-right-4"
              />
              <section
                aria-label="Interactive conversation example"
                className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-[0_24px_80px_-40px_var(--elevated)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <Sparkles aria-hidden="true" className="size-4 text-ai" />A little possibility
                  </span>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-[0.6875rem] font-semibold text-muted-foreground">
                    Interactive example
                  </span>
                </div>
                <div className="px-5 pt-5 sm:px-6">
                  <label
                    htmlFor="preview-language"
                    className="mb-2 block text-xs font-semibold text-muted-foreground"
                  >
                    Choose your chat language
                  </label>
                  <div className="relative inline-flex max-w-full items-center">
                    <Globe2
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 size-4 text-primary"
                    />
                    <select
                      id="preview-language"
                      value={selectedLanguage.code}
                      onChange={(event) => updateSetting('preferredLanguage', event.target.value)}
                      className="min-h-11 max-w-full appearance-none rounded-full border border-input bg-background py-2 pr-10 pl-10 text-sm font-semibold"
                    >
                      {configured.map((language) => (
                        <option key={language.code} value={language.code}>
                          {language.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 size-4"
                    />
                  </div>
                </div>
                <div aria-live="polite" aria-atomic="true" className="space-y-5 p-5 sm:p-6">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {selectedLanguage.name} selected. This illustrative conversation stays in
                    English until language examples are verified.
                  </p>
                  <div className="ml-5 rounded-2xl rounded-br-md bg-secondary px-4 py-3 text-sm leading-relaxed">
                    {example.question}
                  </div>
                  <div className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-ai/10 text-ai"
                    >
                      <Sparkles className="size-4" />
                    </span>
                    <p className="pt-0.5 text-sm leading-[1.8]">{example.answer}</p>
                  </div>
                </div>
                <div className="border-t border-border p-4 sm:p-5">
                  <div
                    role="group"
                    aria-label="Choose an English example"
                    className="flex flex-wrap gap-2"
                  >
                    {EXAMPLES.map((item, index) => (
                      <button
                        key={item.topic}
                        type="button"
                        aria-pressed={index === exampleIndex}
                        onClick={() => setExampleIndex(index)}
                        className={cn(
                          'min-h-11 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors',
                          index === exampleIndex
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:bg-secondary'
                        )}
                      >
                        {item.topic}
                      </button>
                    ))}
                  </div>
                  <Link
                    href="/dashboard"
                    className="mt-4 flex min-h-11 items-center justify-between gap-3 rounded-xl bg-background px-4 text-sm text-muted-foreground"
                  >
                    Open chat in {selectedLanguage.name}
                    <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-primary" />
                  </Link>
                </div>
              </section>
              <p className="mt-4 text-center text-[0.6875rem] text-muted-foreground">
                Preview only · Not a live AI response
              </p>
            </div>
          </div>
        </section>
        <section aria-labelledby="languages-title" className="product-container py-14 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Language comes first
              </p>
              <h2
                id="languages-title"
                className="font-editorial text-4xl leading-tight sm:text-5xl"
              >
                There is no one way
                <br className="sm:hidden" /> to call a place home.
              </h2>
            </div>
            <Link
              href="/languages"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"
            >
              Explore the directory{' '}
              <ArrowUpRight aria-hidden="true" className="size-4 text-primary" />
            </Link>
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Start with an experimental text language. Coverage varies by service and language
            variety, and community feedback helps us improve.
          </p>
          <div
            role="group"
            aria-label="Select a language for chat"
            className="mt-8 flex flex-wrap gap-2.5"
          >
            {configured
              .filter((language) => language.code !== 'en')
              .map((language) => (
                <button
                  key={language.code}
                  type="button"
                  onClick={() => updateSetting('preferredLanguage', language.code)}
                  aria-pressed={language.code === selectedLanguage.code}
                  className={cn(
                    'inline-flex min-h-12 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors',
                    language.code === selectedLanguage.code
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card hover:border-primary/70'
                  )}
                >
                  {language.name}
                  {language.code === selectedLanguage.code && (
                    <Check aria-hidden="true" className="size-3.5" />
                  )}
                </button>
              ))}
          </div>
          <p className="mt-5 text-xs text-muted-foreground" role="status">
            Your chat language: {selectedLanguage.name}. Saved on this device. Gusii, Somali and
            Sheng are planned options.
          </p>
        </section>
        <section aria-labelledby="how-title" className="border-y border-border bg-card">
          <div className="product-container py-14 sm:py-20">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Simple by design
            </p>
            <h2 id="how-title" className="font-editorial text-4xl sm:text-5xl">
              A conversation.
              <br />
              <em>A world of possibilities.</em>
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {[
                [
                  '01',
                  'Choose your language.',
                  'A familiar starting point. Pick an experimental text language, and make it your default.',
                ],
                [
                  '02',
                  'Ask anything naturally.',
                  'Follow your curiosity. Get help with an idea, explore a question, or find the right words.',
                ],
                [
                  '03',
                  'Receive an answer in your language.',
                  'Keep the conversation flowing. If something feels off, suggest a correction or share feedback.',
                ],
              ].map(([number, title, description]) => (
                <div key={number} className="border-t border-border pt-5">
                  <span className="text-xs font-bold tabular-nums text-primary">{number}</span>
                  <h3 className="mt-5 text-lg font-bold tracking-tight">{title}</h3>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section aria-labelledby="ecosystem-title" className="product-container py-14 sm:py-20">
          <div className="mb-9">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Beyond the conversation
            </p>
            <h2 id="ecosystem-title" className="font-editorial text-4xl sm:text-5xl">
              More ways to find your voice.
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <article className="flex flex-col rounded-3xl border border-border bg-card p-6 sm:p-8">
              <Compass aria-hidden="true" className="size-6 text-primary" />
              <span className="mt-8 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Discover
              </span>
              <h3 className="mt-2 text-2xl font-bold tracking-tight">Follow a new thought.</h3>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                Explore stories and ideas, read the sources, then ask Samiati a question of your
                own.
              </p>
              <p className="mt-5 border-l-2 border-ai pl-3 text-xs leading-relaxed text-muted-foreground">
                Live feed availability varies. AI summaries are identified alongside their sources.
              </p>
              <Link
                href="/dashboard/discover"
                className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-bold"
              >
                Open Discover <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </article>
            <article className="flex flex-col rounded-3xl border border-ai/35 bg-ai/5 p-6 sm:p-8">
              <HeartHandshake aria-hidden="true" className="size-6 text-ai" />
              <span className="mt-8 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Changa
              </span>
              <h3 className="mt-2 text-2xl font-bold tracking-tight">Language grows together.</h3>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                A translation. A recording. A thoughtful correction. Help your language find more
                room in the digital world.
              </p>
              <p className="mt-5 border-l-2 border-ai pl-3 text-xs leading-relaxed text-muted-foreground">
                Choose available tasks and review consent before contributing. Sign-in is required
                to submit.
              </p>
              <Link
                href="/dashboard/changa"
                className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-bold"
              >
                Meet Changa <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </article>
            <article className="flex flex-col rounded-3xl border border-border bg-secondary/35 p-6 sm:p-8">
              <MicOff aria-hidden="true" className="size-6 text-primary" />
              <span className="mt-8 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Looking ahead · Voice
              </span>
              <h3 className="mt-2 text-2xl font-bold tracking-tight">Space for the spoken word.</h3>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                Speaking should feel as natural as writing. We are reviewing voice support language
                by language.
              </p>
              <div aria-hidden="true" className="mt-6 flex h-12 items-center gap-1.5">
                {[10, 22, 14, 36, 46, 28, 18, 34, 44, 24, 12, 30, 18, 40, 26, 12].map(
                  (height, index) => (
                    <span
                      key={index}
                      className="w-1.5 rounded-full bg-primary/50"
                      style={{ height }}
                    />
                  )
                )}
              </div>
              <p className="mt-6 text-xs text-muted-foreground">
                Illustration only. No recording is taking place.
              </p>
            </article>
          </div>
        </section>
        <section className="border-y border-border bg-secondary/35" aria-labelledby="why-title">
          <div className="product-container grid gap-9 py-14 sm:py-20 md:grid-cols-[1.1fr_1fr] md:gap-16">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Built around people
              </p>
              <h2
                id="why-title"
                className="font-editorial text-[clamp(2.75rem,5vw,4.75rem)] leading-[1.05]"
              >
                Your ideas deserve
                <br />
                <em>to feel at home.</em>
              </h2>
            </div>
            <div className="space-y-6 self-center text-base leading-relaxed text-muted-foreground">
              <p>
                Language is how we ask questions, pass on knowledge, and see the world. Access to
                useful technology should begin there.
              </p>
              <p>
                Samiati is a growing space for African languages and the communities that shape
                them. Different voices, varieties and experiences belong in that work.
              </p>
              <Link
                href="/onboarding"
                className="inline-flex min-h-11 items-center gap-2 font-semibold text-foreground"
              >
                Find your starting point{' '}
                <ArrowRight aria-hidden="true" className="size-4 text-primary" />
              </Link>
            </div>
          </div>
        </section>
        <section
          aria-labelledby="pricing-preview-title"
          className="product-container flex flex-wrap items-center justify-between gap-8 py-14 sm:py-20"
        >
          <div className="max-w-xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Thoughtful access
            </p>
            <h2 id="pricing-preview-title" className="font-editorial text-4xl sm:text-5xl">
              A little curiosity.
              <br />
              <em>Room to grow.</em>
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Explore the proposed Free, monthly and custom plans. Pricing and allowances are still
              being shaped; the overview is a preview, not a live offer.
            </p>
          </div>
          <Button asChild variant="outline" className="min-h-12 rounded-full px-6">
            <Link href="/pricing">
              View proposed plans <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </section>
        <section aria-labelledby="faq-title" className="border-t border-border bg-card">
          <div className="product-container grid gap-8 py-14 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                A few things to know
              </p>
              <h2 id="faq-title" className="font-editorial text-4xl sm:text-5xl">
                Good questions.
                <br />
                <em>Clear answers.</em>
              </h2>
            </div>
            <div className="divide-y divide-border border-y border-border">
              {FAQS.map(([question, answer]) => (
                <details key={question} className="group py-1">
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                    {question}
                    <ChevronDown
                      aria-hidden="true"
                      className="size-4 shrink-0 text-primary transition-transform duration-200 group-open:rotate-180"
                    />
                  </summary>
                  <p className="pb-5 pr-4 text-sm leading-relaxed text-muted-foreground">
                    {answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section
          id="waitlist"
          aria-labelledby="waitlist-title"
          className="product-container py-14 text-center sm:py-20"
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Come along
          </p>
          <h2 id="waitlist-title" className="font-editorial text-4xl sm:text-5xl">
            The next chapter is <em>ours to write.</em>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Join the existing Samiati waitlist for what comes next.
          </p>
          <WaitlistHero />
          <p className="mt-5 text-xs text-muted-foreground">
            The Samiati waitlist is for adults aged 18 and over.
          </p>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
