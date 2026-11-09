import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface BrandProps {
  className?: string;
  compact?: boolean;
}

/** Abstract conversation mark; it does not represent a cultural symbol. */
export function Brand({ className, compact = false }: BrandProps) {
  return (
    <Link
      href="/"
      aria-label="Samiati home"
      className={cn(
        'inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg text-foreground',
        className
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 32 32"
        fill="none"
        className="size-8 shrink-0 text-primary"
      >
        <path d="M6 6h9v12a8 8 0 0 1-8 8H6V6Z" fill="currentColor" />
        <path d="M18 6h1a8 8 0 0 1 8 8v12h-9V6Z" fill="currentColor" opacity=".55" />
      </svg>
      {!compact && (
        <span className="font-display text-[1.55rem] font-extrabold leading-none tracking-[-0.07em]">
          samiati<span className="text-primary">.</span>
        </span>
      )}
    </Link>
  );
}
