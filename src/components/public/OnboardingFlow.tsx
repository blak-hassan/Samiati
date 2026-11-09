'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe2,
  HeartHandshake,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/hooks/useSettings';
import { PRODUCT_LANGUAGES, getProductLanguage } from '@/lib/productLanguages';
import { PublicHeader } from './PublicHeader';
import { cn } from '@/lib/utils';

const STEPS = ['Welcome', 'Your language', 'Possibilities', 'Begin'];

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { settings, updateSetting } = useSettings();
  const preference = getProductLanguage(settings.preferredLanguage);
  const language = preference?.text === 'configured' ? preference : PRODUCT_LANGUAGES[0];
  const configured = PRODUCT_LANGUAGES.filter((item) => item.text === 'configured');
  useEffect(() => {
    if (step > 0) headingRef.current?.focus();
  }, [step]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <PublicHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="product-container max-w-5xl py-8 outline-none sm:py-14"
      >
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
            A place to begin
          </p>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Skip to chat <ArrowRight aria-hidden="true" className="ml-2 size-4" />
          </Link>
        </div>
        <ol aria-label="Getting started progress" className="mb-10 grid grid-cols-4 gap-2 sm:gap-4">
          {STEPS.map((label, index) => (
            <li key={label} aria-current={step === index ? 'step' : undefined} className="min-w-0">
              <div
                aria-hidden="true"
                className={cn('mb-2 h-1 rounded-full', index <= step ? 'bg-primary' : 'bg-border')}
              />
              <span
                className={cn(
                  'text-[0.6875rem] font-semibold sm:text-xs',
                  step === index ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </li>
          ))}
        </ol>
        <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-10 lg:p-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-16 size-60 rounded-full border-[40px] border-primary/5"
          />
          <div className="relative">
            {step === 0 && (
              <>
                <Globe2 aria-hidden="true" className="mb-8 size-7 text-primary" />
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-primary">
                  Welcome to Samiati
                </p>
                <h1
                  ref={headingRef}
                  tabIndex={-1}
                  className="max-w-2xl font-editorial text-[clamp(2.75rem,6vw,5rem)] leading-[1.03] outline-none"
                >
                  Your language.
                  <br />
                  <em>Every possibility.</em>
                </h1>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
                  A little help for your ideas, your questions, and your next step. Let’s start in
                  the language you call home.
                </p>
                <p className="mt-6 text-sm text-muted-foreground">
                  This introduction is optional. You can explore as a guest.
                </p>
              </>
            )}
            {step === 1 && (
              <>
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-primary">
                  Make yourself at home
                </p>
                <h1
                  ref={headingRef}
                  tabIndex={-1}
                  className="font-editorial text-4xl leading-tight outline-none sm:text-5xl"
                >
                  Which language feels like you?
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Choose a default for new chats on this device. Text chat is experimental; quality
                  and service availability may vary.
                </p>
                <div
                  role="group"
                  aria-label="Choose your default chat language"
                  className="mt-7 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {configured.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => updateSetting('preferredLanguage', item.code)}
                      aria-pressed={item.code === language.code}
                      className={cn(
                        'flex min-h-14 items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors',
                        item.code === language.code
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background hover:border-primary'
                      )}
                    >
                      <span>{item.name}</span>
                      {item.code === language.code && (
                        <Check aria-hidden="true" className="size-4 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
                <p role="status" className="mt-5 text-xs text-muted-foreground">
                  {language.name} selected. You can change this later.
                </p>
                <Link
                  href="/languages"
                  className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold"
                >
                  Explore language varieties and planned support{' '}
                  <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
                </Link>
              </>
            )}
            {step === 2 && (
              <>
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-primary">
                  Follow your curiosity
                </p>
                <h1
                  ref={headingRef}
                  tabIndex={-1}
                  className="font-editorial text-4xl leading-tight outline-none sm:text-5xl"
                >
                  A question is a good beginning.
                </h1>
                <div className="mt-8 grid gap-6 md:grid-cols-3">
                  {[
                    [
                      MessageCircle,
                      'Ask and explore',
                      'Understand an idea, draft a note, or think through your next step.',
                    ],
                    [
                      Sparkles,
                      'Keep learning',
                      'Use Discover to explore sourced stories and ask your own questions.',
                    ],
                    [
                      HeartHandshake,
                      'Help language grow',
                      'Share corrections and explore consent-led contribution tasks with Changa.',
                    ],
                  ].map(([Icon, title, description]) => {
                    const FeatureIcon = Icon as typeof MessageCircle;
                    return (
                      <div key={title as string} className="border-t border-border pt-5">
                        <FeatureIcon aria-hidden="true" className="size-5 text-ai" />
                        <h2 className="mt-4 text-base font-bold">{title as string}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {description as string}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-8 max-w-xl text-xs leading-relaxed text-muted-foreground">
                  AI can make mistakes. Important answers need checking, and your feedback is
                  welcome. Voice support is still under review.
                </p>
              </>
            )}
            {step === 3 && (
              <>
                <Sparkles aria-hidden="true" className="mb-8 size-7 text-ai" />
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-primary">
                  You’re ready
                </p>
                <h1
                  ref={headingRef}
                  tabIndex={-1}
                  className="font-editorial text-[clamp(2.75rem,6vw,5rem)] leading-[1.03] outline-none"
                >
                  Let’s see where
                  <br />
                  <em>your words take you.</em>
                </h1>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
                  Your default language is{' '}
                  <strong className="font-semibold text-foreground">{language.name}</strong>. Start
                  with something you have been wondering about.
                </p>
                <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Current conversation history stays in this browser. Guest access is available;
                  some community and account features require sign-in.
                </p>
                <Button asChild className="mt-8 min-h-12 rounded-full px-6">
                  <Link href="/dashboard">
                    Start your first conversation{' '}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              </>
            )}
            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
              <Button
                variant="ghost"
                onClick={() => setStep((current) => Math.max(0, current - 1))}
                disabled={step === 0}
                className="min-h-11"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                Back
              </Button>
              <p className="text-xs text-muted-foreground">
                {step + 1} of {STEPS.length}
              </p>
              {step < STEPS.length - 1 ? (
                <Button
                  onClick={() => setStep((current) => current + 1)}
                  className="min-h-11 rounded-full px-5"
                >
                  {step === 0 ? 'Let’s begin' : 'Continue'}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Button>
              ) : (
                <Link
                  href="/languages"
                  className="inline-flex min-h-11 items-center text-sm font-semibold"
                >
                  Change language
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
