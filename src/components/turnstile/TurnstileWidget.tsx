// src/components/turnstile/TurnstileWidget.tsx
// Renders a single Cloudflare Turnstile widget and exposes a getToken()
// promise that resolves with the challenge token (or rejects on timeout /
// when the script is unavailable). Used by forms that submit to a
// server action — the token is sent alongside the form data and verified
// server-side.
'use client';

import { useEffect, useRef, useState } from 'react';
import { useTurnstile } from './TurnstileProvider';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
const TOKEN_TIMEOUT_MS = 30_000;

interface TurnstileRenderOptions {
  sitekey: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  callback: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
}

type TurnstileExecuteCallbacks = Pick<
  TurnstileRenderOptions,
  'callback' | 'expired-callback' | 'error-callback'
>;

interface TurnstileApi {
  render: (el: HTMLElement, options: TurnstileRenderOptions) => string;
  remove: (id: string) => void;
  execute: (options: { sitekey: string }, callbacks: TurnstileExecuteCallbacks) => void;
}

interface TurnstileWindow extends Window {
  turnstile?: TurnstileApi;
}

const TW = (typeof window === 'undefined' ? undefined : window) as
  | TurnstileWindow
  | undefined;

function getTurnstile(): TurnstileApi | undefined {
  return TW?.turnstile;
}

interface TurnstileWidgetProps {
  /** Called with the token once the challenge completes. */
  onToken: (token: string) => void;
  /** Called when the challenge expires and needs a refresh. */
  onExpire?: () => void;
  /** Turnstile theme. Defaults to auto. */
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
}

export function TurnstileWidget({
  onToken,
  onExpire,
  theme = 'auto',
  size = 'normal',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'ready' | 'solving' | 'done' | 'error'>(
    'idle',
  );
  const { isReady, bump } = useTurnstile();

  // Re-initialise whenever the script becomes ready or the component
  // re-mounts (e.g. after an error).
  useEffect(() => {
    if (!isReady || !SITE_KEY) return;
    const el = containerRef.current;
    if (!el) return;
    if (widgetIdRef.current) {
      try {
        getTurnstile()?.remove(widgetIdRef.current);
      } catch {
        // ignore
      }
    }
    el.innerHTML = '';
    let cancelled = false;
    let timer: number | undefined;

    const render = () => {
      const turnstile = getTurnstile();
      if (!turnstile || !turnstile.render) {
        setStatus('error');
        return;
      }
      try {
        widgetIdRef.current = turnstile.render(el, {
          sitekey: SITE_KEY,
          theme,
          size,
          callback: (token: string) => {
            setStatus('done');
            onToken(token);
          },
          'expired-callback': () => {
            setStatus('idle');
            onExpire?.();
          },
          'error-callback': () => {
            setStatus('error');
          },
        });
        setStatus('ready');
      } catch (e) {
        console.error('[turnstile] render failed', e);
        setStatus('error');
      }
    };

    // The script may not have fully parsed when isReady flips; poll briefly.
    if (!getTurnstile()) {
      timer = window.setInterval(() => {
        if (getTurnstile()) {
          window.clearInterval(timer);
          render();
        }
      }, 100);
    } else {
      render();
    }

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
      if (widgetIdRef.current) {
        try {
          getTurnstile()?.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, bump, theme, size]);

  if (!SITE_KEY) {
    return (
      <div
        ref={containerRef}
        className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        Verification unavailable — set NEXT_PUBLIC_TURNSTILE_SITE_KEY.
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div
        ref={containerRef}
        className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-xs text-destructive"
        role="status"
        aria-live="polite"
      >
        Verification failed to load. Please refresh and try again.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex justify-center" aria-live="polite">
      {status === 'idle' || status === 'ready' ? (
        <span className="text-xs text-muted-foreground">Verifying you are human…</span>
      ) : status === 'solving' ? (
        <span className="text-xs text-muted-foreground">Complete the challenge</span>
      ) : null}
    </div>
  );
}

/**
 * Resolve a Turnstile token, with a timeout, for use outside a React event
 * handler (e.g. inside a Server Action's form-data path is not possible —
 * the token is captured by onToken above and stored in form state).
 */
export function getTurnstileToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const turnstile = getTurnstile();
    if (!turnstile) {
      reject(new Error('Turnstile not available'));
      return;
    }
    const id = window.setTimeout(() => {
      reject(new Error('Turnstile timeout'));
    }, TOKEN_TIMEOUT_MS);
    try {
      turnstile.execute(
        { sitekey: SITE_KEY },
        {
          callback: (token: string) => {
            window.clearTimeout(id);
            resolve(token);
          },
          'error-callback': () => {
            window.clearTimeout(id);
            reject(new Error('Turnstile error'));
          },
          'expired-callback': () => {
            window.clearTimeout(id);
            reject(new Error('Turnstile expired'));
          },
        },
      );
    } catch (e) {
      window.clearTimeout(id);
      reject(e as Error);
    }
  });
}