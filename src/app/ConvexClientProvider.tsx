'use client';

import { ReactNode } from 'react';
import { ClerkProvider, useAuth } from '@clerk/nextjs';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexProvider } from 'convex/react';
import { UserSync } from './UserSync';
import { isDemoMode, clerkPublishableKey } from '@/lib/appMode';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

// Inner provider that checks auth status
function AuthenticatedConvexProvider({
  client,
  children,
  waitForAuth = true,
}: {
  client: ConvexReactClient;
  children: ReactNode;
  waitForAuth?: boolean;
}) {
  const { isLoaded } = useAuth();

  // Block until Clerk resolves (default) so authenticated data queries do
  // not flash empty. Public surfaces pass waitForAuth={false} so SSR ships
  // real content instead of a full-screen spinner.
  if (waitForAuth && !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-stone-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // A single provider type is used for signed-in and signed-out visitors:
  // ConvexProviderWithClerk attaches the Clerk token when a session exists
  // and leaves the client unauthenticated otherwise.
  //
  // Rendering one stable type matters. Switching between ConvexProvider and
  // ConvexProviderWithClerk once Clerk resolves remounts the entire subtree,
  // which throws away route state and re-runs every mount effect.
  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      <UserSync />
      {children}
    </ConvexProviderWithClerk>
  );
}

export default function ConvexClientProvider({
  children,
  waitForAuth = true,
  withClerkProvider = true,
}: {
  children: ReactNode;
  waitForAuth?: boolean;
  withClerkProvider?: boolean;
}) {
  // No Convex URL configured — render children directly
  if (!convex) {
    return <>{children}</>;
  }

  // Demo mode: connect to Convex directly without Clerk
  if (isDemoMode) {
    return <ConvexProvider client={convex}>{children}</ConvexProvider>;
  }

  const content = (
    <AuthenticatedConvexProvider client={convex} waitForAuth={waitForAuth}>
      {children}
    </AuthenticatedConvexProvider>
  );

  // When an ancestor already provides Clerk (the root layout does), skip the
  // nested provider — Clerk must only be mounted once per tree.
  if (!withClerkProvider) {
    return content;
  }

  // Production mode: use Clerk + Convex
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      {content}
    </ClerkProvider>
  );
}
