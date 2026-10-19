import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'eslint-plugin',
    environment: 'node',
    include: ['**/*.spec.js'],
    watch: false,
    coverage: {
      enabled: true,
      provider: 'v8',
      include: ['*.js', 'configs/*.js'],
      reportsDirectory: '../../../coverage/libs/tooling/eslint-plugin',
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
