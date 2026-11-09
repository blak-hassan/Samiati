'use client';

import Link from 'next/link';
import { Compass, Globe2, HeartHandshake, MessageCircle, Settings2, UserRound } from 'lucide-react';
import { Brand } from './Brand';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type ProductSection = 'chat' | 'discover' | 'languages' | 'changa' | 'profile' | 'settings';

const destinations = [
  { id: 'chat', label: 'Chat', href: '/dashboard', icon: MessageCircle },
  { id: 'discover', label: 'Discover', href: '/dashboard/discover', icon: Compass },
  { id: 'languages', label: 'Languages', href: '/languages', icon: Globe2 },
  { id: 'changa', label: 'Changa', href: '/dashboard/changa', icon: HeartHandshake },
] as const;

/** Consumers reserve bottom space on mobile with `pb-24`. */
export function ProductNav({ active }: { active?: ProductSection }) {
  return (
    <>
      <header className="relative z-30 border-b border-border bg-background">
        <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
          <Brand />
          <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
            {destinations.map(({ id, label, href }) => (
              <Link
                key={id}
                href={href}
                aria-current={active === id ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold transition-colors',
                  active === id
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Open account menu"
                  variant="outline"
                  size="icon"
                  className="size-11 rounded-full"
                >
                  <UserRound aria-hidden="true" className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48 rounded-xl">
                <DropdownMenuLabel>Your Samiati</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="min-h-11">
                  <Link href="/dashboard/profile">
                    <UserRound aria-hidden="true" className="size-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="min-h-11">
                  <Link href="/dashboard/settings">
                    <Settings2 aria-hidden="true" className="size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="min-h-11">
                  <Link href="/pricing">Plans</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-background px-2 pt-1 pb-[max(0.375rem,env(safe-area-inset-bottom))] md:hidden"
      >
        {destinations.map(({ id, label, href, icon: Icon }) => (
          <Link
            key={id}
            href={href}
            aria-current={active === id ? 'page' : undefined}
            className={cn(
              'flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[0.6875rem] font-semibold transition-colors',
              active === id
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:bg-secondary'
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
