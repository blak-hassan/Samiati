import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Samiati",
  description: "Preserving African languages and digital storytelling",
};

import ConvexClientProvider from "./ConvexClientProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="antialiased font-body bg-background-light dark:bg-background-dark text-stone-900 dark:text-text-main transition-colors duration-300">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
