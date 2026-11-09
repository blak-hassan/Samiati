import Link from 'next/link';
import { ArrowUpRight, PlugZap } from 'lucide-react';
import { ProductNav } from '@/components/product/ProductNav';
import { PageIntro } from '@/components/product/PageIntro';
import { Button } from '@/components/ui/button';

interface ServiceUnavailableProps {
  feature: string;
  description: string;
  active: 'discover' | 'changa' | 'profile' | 'settings';
}

/** Keeps a local preview useful without inventing live account activity. */
export function ServiceUnavailable({ feature, description, active }: ServiceUnavailableProps) {
  return (
    <div className="min-h-dvh bg-background pb-24">
      <ProductNav active={active} />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <PageIntro eyebrow="Samiati" title={feature} description={description} />
        <section className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-10">
          <PlugZap className="mb-5 size-8 text-ai" aria-hidden="true" />
          <h2 className="text-xl font-semibold">This workspace is not connected yet.</h2>
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
