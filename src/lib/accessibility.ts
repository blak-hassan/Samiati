// src/lib/accessibility.ts
// WCAG 2.x contrast helpers. Pure (no React, no DOM) so it can run in Node
// scripts and in the browser alike.

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Parse a CSS hex color (#rgb, #rrggbb) into an RGB triple. */
export function parseHex(hex: string): Rgb | null {
  const m = hex.trim().replace(/^#/, '');
  if (m.length === 3) {
    return {
      r: parseInt(m[0] + m[0], 16),
      g: parseInt(m[1] + m[1], 16),
      b: parseInt(m[2] + m[2], 16),
    };
  }
  if (m.length === 6) {
    return {
      r: parseInt(m.slice(0, 2), 16),
      g: parseInt(m.slice(2, 4), 16),
      b: parseInt(m.slice(4, 6), 16),
    };
  }
  return null;
}

/** sRGB channel → linear light. */
function linearize(channel: number): number {
  const s = channel / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** Relative luminance per WCAG 2.x. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  return (
    0.2126 * linearize(r) +
    0.7152 * linearize(g) +
    0.0722 * linearize(b)
  );
}

/** Contrast ratio in range [1, 21]. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export type WcagLevel = 'AA' | 'AAA';
export type TextSize = 'normal' | 'large';

/**
 * WCAG 2.x success criterion thresholds.
 * - normal text / non-text components: AA 4.5:1, AAA 7:1
 * - large text (>= 18px, or >= 14px bold) / UI components: AA 3:1, AAA 4.5:1
 */
export function requiredRatio(level: WcagLevel, size: TextSize): number {
  if (level === 'AAA') return size === 'large' ? 4.5 : 7;
  return size === 'large' ? 3 : 4.5;
}

export interface ContrastCheck {
  fg: string;
  bg: string;
  ratio: number;
  required: number;
  pass: boolean;
  recommendation?: string;
}

export function checkContrast(
  fg: string,
  bg: string,
  level: WcagLevel = 'AA',
  size: TextSize = 'normal',
): ContrastCheck {
  const fgRgb = parseHex(fg);
  const bgRgb = parseHex(bg);
  if (!fgRgb || !bgRgb) {
    return { fg, bg, ratio: NaN, required: requiredRatio(level, size), pass: false };
  }
  const ratio = contrastRatio(fgRgb, bgRgb);
  const required = requiredRatio(level, size);
  const pass = ratio >= required;
  let recommendation: string | undefined;
  if (!pass) {
    // Suggest a darker/lighter gray that meets the target on the same bg.
    const target = required;
    const bgL = relativeLuminance(bgRgb);
    const fgL = relativeLuminance(fgRgb);
    const lighter = fgL > bgL;
    // Binary search for the closest gray that hits the target.
    let lo = 0;
    let hi = 255;
    let best = lighter ? 255 : 0;
    for (let i = 0; i < 32; i++) {
      const mid = Math.round((lo + hi) / 2);
      const midL = relativeLuminance({ r: mid, g: mid, b: mid });
      const r = lighter
        ? (midL + 0.05) / (bgL + 0.05)
        : (bgL + 0.05) / (midL + 0.05);
      if (r >= target) {
        best = mid;
        if (lighter) hi = mid - 1;
        else lo = mid + 1;
      } else if (lighter) {
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }
    recommendation = `#${best.toString(16).padStart(2, '0').repeat(3)}`;
  }
  return { fg, bg, ratio: Number(ratio.toFixed(2)), required, pass, recommendation };
}