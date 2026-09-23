'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  DEFAULT_CONSENT,
  type ConsentState,
  type StoredConsent,
  detectJurisdiction,
  emitConsent,
  isGlobalPrivacyControlEnabled,
  readStoredConsent,
  shouldShowBanner,
  subscribeToConsent,
  writeStoredConsent,
} from '@/lib/cookieConsent';

export interface CookieConsentContextValue {
  /** Current effective consent state (necessary is always true). */
  consent: ConsentState;
  /** Whether the banner is currently visible to the user. */
  showBanner: boolean;
  /** Whether the preferences modal is open. */
  isPreferencesOpen: boolean;
  /** Jurisdiction the banner is tuned for. */
  jurisdiction: ReturnType<typeof detectJurisdiction>;
  /** Persist a full consent state and close the banner. */
  saveConsent: (state: ConsentState) => void;
  /** Open the preferences modal. */
  openPreferences: () => void;
  /** Close the preferences modal (without saving). */
  closePreferences: () => void;
  /** Persist preferences from the modal toggles. */
  savePreferences: (state: ConsentState) => void;
  /** Withdraw all non-essential consent (equivalent to "Reject all"). */
  rejectAll: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return ctx;
}

interface Props {
  children: ReactNode;
}

/**
 * CookieConsentProvider
 *
 * Owns the single source of truth for cookie consent. It:
 *   - Detects jurisdiction and decides whether to show the banner.
 *   - Honors Global Privacy Control (CCPA/CPRA).
 *   - Persists consent to localStorage with a versioned, timestamped record.
 *   - Emits consent changes to third-party tags via the consent event bus.
 *   - Never blocks the render tree — the banner overlays content.
 *
 * All client-only state is initialized lazily so the server render is
 * deterministic (no hydration mismatch) and no setState-in-effect is needed.
 */
export function CookieConsentProvider({ children }: Props) {
  // Lazy initializers run once on both server and client. On the server,
  // navigator/window are undefined, so defaults are returned deterministically.
  const [jurisdiction] = useState<ReturnType<typeof detectJurisdiction>>(() =>
    detectJurisdiction()
  );

  const [consent, setConsent] = useState<ConsentState>(() => {
    if (typeof window === 'undefined') return DEFAULT_CONSENT;
    // GPC overrides stored consent — honor the browser-level opt-out signal.
    if (isGlobalPrivacyControlEnabled()) return DEFAULT_CONSENT;
    const stored = readStoredConsent();
    if (stored) {
      return {
        necessary: true,
        analytics: Boolean(stored.analytics),
        marketing: Boolean(stored.marketing),
      };
    }
    return DEFAULT_CONSENT;
  });

  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [hydrated] = useState(() => typeof window !== 'undefined');

  // Keep a ref to the latest consent so listeners always see it.
  const consentRef = useRef<ConsentState>(consent);

  // Derived: show the banner only when the user hasn't decided yet and the
  // jurisdiction requires an opt-in. Computed during render (no effect).
  const showBanner =
    hydrated &&
    !isGlobalPrivacyControlEnabled() &&
    !readStoredConsent() &&
    shouldShowBanner(jurisdiction);

  // Whenever consent changes, notify third-party tags.
  useEffect(() => {
    emitConsent(consent);
  }, [consent]);

  // Subscribe to external consent changes (e.g., from another tab). setState
  // here is allowed because it's driven by an external subscription.
  useEffect(() => {
    const unsubscribe = subscribeToConsent((state) => {
      setConsent(state);
      consentRef.current = state;
    });
    return unsubscribe;
  }, []);

  const persist = useCallback((state: ConsentState) => {
    writeStoredConsent(state);
    consentRef.current = state;
    setConsent(state);
    setIsPreferencesOpen(false);
  }, []);

  const saveConsent = useCallback(
    (state: ConsentState) => persist({ ...state, necessary: true }),
    [persist]
  );

  const rejectAll = useCallback(() => {
    persist({ ...DEFAULT_CONSENT });
  }, [persist]);

  const openPreferences = useCallback(() => {
    setIsPreferencesOpen(true);
  }, []);

  const closePreferences = useCallback(() => {
    setIsPreferencesOpen(false);
  }, []);

  const savePreferences = useCallback(
    (state: ConsentState) => persist({ ...state, necessary: true }),
    [persist]
  );

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      consent,
      showBanner,
      isPreferencesOpen,
      jurisdiction,
      saveConsent,
      openPreferences,
      closePreferences,
      savePreferences,
      rejectAll,
    }),
    [
      consent,
      showBanner,
      isPreferencesOpen,
      jurisdiction,
      saveConsent,
      openPreferences,
      closePreferences,
      savePreferences,
      rejectAll,
    ]
  );

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

// Re-export types & constants for consumers that don't want a deep import path.
export { CONSENT_STORAGE_KEY, CONSENT_VERSION, DEFAULT_CONSENT, type StoredConsent };
