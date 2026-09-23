import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
  // Performance gates — see docs/perf.md.
  {
    files: ['src/app/**/page.tsx', 'src/app/**/layout.tsx'],
    rules: {
      // 'use client' must live at the leaf, never on page/layout.
      // Warning for now: ~72 existing pages violate this. Ratchet to
      // "error" once a follow-up refactor migrates the existing offenders.
      // The ratchet is tracked in docs/perf.md §1.
      'no-restricted-syntax': [
        'warn',
        {
          selector: "ExpressionStatement > Literal[value='use client']",
          message:
            "Do not add 'use client' to page.tsx or layout.tsx. Make the page a Server Component and put 'use client' at the leaf. See docs/perf.md §1.",
        },
      ],
    },
  },
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      // Barrel imports from lucide-react defeat tree-shaking.
      // Warning (not error) so we can ratchet down as files are migrated.
      // We forbid the import entirely; the repo enables
      // `experimental.optimizePackageImports: ["lucide-react"]` in
      // next.config.ts, which tree-shakes named imports without needing
      // subpath imports. The doc rule (docs/perf.md §3) is the source of
      // truth — this ESLint rule is a defence-in-depth check that points
      // devs at the doc when a new file is added that opts out of the
      // pattern.
      'no-restricted-imports': [
        'warn',
        {
          paths: [
            {
              name: 'lucide-react',
              message:
                'lucide-react imports are discouraged in src/components/** — see docs/perf.md §3. The bundle is optimized via next.config.ts; prefer named imports in new code.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/index.ts', 'src/**/index.tsx'],
    rules: {
      // Barrel index re-exports pull whole features into one bundle.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportAllDeclaration',
          message:
            'Barrel re-exports (export * from ...) under src/**/index.ts are not allowed. Use deep imports. See docs/perf.md §1.',
        },
      ],
    },
  },
]);

export default eslintConfig;
