'use client';

/**
 * Shared call-to-action link with analytics instrumentation.
 *
 * Must be a client component because it attaches an analytics onClick handler —
 * passing that handler into a server-rendered Link would fail prerender
 * ("Event handlers cannot be passed to Client Component props").
 *
 * Used by the hero, final CTA, navbar and pricing cards so *every* primary CTA
 * reports a `cta_click`; previously only the hero/final-CTA reported, leaving
 * the funnel blind to navbar and pricing conversions.
 */
import Link from 'next/link';
import { Button, type buttonVariants } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { track } from '@vercel/analytics';
import type { VariantProps } from 'class-variance-authority';

type CtaVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;
type CtaSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;

export interface TrackedCtaProps {
  /** Destination. `mailto:` links render a plain <a> (see src/lib/plans.ts). */
  href: string;
  /** Funnel location, e.g. 'hero' | 'navbar' | 'pricing'. */
  location: string;
  label: string;
  /** Optional plan identifier attached to the event. */
  plan?: string;
  variant?: CtaVariant;
  size?: CtaSize;
  className?: string;
  /** Append the trailing arrow icon (hero CTAs only). */
  showArrow?: boolean;
}

export function TrackedCta({
  href,
  location,
  label,
  plan,
  variant = 'default',
  size = 'lg',
  className,
  showArrow = false,
}: TrackedCtaProps) {
  const onClick = () => {
    try {
      track('cta_click', { location, plan: plan ?? 'free' });
    } catch {
      // best-effort
    }
  };

  const content = (
    <>
      {label}
      {showArrow && <ArrowRight className="ml-2 h-4 w-4" />}
    </>
  );

  // `mailto:` (and any non-internal scheme) must not go through the Next
  // router — src/lib/plans.ts calls this out explicitly.
  if (/^(mailto:|tel:|https?:\/\/)/.test(href)) {
    return (
      <Button asChild size={size} variant={variant} className={className}>
        <a href={href} onClick={onClick}>
          {content}
        </a>
      </Button>
    );
  }

  return (
    <Button asChild size={size} variant={variant} className={className}>
      <Link href={href} onClick={onClick}>
        {content}
      </Link>
    </Button>
  );
}

/**
 * Hero / final-CTA button.
 *
 * Kept as a thin wrapper so the landing page's existing `<HeroCta />` call sites
 * keep working while sharing one CTA implementation — and one label — with the
 * navbar and the pricing cards.
 *
 * The default label was previously "Start Learning Free" here vs "Get Started
 * Free" on the final CTA vs "Get Started" in the navbar; all three now read
 * "Get Started Free", which also matches the "Free forever plan" reassurance
 * badge directly beneath the hero.
 */
export function HeroCta({
  location = 'hero',
  label = 'Get Started Free',
}: {
  location?: 'hero' | 'final-cta';
  label?: string;
}) {
  return (
    <TrackedCta
      href="/sign-up"
      location={location}
      label={label}
      plan="free"
      size="lg"
      showArrow
    />
  );
}

