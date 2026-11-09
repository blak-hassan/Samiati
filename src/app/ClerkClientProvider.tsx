'use client';

import { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { isDemoMode, clerkPublishableKey } from '@/lib/appMode';

/**
 * App-wide Clerk provider.
 *
 * Authentication is not scoped to the dashboard: the sign-in, sign-up and
 * forgot-password routes all render Clerk components and call `useClerk()`.
 * When the provider only lived under `/dashboard`, those routes threw
 * "useClerk can only be used within the <ClerkProvider /> component" — which
 * failed the production build at the prerender step.
 *
 * In demo mode (no Clerk key configured) the provider is skipped entirely so
 * the app still boots without authentication.
 */
export default function ClerkClientProvider({ children }: { children: ReactNode }) {
  if (isDemoMode) {
    return <>{children}</>;
  }

  return <ClerkProvider publishableKey={clerkPublishableKey}>{children}</ClerkProvider>;
}
