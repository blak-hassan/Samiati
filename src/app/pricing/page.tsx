import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Check, Sparkles } from 'lucide-react';
import SamiatiLogo from '@/components/SamiatiLogo';
import { Button } from '@/components/ui/button';
import { PROPOSED_PLANS } from '@/lib/pricing';
import { cn } from '@/lib/utils';

export default function PricingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
          <Button asChild variant="ghost" size="icon" className="rounded-full">
            <Link href="/dashboard" aria-label="Back to chat">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <h1 className="font-display text-lg font-bold tracking-tight">Samiati+</h1>
          <Link href="/dashboard" className="ml-auto" aria-label="Samiati home">
            <SamiatiLogo size={32} />
          </Link>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold tracking-tight">Samiati plans</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Compare proposed plans and manage your subscription.
          </p>
        </div>
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm leading-relaxed">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
          <p>
            <strong className="font-semibold">Proposed pricing.</strong> These plans are being
            developed. Prices, availability, and included features will be confirmed before
            purchase. No message or voice allowances are promised here.
          </p>
        </div>
        <section
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Proposed Samiati plans"
        >
          {PROPOSED_PLANS.map((plan) => (
            <article
              key={plan.id}
              className={cn(
                'relative flex min-w-0 flex-col rounded-2xl border border-border/50 bg-muted/20 p-5',
                plan.highlighted && 'border-primary'
              )}
            >
              {plan.highlighted && (
                <span className="mb-5 inline-flex w-fit rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  For everyday exploration
                </span>
              )}
              <h2 className="font-display text-lg font-bold">{plan.name}</h2>
              <div className="my-5 flex flex-wrap items-baseline gap-1.5">
                <p className="text-4xl font-semibold tracking-tight">{plan.price}</p>
                {plan.interval && (
                  <span className="text-sm text-muted-foreground">/ {plan.interval}</span>
                )}
              </div>
              <p className="min-h-16 text-sm leading-relaxed text-muted-foreground">
                {plan.description}
              </p>
              <p className="mt-6 text-xs font-medium text-muted-foreground">Plan direction</p>
              <ul className="mb-8 mt-3 flex-1 space-y-4">
                {plan.intentions.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-relaxed">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={plan.highlighted ? 'default' : 'outline'}
                className="min-h-11 w-full"
              >
                <Link href={plan.href}>
                  {plan.cta}
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </article>
          ))}
        </section>
        <section
          className="mx-auto mt-10 max-w-3xl border-t border-border/50 pt-6"
          aria-labelledby="pricing-questions"
        >
          <h2 id="pricing-questions" className="font-display text-xl font-bold">
            Plan questions
          </h2>
          <div className="mt-6 divide-y divide-border">
            {[
              [
                'Can I explore Samiati without an account?',
                'You can enter the guest chat experience where available. Saving account activity and contributing to Changa require sign-in.',
              ],
              [
                'Which languages and voice features are available?',
                'The language explorer distinguishes configured text routes, planned languages, and unverified voice capabilities. Availability depends on the connected service.',
              ],
              [
                'Can I purchase one of these plans?',
                'This page describes proposed plans. Get launch updates for confirmed pricing and included usage. Existing subscribers can still access their billing settings.',
              ],
              [
                'Where can I manage an existing subscription?',
                'Open Billing & Subscription from your profile or settings to review your existing plan and usage.',
              ],
            ].map(([question, answer]) => (
              <details key={question} className="group py-5">
                <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold">
                  {question}
                </summary>
                <p className="pb-2 pt-3 text-sm leading-relaxed text-muted-foreground">{answer}</p>
              </details>
            ))}
          </div>
          <Button asChild variant="outline" className="mt-6 min-h-11">
            <Link href="/settings/billing">
              Billing &amp; subscription
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </section>
      </main>
      <footer className="mt-12 border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 text-xs text-muted-foreground sm:px-6">
          <span>Samiati · Experience Your Culture</span>
          <div className="flex flex-wrap gap-5">
            <Link href="/privacy-policy" className="underline underline-offset-4">
              Privacy
            </Link>
            <Link href="/terms-of-service" className="underline underline-offset-4">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
