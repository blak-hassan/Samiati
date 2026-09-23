'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { track } from '@vercel/analytics';

/**
 * Hero / final-CTA button. Must be a client component because it attaches an
 * analytics onClick handler — passing that handler into a server-rendered
 * Link would fail prerender ("Event handlers cannot be passed to Client
 * Component props").
 */
export function HeroCta({
  location = 'hero',
  label = 'Start Learning Free',
}: {
  location?: 'hero' | 'final-cta';
  label?: string;
}) {
  return (
    <Button size="lg" asChild>
      <Link
        href="/sign-up"
        onClick={() => {
          try {
            track('cta_click', { location, plan: 'free' });
          } catch {
            // best-effort
          }
        }}
      >
        {label}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </Button>
  );
}