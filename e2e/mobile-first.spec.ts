// e2e/mobile-first.spec.ts
// Mobile-first responsive audit. Runs axe (contrast + a11y) and layout
// assertions at four viewport widths on the public marketing routes.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const VIEWPORTS = [
  { name: 'xs', width: 320, height: 640 },
  { name: 'sm', width: 360, height: 720 },
  { name: 'md', width: 414, height: 823 },
  { name: 'lg', width: 768, height: 1024 },
];

const ROUTES = ['/', '/pricing', '/forgot-password'];

for (const vp of VIEWPORTS) {
  for (const route of ROUTES) {
    test(`mobile-first: ${route} @ ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(route, { waitUntil: 'domcontentloaded' });

      // 1. No horizontal overflow.
      const htmlWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(htmlWidth).toBeLessThanOrEqual(vp.width + 1);

      // 2. No clipped/overlapping text: every visible element must fit its
      //    container horizontally (a cheap proxy for "no truncation").
      const overflowing = await page.evaluate(() => {
        const nodes = Array.from(document.querySelectorAll<HTMLElement>('p, h1, h2, h3, h4, h5, h6, button, a, input, span, li'));
        const offenders: string[] = [];
        for (const el of nodes) {
          if (el.scrollWidth > el.clientWidth + 2) {
            offenders.push(`${el.tagName}:${(el.textContent || '').slice(0, 40)}`);
          }
        }
        return offenders.slice(0, 10);
      });
      expect(overflowing).toEqual([]);

      // 3. Tap targets are >= 44x44 (WCAG 2.5.5 target size).
      const smallTargets = await page.evaluate(() => {
        const nodes = Array.from(document.querySelectorAll<HTMLElement>('button, a, [role="button"], input[type="submit"], [onclick]'));
        const offenders: string[] = [];
        for (const el of nodes) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
            offenders.push(`${el.tagName}:${(el.textContent || '').slice(0, 30)} ${Math.round(rect.width)}x${Math.round(rect.height)}`);
          }
        }
        return offenders.slice(0, 10);
      });
      expect(smallTargets).toEqual([]);

      // 4. axe: no contrast or a11y violations.
      const results = await new AxeBuilder({ page }).analyze();
      const violations = results.violations.filter(
        (v) => v.ruleId === 'color-contrast' || v.ruleId === 'target-size',
      );
      expect(violations).toEqual([]);
    });
  }
}