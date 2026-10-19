import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'src/tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
    globalSetup: ['./tests/global-setup.ts']
  }
});
