/**
 * Demo mode is only a development convenience. In production, a missing
 * Convex URL or Clerk publishable key is a misconfiguration that should
 * surface as a runtime error, not silently fall back to mock providers
 * (which would serve real users with no auth and no database).
 */
export const isDemoMode: boolean =
  process.env.NODE_ENV !== "production" &&
  (!process.env.NEXT_PUBLIC_CONVEX_URL ||
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_"));

/**
 * Whether the current environment is permitted to enter demo mode. Always
 * false in production. Use this for explicit guards in code paths where
 * you want to throw rather than silently fall through.
 */
export const isDemoModeAllowed = (): boolean =>
  process.env.NODE_ENV !== "production";

export const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

/**
 * Warn in development if any NEXT_PUBLIC_ variable looks like a secret.
 * NEXT_PUBLIC_ variables are exposed to the browser — only non-secret
 * values (URLs, publishable keys, public config) should use this prefix.
 */
if (process.env.NODE_ENV !== "production") {
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith("NEXT_PUBLIC_") || !value) continue;
    if (
      /^(sk_|sk_test_|sk_live_|pk_live_)/.test(value) ||
      /(secret|token|password|api_key|apikey)/i.test(key)
    ) {
      console.warn(
        `[SECURITY WARNING] Environment variable ${key} is prefixed NEXT_PUBLIC_ and may be exposed to the browser. ` +
          `If this is a secret, remove the NEXT_PUBLIC_ prefix and store it server-side only.`
      );
    }
  }
}