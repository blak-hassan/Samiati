import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SamiatiLogo from '@/components/SamiatiLogo';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Users, Globe2, Sparkles } from 'lucide-react';
import { getLanguageBySlug, LANGUAGE_PAGE_SLUGS } from '@/lib/languages';
import { OG_IMAGE_PATH, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, absoluteUrl } from '@/lib/seo';

type Params = { slug: string };

// Pre-render every language page at build time; unknown slugs 404.
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return LANGUAGE_PAGE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lang = getLanguageBySlug(slug);
  if (!lang) return { title: 'Language not found — Samiati' };

  const title = `${lang.name} (${lang.nativeName}) — AI Translation & Preservation | Samiati`;
  const description = `Learn about ${lang.name} — ${lang.speakers} in ${lang.region}. Translate, chat, and contribute to ${lang.name} preservation with Samiati's AI.`;

  return {
    title,
    description,
    alternates: { canonical: `/languages/${lang.slug}` },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/languages/${lang.slug}`),
      type: 'article',
      images: [
        { url: OG_IMAGE_PATH, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: `Samiati — ${lang.name}` },
      ],
    },
    twitter: { card: 'summary_large_image', images: [OG_IMAGE_PATH] },
  };
}

export default async function LanguagePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const lang = getLanguageBySlug(slug);
  if (!lang) notFound();

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <SamiatiLogo size={36} variant="primary" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/languages"
              className="text-foreground/70 hover:text-foreground transition-colors"
            >
              All languages
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <main id="main" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold font-display">
            {lang.name} <span className="text-xl font-normal text-muted-foreground">({lang.nativeName})</span>
          </h1>
          <p className="mt-2 text-md text-muted-foreground">{lang.tagline}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-stone-300">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
              <Users className="h-3 w-3" aria-hidden="true" /> {lang.speakers}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
              <MapPin className="h-3 w-3" aria-hidden="true" /> {lang.region}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
              <Globe2 className="h-3 w-3" aria-hidden="true" /> {lang.family}
            </span>
          </div>
        </div>

        <section className="mt-10 space-y-3 text-sm leading-relaxed text-stone-300">
          <h2 className="text-lg font-bold text-foreground">About {lang.name}</h2>
          <p>{lang.overview}</p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-stone-300">
          <h2 className="text-lg font-bold text-foreground">History &amp; culture</h2>
          <p>{lang.history}</p>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-bold text-foreground">What makes {lang.name} special</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-stone-300">
            {lang.facts.map((fact) => (
              <li key={fact} className="flex gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="mt-8">
          <h2 className="text-lg font-bold text-foreground">A few words to start with</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <tbody>
                {lang.phrases.map((phrase) => (
                  <tr key={phrase.text} className="border-b border-border/50 last:border-b-0">
                    <td className="px-4 py-3 font-semibold text-foreground">{phrase.text}</td>
                    <td className="px-4 py-3 text-stone-300">{phrase.translation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {lang.dialects && (
            <p className="mt-3 text-xs text-muted-foreground">
              Dialects and varieties include: {lang.dialects.join(', ')}.
            </p>
          )}
        </section>

        <section className="mt-12 rounded-2xl border border-border bg-card/30 p-6 text-center">
          <h2 className="text-lg font-bold text-foreground">
            Translate, chat, and learn {lang.name} with Samiati
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-300">
            Samiati&apos;s AI understands {lang.nllbCode ? 'and translates ' : ''}{lang.name} with
            cultural context — and you can help preserve it by contributing through Changa.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/sign-up">Start free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/languages">Explore other languages</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
