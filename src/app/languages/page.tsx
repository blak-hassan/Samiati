import type { Metadata } from 'next';
import Link from 'next/link';
import SamiatiLogo from '@/components/SamiatiLogo';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { LANGUAGE_PAGES } from '@/lib/languages';

export const metadata: Metadata = {
  title: 'Languages — Samiati',
  description:
    'Explore the African languages Samiati supports: Swahili, Kikuyu, Luo (Dholuo), Kalenjin, Luhya, Kamba, Somali, and Sheng. Translate, chat, and contribute.',
  alternates: { canonical: '/languages' },
};

export default function LanguagesIndexPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <SamiatiLogo size={36} variant="primary" />
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </nav>

      <main id="main" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-display">Languages we support</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Samiati prioritises Kenyan languages in this release, expanding with community demand.
            Each page below covers the language, its history, and how you can help preserve it.
          </p>
        </div>

        <ul className="mt-10 space-y-3">
          {LANGUAGE_PAGES.map((lang) => (
            <li key={lang.slug}>
              <Link
                href={`/languages/${lang.slug}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card/30 p-4 transition-colors hover:border-primary/40 hover:bg-card/60"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">
                    {lang.name} <span className="text-sm font-normal text-muted-foreground">({lang.nativeName})</span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{lang.tagline}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-2xl border border-border bg-card/30 p-6 text-center">
          <p className="text-sm leading-relaxed text-stone-300">
            Don&apos;t see your language? We build the roadmap with community input.
          </p>
          <p className="mt-2 text-sm text-stone-300">
            <a href="mailto:support@samiati.com" className="text-primary underline hover:no-underline">
              Tell us which language to add
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
