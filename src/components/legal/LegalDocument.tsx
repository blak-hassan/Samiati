'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
  CircleHelp,
  Mail,
  Printer,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import type { LegalDocumentData } from './types';

interface Props {
  document: LegalDocumentData;
  goBack?: () => void;
}

const focusStyle =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-4 dark:focus-visible:ring-amber-300 dark:focus-visible:ring-offset-[#2b1e19]';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}

export default function LegalDocument({ document, goBack }: Props) {
  const Icon = document.kind === 'privacy' ? ShieldCheck : Scale;
  const helpSection =
    document.kind === 'privacy'
      ? {
          id: 'rights-and-controls',
          title: 'Your information, your choices',
          description:
            'Learn how to request access, correction, export, deletion, or withdrawal of a Changa contribution permission.',
          linkLabel: 'Review your privacy rights',
        }
      : {
          id: 'cancellations-and-refunds',
          title: 'Questions about your plan?',
          description:
            'Review the cancellation and first-payment refund conditions, or contact us about a payment problem.',
          linkLabel: 'Review billing terms',
        };

  const contents = (
    <ol className="space-y-1.5">
      {document.sections.map((section, index) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            className={`flex gap-3 rounded-md px-2 py-1.5 text-sm leading-5 text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-950 dark:text-stone-300 dark:hover:bg-white/5 dark:hover:text-white ${focusStyle}`}
          >
            <span className="w-5 shrink-0 text-xs tabular-nums text-stone-400 dark:text-stone-500">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span>{section.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="legal-document min-h-screen bg-background-light text-stone-900 dark:bg-background-dark dark:text-stone-100">
      <a
        href="#main-content"
        className={`sr-only fixed left-4 top-4 z-50 rounded-lg bg-white px-4 py-3 text-sm text-stone-900 focus:not-sr-only ${focusStyle}`}
      >
        Skip to policy content
      </a>

      <header className="legal-header sticky top-0 z-20 border-b border-stone-200/80 bg-background-light/95 backdrop-blur-md dark:border-white/10 dark:bg-background-dark/95">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            {goBack ? (
              <button
                type="button"
                onClick={goBack}
                aria-label="Go back"
                className={`rounded-full p-2 transition-colors hover:bg-stone-200/60 dark:hover:bg-white/10 ${focusStyle}`}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
              </button>
            ) : null}
            <Link
              href="/"
              aria-label="Samiati home"
              className={`rounded-sm font-display text-2xl font-bold tracking-tight ${focusStyle}`}
            >
              Samiati<span className="text-amber-700 dark:text-amber-300">.</span>
            </Link>
            <span className="hidden border-l border-stone-300 pl-3 text-xs font-medium uppercase tracking-widest text-stone-500 sm:block dark:border-stone-600 dark:text-stone-400">
              Legal
            </span>
          </div>

          <nav
            aria-label="Legal documents"
            className="flex flex-wrap gap-1 text-xs font-semibold sm:text-sm"
          >
            {[
              { kind: 'privacy', href: '/privacy-policy', label: 'Privacy Policy' },
              { kind: 'terms', href: '/terms-of-service', label: 'Terms of Service' },
            ].map((item) => (
              <Link
                key={item.kind}
                href={item.href}
                aria-current={document.kind === item.kind ? 'page' : undefined}
                className={`rounded-full px-3 py-2 transition-colors ${focusStyle} ${
                  document.kind === item.kind
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                    : 'text-stone-600 hover:bg-stone-200/60 dark:text-stone-300 dark:hover:bg-white/10'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-16 pt-12 outline-none sm:px-8 sm:pt-16"
      >
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800 dark:text-amber-200">
            <Icon className="size-4" aria-hidden="true" />
            Our commitment to you
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {document.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg dark:text-stone-300">
            {document.description}
          </p>
          <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-xs leading-6 sm:text-sm">
            <div>
              <dt className="inline text-stone-500 dark:text-stone-400">Last updated: </dt>
              <dd className="inline font-medium">
                <time dateTime={document.updatedAt}>{formatDate(document.updatedAt)}</time>
              </dd>
            </div>
            <div>
              <dt className="inline text-stone-500 dark:text-stone-400">Effective: </dt>
              <dd className="inline font-medium">
                <time dateTime={document.effectiveDate}>{formatDate(document.effectiveDate)}</time>
              </dd>
            </div>
          </dl>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <button
              type="button"
              onClick={() => window.print()}
              className={`legal-print-button inline-flex min-h-11 items-center gap-2 rounded-full border border-stone-300 bg-white/60 px-4 text-sm font-semibold transition-colors hover:border-stone-400 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10 ${focusStyle}`}
            >
              <Printer className="size-4" aria-hidden="true" />
              Print or save as PDF
            </button>
            <a
              href="mailto:hasb8882@gmail.com"
              className={`inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-amber-900 underline decoration-amber-800/40 underline-offset-4 hover:decoration-current dark:text-amber-200 ${focusStyle}`}
            >
              <Mail className="size-4" aria-hidden="true" />
              Contact Samiati
            </a>
          </div>
        </div>

        <section
          aria-labelledby="legal-overview"
          className="legal-overview my-10 rounded-2xl border border-stone-200 bg-white/70 p-6 sm:my-12 sm:p-8 dark:border-white/10 dark:bg-white/[0.03]"
        >
          <h2 id="legal-overview" className="font-display text-xl font-semibold">
            At a glance
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-stone-400">
            A quick guide. Please read the full {document.kind === 'privacy' ? 'policy' : 'terms'}{' '}
            below for the details.
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {document.highlights.map((highlight) => (
              <div
                key={highlight.title}
                className="border-l-2 border-amber-700/40 pl-4 dark:border-amber-300/40"
              >
                <h3 className="text-sm font-semibold">{highlight.title}</h3>
                <p className="mt-2 text-sm leading-7 text-stone-600 dark:text-stone-300">
                  {highlight.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid items-start gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
          <aside className="legal-sidebar space-y-5 lg:sticky lg:top-28">
            <nav aria-label="Table of contents" className="hidden lg:block">
              <h2 className="mb-4 px-2 text-xs font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400">
                On this page
              </h2>
              <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto pr-2">{contents}</div>
            </nav>
            <details className="rounded-xl border border-stone-200 p-4 lg:hidden dark:border-white/10">
              <summary className={`cursor-pointer rounded-sm text-sm font-semibold ${focusStyle}`}>
                On this page
              </summary>
              <nav aria-label="Table of contents" className="mt-4">
                {contents}
              </nav>
            </details>
            <section
              aria-labelledby="legal-help-heading"
              className="legal-help rounded-xl border border-stone-200 bg-white/60 p-5 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <CircleHelp className="size-4 shrink-0" aria-hidden="true" />
                <h2 id="legal-help-heading" className="text-sm font-semibold">
                  Need help?
                </h2>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{helpSection.title}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
                {helpSection.description}
              </p>
              <div className="mt-4 space-y-3 text-sm font-semibold">
                <a
                  href={`#${helpSection.id}`}
                  className={`flex items-center justify-between gap-3 rounded-sm text-amber-900 dark:text-amber-200 ${focusStyle}`}
                >
                  {helpSection.linkLabel}
                  <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
                </a>
                <a
                  href="mailto:hasb8882@gmail.com"
                  className={`flex items-center gap-2 rounded-sm text-stone-700 hover:text-stone-950 dark:text-stone-200 dark:hover:text-white ${focusStyle}`}
                >
                  <Mail className="size-4 shrink-0" aria-hidden="true" />
                  Email support
                </a>
              </div>
            </section>
          </aside>

          <article aria-label={document.title} className="legal-article min-w-0 max-w-3xl">
            {document.sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-heading`}
                className="scroll-mt-36 border-b border-stone-200 pb-9 not-first:pt-9 last:border-b-0 lg:scroll-mt-28 dark:border-white/10"
              >
                <h2
                  id={`${section.id}-heading`}
                  className="mb-5 flex gap-3 font-display text-xl font-semibold leading-8 sm:text-2xl"
                >
                  <span className="pt-0.5 text-sm font-medium tabular-nums text-amber-800 dark:text-amber-200">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>{section.title}</span>
                </h2>
                <div className="space-y-4 overflow-x-auto text-sm leading-7 text-stone-600 sm:text-[15px] sm:leading-8 dark:text-stone-300 [&_a]:rounded-sm [&_a]:font-medium [&_a]:text-amber-900 [&_a]:underline [&_a]:decoration-amber-800/40 [&_a]:underline-offset-4 [&_a:hover]:decoration-current [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-stone-900 [&_li]:pl-1 [&_li+li]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_strong]:text-stone-900 [&_table]:w-full [&_table]:min-w-md [&_table]:text-left [&_td]:border-b [&_td]:border-stone-200 [&_td]:px-3 [&_td]:py-3 [&_td]:align-top [&_th]:border-b [&_th]:border-stone-300 [&_th]:px-3 [&_th]:py-3 [&_th]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 dark:[&_a]:text-amber-200 dark:[&_a]:decoration-amber-200/40 dark:[&_h3]:text-stone-100 dark:[&_strong]:text-stone-100 dark:[&_td]:border-white/10 dark:[&_th]:border-white/20">
                  {section.content}
                </div>
              </section>
            ))}
            <a
              href="#main-content"
              className={`mt-6 inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-amber-900 underline underline-offset-4 dark:text-amber-200 ${focusStyle}`}
            >
              Back to top
              <ArrowUp className="size-4" aria-hidden="true" />
            </a>
          </article>
        </div>
      </main>

      <footer className="border-t border-stone-200 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-7 text-sm sm:px-8">
          <p className="text-stone-500 dark:text-stone-400">
            Samiati · Preserving language. Respecting people.
          </p>
          <a
            href="mailto:hasb8882@gmail.com"
            className={`inline-flex items-center gap-1 rounded-sm font-medium text-amber-900 dark:text-amber-200 ${focusStyle}`}
          >
            Contact Samiati <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </div>
      </footer>
    </div>
  );
}
