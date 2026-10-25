import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    // `.kilo/**` matters as much as `e2e/**`: nested git worktrees live under
    // `.kilo/worktrees/<name>/` and contain their own full `e2e/` copies. The
    // `e2e/**` pattern only matches from the repo root, so without this the
    // Playwright specs inside those worktrees get collected by vitest and fail
    // with "Cannot find package '@playwright/test'".
    exclude: [
      'e2e/**',
      'qa/**',
      '.kilo/**',
      '.agent/**',
      '.agents/**',
      '.codex/**',
      '.opencode/**',
      '.github/**',
      'playwright.config.ts',
      'node_modules/**',
    ],
  },
  resolve: {
    alias: {
      '@': resolve(process.cwd(), 'src'),
    },
  },
});