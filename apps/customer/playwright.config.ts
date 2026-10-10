import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests for the customer app (modelled on the Meal Sehat admin setup).
 *
 * `npm run e2e` drives the real app in a real browser on a phone-sized viewport. Supabase and the
 * backend API are stubbed by default (e2e/fixtures/backend-mock.ts), so a run needs nothing but
 * this repo: no local Supabase, no API, no network.
 *
 * The browser is the installed Google Chrome (`channel: 'chrome'`), so no Playwright browser
 * download is needed. `E2E_PORT` moves the dev server off the default port when it is taken.
 */
const PORT = Number(process.env['E2E_PORT'] ?? 4320);

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: !process.env['CI'],
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : 2,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  outputDir: './e2e/.artifacts',
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
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'], channel: 'chrome' },
    },
  ],

  /* Starts `ng serve` unless something already answers on the port. */
  webServer: {
    command: `npx ng serve --port ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: !process.env['CI'],
    timeout: 300_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
