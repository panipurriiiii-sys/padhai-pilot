import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`. Requires Vite 8, which ships this option.
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    // auth/teacher specs hash with scrypt (CPU bound); on a busy machine (several agents/dev servers) the 5 s default
    // produced spurious timeouts. 30 s is far above normal (<1 s) and still fails hung tests.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
