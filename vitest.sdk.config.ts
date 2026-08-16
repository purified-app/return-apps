import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['site/sdk/**/*.spec.ts'],
    environment: 'node',
  },
});
