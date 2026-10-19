import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'tsconfig',
    environment: 'node',
    include: ['**/*.spec.js'],
    watch: false,
    // The package only ships JSON files, so there is no JavaScript to measure coverage for.
    coverage: {
      enabled: false,
    },
  },
});
