import { test as base, expect, Page } from '@playwright/test';
import { SESSION_STORAGE_KEY, e2eSession } from '../data/session';
import { MockLog, MockRoutes, mockBackend } from './backend-mock';

/**
 * The `test` every spec imports: a stubbed backend and (by default) a seeded Supabase session.
 * Opt out per file with `test.use({ signedIn: false })`.
 */
export interface CustomerFixtures {
  signedIn: boolean;
  backendRoutes: MockRoutes;
  backend: MockLog;
}

/** Writes the session where supabase-js reads it, before any app script runs. */
async function seedSession(page: Page): Promise<void> {
  await page.addInitScript(([key, value]: string[]) => window.localStorage.setItem(key, value), [SESSION_STORAGE_KEY, JSON.stringify(e2eSession())]);
}

export const test = base.extend<CustomerFixtures>({
  signedIn: [true, { option: true }],
  backendRoutes: [{}, { option: true }],
  /* auto: every test gets the stubbed backend (and session) even if it never asks for `backend`. */
  backend: [
    async ({ page, signedIn, backendRoutes }, use) => {
      const log = await mockBackend(page, backendRoutes);
      if (signedIn) await seedSession(page);
      await use(log);
    },
    { auto: true },
  ],
  /* page.goto waits until the client app has rendered (html[data-app-ready], set by App): under
     `ng serve` the page is server-rendered first and the client then re-renders <ion-app>. */
  page: async ({ page }, use) => {
    const goto = page.goto.bind(page);
    page.goto = async (url, options) => {
      const response = await goto(url, options);
      await page.locator('html[data-app-ready]').waitFor({ state: 'attached' });
      return response;
    };
    await use(page);
  },
});

export { expect };

/**
 * The native <input> of an <ion-input> by its aria-label (Ionic moves the host's aria-label onto it).
 * Skips the temporary copy Ionic's mobile scroll assist adds while an input gains focus.
 */
export const field = (page: Page, label: string) => page.locator(`ion-input input[aria-label="${label}"]:not(.cloned-input)`);

/** The native <input> of an <ion-input> with a visible `label`. */
export const labeledField = (page: Page, label: string) => page.locator('ion-input', { hasText: label }).locator('input:not(.cloned-input)');
