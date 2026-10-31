import { defineConfig } from 'vitest/config';

// Runs against a live local API (see `npm run test:e2e` at the repo root and docs/LOCAL_DEV.md).
export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['test/e2e/**/*.e2e-spec.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
    globalSetup: ['test/e2e/global-setup.ts'],
  },
});
