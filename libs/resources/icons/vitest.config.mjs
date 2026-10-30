import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'icons',
    environment: 'node',
    include: ['**/*.spec.mjs'],
    watch: false,
    testTimeout: 30000,
    coverage: {
      enabled: true,
      provider: 'v8',
      include: ['scripts/build.mjs'],
      reportsDirectory: '../../../coverage/libs/resources/icons',
      reporter: ['html', 'lcovonly', 'json-summary', 'text-summary'],
      thresholds: {
        branches: 85,
        functions: 85,
        lines: 85,
        statements: 85,
      },
    },
  },
});
