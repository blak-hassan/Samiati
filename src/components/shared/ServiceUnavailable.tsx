import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, PlugZap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ServiceUnavailableProps {
  feature: string;
  description: string;
  active: 'discover' | 'changa' | 'profile' | 'settings';
}

/** Keeps a local preview useful without inventing live account activity. */
export function ServiceUnavailable({ feature, description }: ServiceUnavailableProps) {
  return (
    <div className="min-h-dvh bg-background pb-8">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/50 bg-background/95 px-4 backdrop-blur-md">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link href="/dashboard" aria-label="Back to chat">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="font-display text-lg font-bold tracking-tight">{feature}</h1>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        <section className="mt-5 rounded-2xl border border-border/50 bg-muted/20 p-5">
          <PlugZap className="mb-4 size-7 text-primary" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold">This workspace is not connected yet.</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            This view needs a connected service. No activity, recordings, or contributions are being
            simulated. You can still explore Samiati and change your appearance preferences.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/languages">
                Explore languages
                <ArrowUpRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/settings/appearance">Appearance settings</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
