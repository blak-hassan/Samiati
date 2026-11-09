import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import SettingsApplier from '@/components/settings/SettingsApplier';

export const metadata: Metadata = {
  title: 'Samiati',
  description: 'Ask, explore, and create with AI in the language you call home.',
  icons: { icon: '/samiati-logo.svg' },
};

// Resize the layout viewport when the on-screen keyboard opens so the
// bottom-pinned chat input stays visible above it on mobile.
export const viewport: Viewport = {
  interactiveWidget: 'resizes-content',
  viewportFit: 'cover',
};

import ClerkClientProvider from './ClerkClientProvider';
import ConvexClientProvider from './ConvexClientProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="dark"
      suppressHydrationWarning
      style={{ viewTransitionName: 'root' }}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700&family=Lexend:wght@400;500;600;700&display=swap"
        />
        {/* Material Symbols: non-render-blocking (swap-in after load) */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0,1,-50..200&display=swap"
          as="style"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0,1,-50..200&display=swap"
        />
      </head>
      <body className="antialiased font-body bg-background text-foreground">
        <SettingsApplier />
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        {/*
          Clerk is mounted once, at the root, so every route — including the
          sign-in, sign-up and forgot-password pages that render Clerk
          components — has auth context available. Convex lives here too, so
          routes outside /dashboard (checkout, settings/billing, the waitlist)
          can query the backend; the dashboard layout overrides it with an
          auth-aware provider that waits for Clerk to resolve.
        */}
        <ClerkClientProvider>
          <ConvexClientProvider waitForAuth={false} withClerkProvider={false}>
            {children}
          </ConvexClientProvider>
        </ClerkClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
