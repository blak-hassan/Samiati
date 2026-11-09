import Link from 'next/link';
import { Brand } from '@/components/product/Brand';
import LegalLinks from '@/components/legal/LegalLinks';

export function PublicFooter() {
  return (
    <footer className="border-t border-border py-10">
      <div className="product-container flex flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="space-y-3">
            <Brand />
            <p className="max-w-xs text-sm text-muted-foreground">
              A wider world, in the language you call home.
            </p>
          </div>
          <nav
            aria-label="Footer navigation"
            className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm text-muted-foreground"
          >
            <Link className="min-h-8 hover:text-foreground" href="/languages">
              Languages
            </Link>
            <Link className="min-h-8 hover:text-foreground" href="/dashboard/discover">
              Discover
            </Link>
            <Link className="min-h-8 hover:text-foreground" href="/dashboard/changa">
              Changa
            </Link>
            <Link className="min-h-8 hover:text-foreground" href="/pricing">
              Pricing
            </Link>
            <Link className="min-h-8 hover:text-foreground" href="/onboarding">
              Get started
            </Link>
            <Link className="min-h-8 hover:text-foreground" href="/dashboard/settings">
              Settings
            </Link>
          </nav>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground">
          <span>Samiati · Built around language.</span>
          <LegalLinks />
        </div>
      </div>
    </footer>
  );
}
