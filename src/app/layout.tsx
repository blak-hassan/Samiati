import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "Samiati",
  description: "Preserving African languages and digital storytelling",
};

// Resize the layout viewport when the on-screen keyboard opens so the
// bottom-pinned chat input stays visible above it on mobile.
export const viewport: Viewport = {
  interactiveWidget: "resizes-content",
};

import ConvexClientProvider from "./ConvexClientProvider";

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
        <ConvexClientProvider>{children}</ConvexClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
