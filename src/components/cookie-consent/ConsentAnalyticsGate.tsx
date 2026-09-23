'use client';

import { useSyncExternalStore } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { useCookieConsent } from './CookieConsentProvider';

/**
 * ConsentAnalyticsGate
 *
 * Renders the Vercel Analytics script ONLY after the user has granted
 * analytics consent. The component is conditionally rendered, so the script
 * is never injected for users who reject analytics — the primary enforcement
 * mechanism. `beforeSend` adds defense-in-depth: even if the script were
 * somehow loaded, events are dropped when consent is withdrawn.
 *
 * `isClient` is derived via useSyncExternalStore so the server render is
 * deterministic (renders null) and the client render matches on first paint,
 * avoiding hydration mismatch without setState-in-effect.
 */
export function ConsentAnalyticsGate() {
  const { consent } = useCookieConsent();

  const isClient = useSyncExternalStore(
    // subscribe — never actually used; consent is local state, not an
    // external store. Returning a no-op unsubscribe keeps the signature valid.
    () => () => {},
    () => true, // getClientSnapshot
    () => false // getServerSnapshot — never analytics on the server
  );

  if (!isClient || !consent.analytics) return null;

  return (
    <Analytics
      beforeSend={(event) => {
        // Hard gate — drop the event if consent was withdrawn after load.
        if (!consent.analytics) return null;
        return event;
      }}
    />
  );
}
