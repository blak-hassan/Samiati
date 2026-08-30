import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "Samiati — Preserving African Languages & Digital Storytelling",
  description: "Explore, learn, and contribute to African language preservation with AI-powered chat, voice messages, and community challenges.",
  openGraph: {
    title: "Samiati",
    description: "Preserving African languages and digital storytelling",
    url: "https://samiati.com",
    siteName: "Samiati",
    type: "website",
  },
};

// Resize the layout viewport when the on-screen keyboard opens so the
// bottom-pinned chat input stays visible above it on mobile.
export const viewport: Viewport = {
  interactiveWidget: "resizes-content",
};

import ConvexClientProvider from "./ConvexClientProvider";
import { ToastProvider } from "@/hooks/useToast";
import { TranslationProvider } from "@/i18n/TranslationProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ viewTransitionName: 'root' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Single combined stylesheet — loads all 3 families in one request */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700&family=Lexend:wght@400;500;600;700&display=swap"
        />
        {/* Material Symbols: non-render-blocking (swap-in after load) */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          as="style"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="antialiased font-body bg-background-light dark:bg-background-dark text-stone-900 dark:text-text-main transition-colors duration-300">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground focus:shadow-lg"
        >
          Skip to content
        </a>
        <ConvexClientProvider>
          <TranslationProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </TranslationProvider>
        </ConvexClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
