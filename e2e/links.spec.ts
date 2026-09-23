import { test, expect } from '@playwright/test';

/**
 * Internal link audit. Crawls `/` and follows every same-origin link up to
 * depth 2, asserting no 4xx/5xx. Auth-gated routes that redirect to
 * `/sign-in` are treated as acceptable (the user must be signed in to see
 * them).
 */
test.describe('internal links', () => {
  const visited = new Set<string>();
  const broken: { from: string; to: string; status: number }[] = [];
  const maxDepth = 2;

  async function crawl(page: any, url: string, depth: number) {
    if (depth > maxDepth || visited.has(url)) return;
    visited.add(url);

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const links = await page.evaluate((origin: string) => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      return anchors
        .map((a) => a.getAttribute('href'))
        .filter((href): href is string => !!href)
        .filter((href) => {
          try {
            const u = new URL(href, origin);
            return u.origin === origin;
          } catch {
            return href.startsWith('/');
          }
        })
        .map((href) => new URL(href, page.url()).pathname);
    }, page.url());

    for (const href of links) {
      const target = new URL(href, page.url());
      const path = target.pathname;

      const [res] = await Promise.all([
        page.request.get(path, { failOnStatusCode: false }),
        depth < maxDepth ? crawl(page, path, depth + 1) : Promise.resolve(),
      ]);

      const status = res.status();
      // Auth-gated routes redirect to /sign-in — acceptable.
      if (status === 302 || status === 307) {
        const location = res.headers()['location'] || '';
        try {
          const redirect = new URL(location, page.url());
          if (redirect.pathname === '/sign-in') continue;
        } catch {
          /* not a relative redirect — treat as broken */
        }
      }
      if (status >= 400) {
        broken.push({ from: url, to: path, status });
      }
    }
  }

  test('no broken internal links', async ({ page }) => {
    await crawl(page, '/', 0);

    if (broken.length) {
      console.log('Broken links:');
      for (const b of broken) {
        console.log(`  ${b.from} -> ${b.to} (${b.status})`);
      }
    }
    expect(broken).toEqual([]);
  });
});