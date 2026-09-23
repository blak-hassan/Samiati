// src/app/not-found.tsx
// Branded 404. Server Component — no client JS, so it stays tiny and fast.
import type { Metadata } from 'next';
import Link from 'next/link';
import SamiatiLogo from '@/components/SamiatiLogo';
import { Button } from '@/components/ui/button';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Page not found — Samiati',
  description: 'The page you were looking for could not be found.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4 py-16 text-center"
    >
      <div className="mb-8">
        <SamiatiLogo size={64} variant="primary" />
      </div>

      <h1 className="text-6xl font-extrabold tracking-tight font-display text-primary">
        404
      </h1>
      <h2 className="mt-4 text-2xl font-bold font-display">
        Page not found
      </h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        The page you were looking for doesn&rsquo;t exist or has been moved.
        Head back to the home page to keep exploring African languages.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Button size="lg" asChild>
          <Link href="/">Back to home</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/pricing">View pricing</Link>
        </Button>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            breadcrumbList: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
              { '@type': 'ListItem', position: 2, name: 'Not found', item: '' },
            ],
          }),
        }}
      />
    </main>
  );
}