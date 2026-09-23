import type { Metadata, Viewport } from 'next';
import './globals.css';
import { fontClassName } from './fonts';
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_LOCALE,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
  TWITTER_HANDLE,
  absoluteUrl,
} from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Samiati — Preserving African Languages & Digital Storytelling',
  description: SITE_DESCRIPTION,
  metadataBase: new URL('https://samiati.com'),
  alternates: {
    canonical: '/',
    types: {
      'application/xml': [{ url: '/sitemap.xml' }],
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48', type: 'image/x-icon' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon-16.png',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    other: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: absoluteUrl('/'),
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    type: 'website',
    images: [
      {
        url: OG_IMAGE_PATH,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        alt: 'Samiati — Preserving African Languages',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: TWITTER_HANDLE || undefined,
    creator: TWITTER_HANDLE || undefined,
    images: [OG_IMAGE_PATH],
  },
};

// Resize the layout viewport when the on-screen keyboard opens so the
// bottom-pinned chat input stays visible above it on mobile. This is the
// only viewport setting the app needs; it is what makes the layout
// mobile-first (verified by scripts/check-mobile-first.mjs). We deliberately
// do NOT set user-scalable=no — WCAG 2.5.4 requires users to be able to
// zoom, and disabling it would fail the axe audit in e2e/a11y.spec.ts.
export const viewport: Viewport = {
  interactiveWidget: 'resizes-content',
};

import { TurnstileProvider } from '@/components/turnstile/TurnstileProvider';
import ConvexClientProvider from './ConvexClientProvider';
import { ToastProvider } from '@/hooks/useToast';
import { TranslationProvider } from '@/i18n/TranslationProvider';
import { ContributeFabProvider } from '@/components/changa/ContributeFabContext';
import { BrokenLinkReporter } from '@/components/shared/BrokenLinkReporter';
import {
  CookieConsentProvider,
  CookieConsentBanner,
  CookiePreferencesModal,
  ConsentAnalyticsGate,
} from '@/components/cookie-consent';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontClassName}`} style={{ viewTransitionName: 'root' }}>
      <head>
        <meta name="theme-color" content="#2b1e19" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" title="Samiati sitemap" />
        {/* Material Symbols Outlined — icon font used across the app.
            Loaded as a plain stylesheet (no JS) so it works during
            prerender and doesn't block the first paint. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
        {/* Inline script to apply theme before paint — prevents flash of wrong theme.
            Reads persisted setting from localStorage and adds 'dark' class if needed. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var settings = localStorage.getItem('samiati-settings');
                  if (settings) {
                    var parsed = JSON.parse(settings);
                    if (parsed.darkMode !== false) {
                      document.documentElement.classList.add('dark');
                    }
                  } else {
                    // Default to dark if no setting stored
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {
                  // Default to dark on any error
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased font-body bg-background text-foreground transition-colors duration-300">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground focus:shadow-lg"
        >
          Skip to content
        </a>
        <BrokenLinkReporter />
        <TurnstileProvider>
          <ConvexClientProvider>
            <TranslationProvider>
              <ContributeFabProvider>
                <ToastProvider>
                  <CookieConsentProvider>
                    {children}
                    <CookieConsentBanner />
                    <CookiePreferencesModal />
                    <ConsentAnalyticsGate />
                  </CookieConsentProvider>
                </ToastProvider>
              </ContributeFabProvider>
            </TranslationProvider>
          </ConvexClientProvider>
        </TurnstileProvider>
      </body>
    </html>
  );
}
