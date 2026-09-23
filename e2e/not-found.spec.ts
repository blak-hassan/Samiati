import { test, expect } from '@playwright/test';

/**
 * Branded 404 page. Next renders `not-found.tsx` for unknown routes and for
 * every `notFound()` call (see src/app/auth/[slug]/page.tsx and
 * src/app/dashboard/[slug]/page.tsx). The page must return a real 404 status,
 * carry the branded heading, and offer a working recovery link.
 */
test.describe('not-found', () => {
  test('unknown route returns branded 404', async ({ page, request }) => {
    // The route itself must 404 (Next serves not-found.tsx with a 404 status).
    const response = await request.get('/this-route-does-not-exist');
    expect(response.status()).toBe(404);

    await page.goto('/this-route-does-not-exist');

    await expect(page.locator('h1', { hasText: '404' })).toBeVisible();
    await expect(page.locator('text=Page not found')).toBeVisible();
    await expect(
      page.locator('text=The page you were looking for doesn'),
    ).toBeVisible();

    // JSON-LD breadcrumb for structured data.
    const ld = page.locator('script[type="application/ld+json"]');
    await expect(ld).toHaveCount(1);
    const json = JSON.parse((await ld.textContent()) || '{}');
    expect(json['@type']).toBe('BreadcrumbList');

    // robots meta must be noindex on a 404.
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute('content', /noindex/);

    // Recovery link works.
    const homeLink = page.locator('a', { hasText: 'Back to home' });
    await expect(homeLink).toHaveAttribute('href', '/');
    await homeLink.click();
    await expect(page).toHaveURL('/');
  });

  test('auth slug that does not map to a screen renders 404', async ({ page, request }) => {
    const response = await request.get('/auth/definitely-not-a-real-auth-slug');
    expect(response.status()).toBe(404);
    await page.goto('/auth/definitely-not-a-real-auth-slug');
    await expect(page.locator('text=Page not found')).toBeVisible();
  });
});