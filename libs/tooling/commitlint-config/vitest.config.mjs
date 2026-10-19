import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'commitlint-config',
    environment: 'node',
    include: ['**/*.spec.js'],
    watch: false,
    coverage: {
      enabled: true,
      provider: 'v8',
      include: ['index.js'],
      reportsDirectory: '../../../coverage/libs/tooling/commitlint-config',
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
