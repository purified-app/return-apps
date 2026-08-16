import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  use: {
    baseURL: 'http://127.0.0.1:4204',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'bun run start:pin -- --host 127.0.0.1 --port 4204',
    url: 'http://127.0.0.1:4204',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
