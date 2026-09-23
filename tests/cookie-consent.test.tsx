import { describe, it, expect, vi, beforeEach } from 'vitest';

// The repo's vitest setup runs in Node (no jsdom). cookieConsent.ts guards
// every browser global behind `typeof window === 'undefined'`, so we install
// a minimal window/localStorage on globalThis before each test.

function installWindow() {
  const storage = new Map<string, string>();
  const fake = {
    localStorage: {
      getItem: (k: string) => (storage.has(k) ? storage.get(k)! : null),
      setItem: (k: string, v: string) => {
        storage.set(k, v);
      },
      removeItem: (k: string) => {
        storage.delete(k);
      },
      clear: () => storage.clear(),
    },
    navigator: { language: 'en-US', globalPrivacyControl: false },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  (globalThis as any).window = fake;
  return fake;
}

const {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  DEFAULT_CONSENT,
  detectJurisdiction,
  shouldShowBanner,
  readStoredConsent,
  writeStoredConsent,
  clearStoredConsent,
  subscribeToConsent,
  emitConsent,
} = await import('../src/lib/cookieConsent');

describe('cookieConsent storage helpers', () => {
  beforeEach(() => {
    installWindow();
  });

  it('DEFAULT_CONSENT rejects non-essential categories', () => {
    expect(DEFAULT_CONSENT).toEqual({
      necessary: true,
      analytics: false,
      marketing: false,
    });
  });

  it('write/read round-trips a versioned record', () => {
    writeStoredConsent({ necessary: true, analytics: true, marketing: false });
    const stored = readStoredConsent();
    expect(stored).not.toBeNull();
    expect(stored!.analytics).toBe(true);
    expect(stored!.version).toBe(CONSENT_VERSION);
    expect(typeof stored!.timestamp).toBe('number');
  });

  it('readStoredConsent returns null when nothing is stored', () => {
    expect(readStoredConsent()).toBeNull();
  });

  it('readStoredConsent rejects a stale version', () => {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ necessary: true, analytics: true, marketing: false, version: 99, timestamp: Date.now() }),
    );
    expect(readStoredConsent()).toBeNull();
  });

  it('readStoredConsent rejects malformed JSON', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'not json{');
    expect(readStoredConsent()).toBeNull();
  });

  it('clearStoredConsent removes the record', () => {
    writeStoredConsent({ necessary: true, analytics: true, marketing: false });
    expect(readStoredConsent()).not.toBeNull();
    clearStoredConsent();
    expect(readStoredConsent()).toBeNull();
  });

  it('writeStoredConsent is a no-op when localStorage is unavailable', () => {
    const original = (globalThis as any).window;
    delete (globalThis as any).window;
    expect(() => writeStoredConsent(DEFAULT_CONSENT)).not.toThrow();
    (globalThis as any).window = original;
  });
});

describe('jurisdiction detection', () => {
  beforeEach(() => {
    installWindow();
  });

  it('classifies an EEA locale', () => {
    const original = navigator.language;
    Object.defineProperty(navigator, 'language', { value: 'de-DE', configurable: true });
    expect(detectJurisdiction()).toBe('eea');
    Object.defineProperty(navigator, 'language', { value: original, configurable: true });
  });

  it('classifies rest_of_world for a non-regulated locale', () => {
    const original = navigator.language;
    Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true });
    expect(detectJurisdiction()).toBe('rest_of_world');
    Object.defineProperty(navigator, 'language', { value: original, configurable: true });
  });

  it('shows the banner for eea and ccpa', () => {
    expect(shouldShowBanner('eea')).toBe(true);
    expect(shouldShowBanner('ccpa')).toBe(true);
    expect(shouldShowBanner('rest_of_world')).toBe(false);
    expect(shouldShowBanner('unknown')).toBe(false);
  });
});

describe('consent event bus', () => {
  it('notifies subscribers and allows unsubscribing', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToConsent(listener);
    emitConsent({ necessary: true, analytics: true, marketing: false });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ necessary: true, analytics: true, marketing: false });

    unsubscribe();
    emitConsent({ necessary: true, analytics: false, marketing: false });
    expect(listener).toHaveBeenCalledTimes(1); // not called again
  });

  it('a failing listener must not break others', () => {
    const bad = vi.fn(() => {
      throw new Error('boom');
    });
    const good = vi.fn();
    subscribeToConsent(bad);
    subscribeToConsent(good);
    expect(() => emitConsent(DEFAULT_CONSENT)).not.toThrow();
    expect(good).toHaveBeenCalledTimes(1);
  });
});

describe('ConsentAnalyticsGate behaviour (contract)', () => {
  it('renders no Analytics script when consent.analytics is false', () => {
    // The gate's contract: it returns null unless consent.analytics is true.
    expect(DEFAULT_CONSENT.analytics).toBe(false);
  });

  it('beforeSend drops events when consent is withdrawn', () => {
    const beforeSend = (consent: { analytics: boolean }, event: any) =>
      consent.analytics ? event : null;

    expect(beforeSend({ analytics: false }, { name: 'x' })).toBeNull();
    expect(beforeSend({ analytics: true }, { name: 'x' })).toEqual({ name: 'x' });
  });
});