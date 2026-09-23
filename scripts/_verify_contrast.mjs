// _verify_contrast.mjs — WCAG contrast for the rasta-gold accent text used in
// the landing-page contrast fix. Pure math, no playwright/external deps.
function hex2rgb(h) {
  h = h.replace(/^#/, '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function lum(rgb) { return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]); }
function ratio(fg, bg) {
  const a = lum(fg);
  const b = lum(bg);
  const low = Math.min(a, b);
  const high = Math.max(a, b);
  return (high + 0.05) / (low + 0.05);
}
function check(fg, bg, label) {
  const r = ratio(hex2rgb(fg), hex2rgb(bg));
  const ok = r >= 4.5 ? 'PASS AA' : (r >= 3.0 ? 'PASS (large text only)' : 'FAIL AA');
  console.log(String(label).padEnd(46), fg.padEnd(9), 'on', bg.padEnd(9), '=>', r.toFixed(2) + ':1', ok);
}

// The rasta-gold accent text color now used on the landing page for:
//  - h1 accent span "African Languages."
//  - section label badges (Features / How It Works / Pricing / Testimonials / FAQ)
//  - trust-strip stat numbers
//  - step-circle numbers
//
// Surfaces and their dark-mode background colors:
check('#FFD700', '#2b1e19', 'rasta-gold on --background dark (main / sections)');
check('#FFD700', '#42342b', 'rasta-gold on --card dark (pricing/feature cards)');
check('#FFD700', '#342218', 'rasta-gold on step-circle tint (approx bg-primary/10 over #2b1e19)');

// Light theme is now reachable (the `dark` class is user-controlled — see
// src/lib/theme.ts). `text-gold` resolves to --gold, which is #B45309 on
// light surfaces and #FFD700 on dark ones (src/app/globals.css):
check('#B45309', '#FAF9F6', '--gold (light) on --background light (landing text)');
check('#B45309', '#ffffff', '--gold (light) on --card light');
check('#B45309', '#F1ECE8', '--gold (light) on bg-primary/10 tint over light bg');

// rasta-green checkmarks already present — sanity check they still pass on dark
check('#009B3A', '#2b1e19', 'rasta-green on --background dark (existing checkmarks)');
check('#009B3A', '#42342b', 'rasta-green on --card dark (existing checkmarks)');
