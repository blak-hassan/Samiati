'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useCookieConsent } from './CookieConsentProvider';

interface PreferenceState {
  analytics: boolean;
  marketing: boolean;
}

/**
 * CookiePreferencesModal
 *
 * A modal (Radix-free, focus-trapping overlay) that lets users toggle each
 * non-essential category. Necessary cookies cannot be disabled. Changes are
 * only persisted when the user taps "Save preferences"; cancelling keeps the
 * previous state.
 *
 * The overlay only mounts while open, so its useState initializer always
 * reads the latest consent — no setState-in-effect is needed to reset the
 * draft between opens.
 */
export function CookiePreferencesModal() {
  const { isPreferencesOpen, closePreferences } = useCookieConsent();

  if (!isPreferencesOpen) return null;

  return <PreferencesOverlay onClose={closePreferences} />;
}

function PreferencesOverlay({ onClose }: { onClose: () => void }) {
  const { consent, savePreferences } = useCookieConsent();
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const lastFocusRef = useRef<HTMLButtonElement>(null);

  // Read the latest consent at mount time. Because this overlay only mounts
  // while the modal is open, the initializer always reflects the freshest
  // state — no effect-based reset required.
  const [draft, setDraft] = useState<PreferenceState>({
    analytics: consent.analytics,
    marketing: consent.marketing,
  });

  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    const timer = window.requestAnimationFrame(() => {
      firstFocusRef.current?.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
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
    return () => {
      window.cancelAnimationFrame(timer);
      el.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const toggle = (key: keyof PreferenceState) => (checked: boolean) => {
    setDraft((prev) => ({ ...prev, [key]: checked }));
  };

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-prefs-title"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-5 shadow-2xl">
        <div className="mb-5 flex items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CookieIcon className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 id="cookie-prefs-title" className="text-base font-bold text-foreground">
              Cookie preferences
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose which cookies Samiati may use. You can change these at any time.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <PreferenceRow
            title="Strictly necessary cookies"
            description="Required for authentication, security, and core features. Cannot be turned off."
            checked={true}
            disabled={true}
            onChange={() => {}}
          />
          <PreferenceRow
            title="Analytics"
            description="Anonymous usage data (page views, feature engagement) via Vercel Analytics. Helps us improve the product."
            checked={draft.analytics}
            onChange={toggle('analytics')}
          />
          <PreferenceRow
            title="Marketing"
            description="Ads, retargeting, and social embeds. Disabled by default."
            checked={draft.marketing}
            onChange={toggle('marketing')}
          />
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button ref={lastFocusRef} variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            ref={firstFocusRef}
            variant="outline"
            size="sm"
            onClick={() => savePreferences({ necessary: true, ...draft })}
          >
            Save preferences
          </Button>
        </div>
      </div>
    </div>
  );
}

function PreferenceRow({
  title,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className={cn('shrink-0', disabled && 'opacity-60')}
        aria-label={title}
      />
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
