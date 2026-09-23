'use client';

import type { ReactNode } from 'react';
import { useCookieConsent } from './CookieConsentProvider';

/**
 * CookieSettingsLink
 *
 * A small link/button that opens the preferences modal. Place it in a footer,
 * settings page, or anywhere a user might want to revisit their cookie
 * choices — GDPR requires withdrawal to be as easy as giving consent.
 */
export function CookieSettingsLink({
  className,
  children = 'Cookie settings',
}: {
  className?: string;
  children?: ReactNode;
}) {
  const { openPreferences } = useCookieConsent();
  return (
    <button
      type="button"
      onClick={openPreferences}
      className={className}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        color: 'inherit',
        fontFamily: 'inherit',
        fontSize: 'inherit',
      }}
    >
      {children}
    </button>
  );
}
