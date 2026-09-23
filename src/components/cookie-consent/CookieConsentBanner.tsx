'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCookieConsent } from './CookieConsentProvider';

/**
 * CookieConsentBanner
 *
 * A fixed, non-blocking overlay banner shown at the bottom of the viewport
 * until the user makes a choice. It offers three actions:
 *   - Accept All
 *   - Reject All
 *   - Manage Preferences (opens the modal)
 *
 * It is keyboard-focusable, uses a dialog role for screen readers, and traps
 * focus within itself while open.
 */
export function CookieConsentBanner() {
  const { showBanner, consent, saveConsent, rejectAll, openPreferences } = useCookieConsent();
  const bannerRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  // Focus the first control on mount so keyboard users land on the banner.
  useEffect(() => {
    if (showBanner) {
      const timer = window.requestAnimationFrame(() => {
        firstFocusRef.current?.focus();
      });
      return () => window.cancelAnimationFrame(timer);
    }
  }, [showBanner]);

  // Trap focus inside the banner while it is open.
  useEffect(() => {
    if (!showBanner) return;
    const el = bannerRef.current;
    if (!el) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = el.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [showBanner]);

  if (!showBanner) return null;

  const acceptAll = () => saveConsent({ necessary: true, analytics: true, marketing: true });

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      suppressHydrationWarning
      className="fixed inset-x-0 bottom-0 z-[9999] border-t border-border/60 bg-card/95 backdrop-blur-md shadow-2xl sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-xl sm:rounded-2xl"
    >
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CookieIcon className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 id="cookie-banner-title" className="text-sm font-bold text-foreground">
              We use cookies to improve Samiati
            </h2>
            <p
              id="cookie-banner-desc"
              className="mt-1 text-xs leading-relaxed text-muted-foreground"
            >
              We and our partners use cookies to enhance your experience, show you relevant content,
              and analyze traffic. Some are strictly necessary for the site to work; the rest
              require your consent.{' '}
              <a
                href="/privacy#cookies"
                className="text-primary underline-offset-2 hover:underline"
              >
                Learn more
              </a>
            </p>
          </div>
        </div>

        {/* Compact current-state summary for returning users who reopen. */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
            <span className="size-1.5 rounded-full bg-rasta-green" />
            Necessary: on
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
              consent.analytics ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            )}
          >
            <span
              className={cn(
                'size-1.5 rounded-full',
                consent.analytics ? 'bg-primary' : 'bg-muted-foreground'
              )}
            />
            Analytics: {consent.analytics ? 'on' : 'off'}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
              consent.marketing ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            )}
          >
            <span
              className={cn(
                'size-1.5 rounded-full',
                consent.marketing ? 'bg-primary' : 'bg-muted-foreground'
              )}
            />
            Marketing: {consent.marketing ? 'on' : 'off'}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button ref={firstFocusRef} variant="ghost" size="sm" onClick={rejectAll}>
            Reject all
          </Button>
          <Button variant="outline" size="sm" onClick={openPreferences}>
            Manage preferences
          </Button>
          <Button variant="default" size="sm" onClick={acceptAll}>
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}

function CookieIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2a5 5 0 0 0-5 5v1H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Z" />
      <path d="M8.5 13h.01M12 13h.01M15.5 13h.01" />
    </svg>
  );
}
