import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end setup for Thaliyo Rider (modelled on the Meal Sehat admin website).
 *
 * `npm run e2e` drives the real app in a real browser on a phone-sized viewport. Supabase Auth and
 * the backend API are stubbed (e2e/fixtures/backend-mock.ts), so a run needs nothing but this repo.
 *
 * The port is overridable: `reuseExistingServer` attaches to whatever answers on it, so with
 * something else already there `E2E_PORT=4399 npm run e2e` steps around it.
 */
const PORT = Number(process.env['E2E_PORT'] ?? 4303);

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: !process.env['CI'],
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : 2,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never', outputFolder: 'e2e/.artifacts/report' }]],
  outputDir: './e2e/.artifacts/results',
  timeout: 60_000,

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: { slowMo: Number(process.env['E2E_SLOW_MO'] ?? 0) },
  },

  projects: [
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
    },
  ],

  /** Starts `ng serve` (SSR dev server) unless something already answers on the port. */
  webServer: {
    command: `npm start -- --port ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: !process.env['CI'],
    timeout: 240_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
