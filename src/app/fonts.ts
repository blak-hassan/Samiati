// src/app/fonts.ts
// next/font/google generates zero-runtime, self-preloaded font CSS and
// enables font-display: swap. Replaces the <link rel="stylesheet"> blocks
// in layout.tsx so fonts no longer block the first render.
import { Outfit, Be_Vietnam_Pro, Lexend } from 'next/font/google';

export const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-display',
});

export const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-body',
});

export const lexend = Lexend({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-accent',
});

// Combined className for <html>.
export const fontClassName = `${outfit.variable} ${beVietnamPro.variable} ${lexend.variable}`;