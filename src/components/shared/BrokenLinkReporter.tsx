// src/components/shared/BrokenLinkReporter.tsx
// Client-side reporter of 4xx/5xx responses. Mounts once in the root layout.
//
// It monkey-patches `fetch` and `XMLHttpRequest` so that any failed API call
// or navigation that surfaces as a network error is captured and forwarded
// to Sentry. It is deliberately silent: no console spam, no UI, and it is
// a no-op when Sentry is unavailable (demo mode, test env).
'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

const SILENT_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '192.168.100.5',
  'samiati-10.vercel.app',
]);

function isSameOrigin(url: string): boolean {
  try {
    const u = new URL(url, window.location.origin);
    return u.origin === window.location.origin;
  } catch {
    return false;
  }
}

function shouldIgnore(url: string): boolean {
  if (!isSameOrigin(url)) return true; // only track app requests
  if (url.includes('/_next/')) return true; // dev HMR noise
  if (url.includes('/__clerk/')) return true; // Clerk handshake noise
  return false;
}

export function BrokenLinkReporter() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const origFetch = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : (input as Request).url;
      return origFetch(input as RequestInfo, init).then(
        (res) => {
          if (res.ok) return res;
          if (shouldIgnore(url)) return res;
          try {
            Sentry.captureMessage(`HTTP ${res.status} ${url}`, {
              level: 'error',
              tags: { kind: 'broken-link-reporter', status: String(res.status) },
            });
          } catch {
            // Sentry may throw in restricted environments; swallow.
          }
          return res;
        },
        (err) => {
          // Network failure (not a status). Only report same-origin failures.
          if (typeof url === 'string' && !shouldIgnore(url)) {
            try {
              Sentry.captureMessage(`Network error ${url}`, {
                level: 'error',
                tags: { kind: 'broken-link-reporter', network: 'true' },
              });
            } catch {
              // swallow
            }
          }
          throw err;
        }
      );
    };

    // XHR fallback for libraries that don't use fetch.
    const XHR = window.XMLHttpRequest;
    const open = XHR.prototype.open;
    const send = XHR.prototype.send;
    XHR.prototype.open = function (this: XMLHttpRequest, method: string, url: string | URL, ...rest: unknown[]) {
      (this as unknown as { _reporterUrl: string })._reporterUrl =
        typeof url === 'string' ? url : url.toString();
      return open.apply(this, [method, url, ...rest] as unknown as Parameters<typeof open>);
    };
    XHR.prototype.send = function (this: XMLHttpRequest, body?: Document | XMLHttpRequestBodyInit | null) {
      this.addEventListener('loadend', () => {
        if (this.status >= 400) {
          const url = (this as unknown as { _reporterUrl?: string })._reporterUrl ?? '';
          if (!shouldIgnore(url)) {
            try {
              Sentry.captureMessage(`HTTP ${this.status} ${url}`, {
                level: 'error',
                tags: { kind: 'broken-link-reporter', status: String(this.status) },
              });
            } catch {
              // swallow
            }
          }
        }
      });
      return send.call(this, body);
    };

    return () => {
      window.fetch = origFetch;
      XHR.prototype.open = open;
      XHR.prototype.send = send;
    };
  }, []);

  return null;
}