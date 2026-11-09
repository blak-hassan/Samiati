import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Brand } from '@/components/product/Brand';
import { ThemeToggle } from '@/components/product/ThemeToggle';
import { Button } from '@/components/ui/button';

export function PublicHeader() {
  return (
    <header className="relative z-20 border-b border-border/70">
      <div className="product-container flex min-h-20 items-center justify-between gap-2">
        <Brand />
        <nav
          aria-label="Public navigation"
          className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground md:flex"
        >
          <Link href="/languages" className="rounded-sm hover:text-foreground">
            Languages
          </Link>
          <Link href="/dashboard/changa" className="rounded-sm hover:text-foreground">
            Changa
          </Link>
          <Link href="/pricing" className="rounded-sm hover:text-foreground">
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-1 sm:gap-3">
          <ThemeToggle />
          <Button asChild variant="outline" className="min-h-11 rounded-full px-3 sm:px-5">
            <Link href="/dashboard">
              <span className="hidden sm:inline">Open chat</span>
              <span className="sm:hidden">Chat</span>
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
