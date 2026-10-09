import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'nx-plugin',
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    watch: false,
    coverage: {
      enabled: true,
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/index.ts'],
      reportsDirectory: '../../../coverage/libs/tooling/nx-plugin',
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
