import Link from 'next/link';
import SamiatiLogo from '@/components/SamiatiLogo';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Globe2, Users, Mic, BookOpen } from 'lucide-react';

export const metadata = {
  title: 'About — Samiati',
  description:
    'Samiati builds AI that speaks African languages — translation, chat, and voice — powered by a community that contributes and preserves them.',
};

const pillars = [
  {
    icon: Globe2,
    title: 'AI that respects context',
    body: 'Translation and chat tuned for African languages — not a bolt-on to models trained elsewhere.',
  },
  {
    icon: Mic,
    title: 'Voice, not just text',
    body: 'Speech-to-text and text-to-speech for tonal languages and regional accents.',
  },
  {
    icon: Users,
    title: 'Community-powered',
    body: 'Changa turns language preservation into a shared project, with consent and attribution.',
  },
  {
    icon: BookOpen,
    title: 'Cultural depth',
    body: 'Proverbs, stories, and oral histories treated as first-class content.',
  },
];

export default function AboutPage() {
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
        <h1 className="text-3xl font-bold font-display">About Samiati</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-300">
          Samiati is a platform for the preservation and revitalization of African languages and
          cultural heritage. We build AI that speaks African languages — for translation, chat, and
          voice — and we build it with the communities who speak them.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {pillars.map((p) => (
            <div key={p.title} className="rounded-xl border border-border bg-card/30 p-5">
              <p.icon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="mt-3 text-md font-semibold text-white">{p.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-300">{p.body}</p>
            </div>
          ))}
        </div>

        <section className="mt-12 space-y-4 text-sm leading-relaxed text-stone-300">
          <h2 className="text-lg font-bold text-white">Why this matters</h2>
          <p>
            Most of the world&apos;s AI understands only a handful of languages. African languages —
            spoken by hundreds of millions — are drastically under-represented in the data that
            models learn from. When a language is missing from AI, its speakers are missing from the
            digital world.
          </p>
          <p>
            Samiati&apos;s approach is two-sided: ship genuinely useful tools today — chat,
            translation, voice — and build the underlying data openly with consented community
            contributions through Changa. Every validated contribution strengthens the models, and
            contributors stay in control of how their work is used.
          </p>
          <p>
            Samiati is headquartered in Nairobi, Kenya, and built with input from speakers of
            Swahili, Kikuyu, Dholuo, Kamba, Kalenjin, Luhya, Somali, and Sheng — with more languages
            on the roadmap as the community grows.
          </p>
        </section>

        <div className="mt-12 rounded-2xl border border-border bg-card/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Questions or partnership ideas?{' '}
            <a href="mailto:support@samiati.com" className="text-primary underline hover:no-underline">
              Contact us
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
