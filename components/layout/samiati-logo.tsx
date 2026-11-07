import { cn } from "@/lib/utils";

export interface SamiatiLogoProps {
  className?: string;
  /** Renders only the mark, without the wordmark. */
  markOnly?: boolean;
}

/**
 * The Samiati mark.
 *
 * Three dots in a rounded triangle read as "many languages, one conversation".
 * The gradient is the brand's espresso-to-bronze ramp.
 */
export function SamiatiLogo({ className, markOnly }: SamiatiLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-espresso-700 via-espresso-600 to-bronze-600 shadow-sm"
        aria-hidden
      >
        <svg
          viewBox="0 0 32 32"
          className="h-5 w-5"
          role="presentation"
          focusable="false"
        >
          <circle cx="16" cy="10.5" r="3.1" fill="#fdf9f3" />
          <circle cx="11" cy="20" r="3.1" fill="#fdf9f3" opacity="0.92" />
          <circle cx="21" cy="20" r="3.1" fill="#fdf9f3" opacity="0.92" />
        </svg>
      </span>
      {!markOnly ? (
        <span className="font-display text-lg font-semibold tracking-tight">
          Samiati
        </span>
      ) : null}
    </span>
  );
}
