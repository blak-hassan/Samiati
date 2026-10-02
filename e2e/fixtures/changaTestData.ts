/**
 * TEMPORARY Changa e2e fixtures — re-export shim.
 *
 * The data lives in `src/lib/changaTestData.ts`, which is what
 * `src/hooks/useChangaData.ts` imports for the dev-only fallback. This path is
 * kept so Playwright specs can import the same fixtures without reaching across
 * layers, and so the app fallback and specs share one source of truth.
 */
export * from '../../src/lib/changaTestData';
