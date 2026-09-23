/**
 * Cookie consent — shared logic, types, and storage helpers.
 *
 * This module is intentionally framework-agnostic (no React imports) so it can
 * be imported from both the provider and any server/client boundary safely.
 * It must never log or persist PII.
 */

// ---------------------------------------------------------------------------
// Consent categories
// ---------------------------------------------------------------------------

export const CONSENT_CATEGORIES = {
  necessary: 'necessary', // strictly necessary — exempt, always on
  analytics: 'analytics', // Vercel Analytics / usage stats
  marketing: 'marketing', // ads, retargeting, social embeds
} as const;

export type ConsentCategory = (typeof CONSENT_CATEGORIES)[keyof typeof CONSENT_CATEGORIES];

export type ConsentState = {
  necessary: true; // always granted; cannot be toggled off
  analytics: boolean;
  marketing: boolean;
};

export type StoredConsent = ConsentState & {
  version: number;
  timestamp: number; // ms since epoch
};

export const CONSENT_STORAGE_KEY = 'samiati_cookie_consent_v1';
export const CONSENT_VERSION = 1;

// ---------------------------------------------------------------------------
// Defaults — GDPR-compliant default is REJECTION of non-essential cookies.
// ---------------------------------------------------------------------------

export const DEFAULT_CONSENT: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
};

// ---------------------------------------------------------------------------
// Region gating
// ---------------------------------------------------------------------------

/**
 * Determines whether a cookie banner must be shown based on the user's
 * location. We only gate for jurisdictions with an opt-in requirement:
 *   - EEA / UK / CH (GDPR + ePrivacy)
 *
 * For CCPA/CPRA (California) we still show the banner but offer opt-out
 * rather than opt-in for analytics; the same UI handles both.
 */
export type ConsentJurisdiction = 'eea' | 'ccpa' | 'rest_of_world' | 'unknown';

/**
 * Best-effort ISO-3166 country code from the browser's navigator.language.
 * Returns null when unavailable (SSR / restricted environments).
 */
export function detectJurisdiction(): ConsentJurisdiction {
  if (typeof navigator === 'undefined' || !navigator.language) return 'unknown';

  const lang = navigator.language.toLowerCase();
  const region = lang.split('-')[1]?.toUpperCase() ?? '';

  // EEA + UK + CH
  const eeaRegions = new Set([
    'AT',
    'BE',
    'BG',
    'CY',
    'CZ',
    'DE',
    'DK',
    'EE',
    'ES',
    'FI',
    'FR',
    'GR',
    'HR',
    'HU',
    'IE',
    'IT',
    'LT',
    'LU',
    'LV',
    'MT',
    'NL',
    'PL',
    'PT',
    'RO',
    'SE',
    'SI',
    'SK',
    'IS',
    'LI',
    'NO',
    'UK',
    'CH',
  ]);

  if (eeaRegions.has(region)) return 'eea';

  // California
  if (region === 'US-CA') return 'ccpa';

  return 'rest_of_world';
}

export function shouldShowBanner(jurisdiction: ConsentJurisdiction): boolean {
  // Only EEA strictly requires an opt-in banner. CCPA is opt-out but we still
  // surface the same banner for transparency and to honor GPC.
  return jurisdiction === 'eea' || jurisdiction === 'ccpa';
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

function isStorageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readStoredConsent(): StoredConsent | null {
  if (!isStorageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    // Reject malformed / legacy records we cannot trust.
    if (parsed.version !== CONSENT_VERSION) return null;
    if (typeof parsed.timestamp !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredConsent(state: ConsentState): void {
  if (!isStorageAvailable()) return;
  const record: StoredConsent = {
    ...state,
    version: CONSENT_VERSION,
    timestamp: Date.now(),
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Storage full / private mode — consent is best-effort.
  }
}

export function clearStoredConsent(): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Global Privacy Control (CCPA/CPRA — browser-level opt-out signal)
// ---------------------------------------------------------------------------

export function isGlobalPrivacyControlEnabled(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'globalPrivacyControl' in navigator && navigator.globalPrivacyControl === true;
}

// ---------------------------------------------------------------------------
// Consent event bus — a tiny pub/sub so analytics/marketing tags can react to
// consent changes without each importing the provider directly.
// ---------------------------------------------------------------------------

type ConsentListener = (state: ConsentState) => void;
const listeners = new Set<ConsentListener>();

export function subscribeToConsent(listener: ConsentListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitConsent(state: ConsentState): void {
  listeners.forEach((fn) => {
    try {
      fn(state);
    } catch {
      // A failing listener must not break others.
    }
  });
}
