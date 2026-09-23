// src/components/turnstile/TurnstileProvider.tsx
// Loads the Turnstile script exactly once and exposes readiness to any
// descendant widget. Renders nothing itself; the script is loaded with
// afterInteractive so it never blocks the first paint.
'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import Script from 'next/script';

interface TurnstileContextValue {
  isReady: boolean;
  // Incremented whenever the script arrives after mount, so widgets that
  // rendered before the script was ready can re-initialise.
  bump: number;
}

const TurnstileContext = createContext<TurnstileContextValue>({
  isReady: false,
  bump: 0,
});

export function useTurnstile() {
  return useContext(TurnstileContext);
}

function markReady(setIsReady: (v: boolean) => void, setBump: (fn: (n: number) => number) => void) {
  // Defer the state update so it never cascades from within the effect.
  queueMicrotask(() => {
    setIsReady(true);
    setBump((n) => n + 1);
  });
}

export function TurnstileProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('turnstile' in window) {
      markReady(setIsReady, setBump);
      return;
    }
    // The next/script loads asynchronously; poll until the global appears.
    const id = window.setInterval(() => {
      if ('turnstile' in window) {
        window.clearInterval(id);
        markReady(setIsReady, setBump);
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [setIsReady, setBump]);

  useEffect(() => {
    if (isReady) {
      queueMicrotask(() => setBump((n) => n + 1));
    }
  }, [isReady]);

  const value = useMemo<TurnstileContextValue>(
    () => ({ isReady, bump }),
    [isReady, bump],
  );

  return (
    <TurnstileContext.Provider value={value}>
      {children}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        crossOrigin="anonymous"
        onError={() => {
          // Script failed to load — widgets will show a static fallback
          // message instead of crashing the form.
          console.warn('[turnstile] script failed to load');
        }}
      />
    </TurnstileContext.Provider>
  );
}