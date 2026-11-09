import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
  test: {
    // Only run this repository's own tests.
    //
    // The agent worktrees (`.kilo/worktrees/…`, `.opencode/…`, `.next/…`) each
    // contain a full copy of the project, including their own copies of the
    // test suite. Without an explicit include, vitest discovers those copies
    // too and the run fails on stale snapshots that belong to another
    // checkout.
    include: [
      "tests/**/*.{test,spec}.{ts,tsx}",
      "src/**/*.{test,spec}.{ts,tsx}",
      "convex/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: [
      ...configDefaults.exclude,
      "**/.kilo/**",
      "**/.agent/**",
      "**/.agents/**",
      "**/.codex/**",
      "**/.opencode/**",
      "**/.vercel/**",
      "**/.next/**",
      "**/worktrees/**",
    ],
  },
});
